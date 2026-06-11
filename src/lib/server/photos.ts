import { env } from '$env/dynamic/private';
import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { Readable } from 'node:stream';
import { promisify } from 'node:util';
import type { PhotoAlbum, PhotoImage, PhotoMetadata } from '$lib/photos/types';

const DEFAULT_PHOTOS_ROOT = '/exos/nagato/Pictures/Photos/events';
const DEFAULT_THUMBNAIL_ROOT = '/tmp/starlight-cafe/photo-thumbnails';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const THUMBNAIL_VERSION = 'contain-960-v1';
const METADATA_CONCURRENCY = 6;
const execFileAsync = promisify(execFile);
const activePrewarmAlbums = new Set<string>();
const activeMetadataReads = new Map<string, Promise<PhotoMetadata>>();
const metadataCache = new Map<string, PhotoMetadata>();

type PhotoDerivative = {
  size: string;
  quality: string;
  version: string;
};

const PHOTO_DERIVATIVES = {
  thumb: {
    size: '960x960',
    quality: '82',
    version: THUMBNAIL_VERSION,
  },
} satisfies Record<string, PhotoDerivative>;

export function photosRoot() {
  return path.resolve(env.PHOTOS_ROOT || DEFAULT_PHOTOS_ROOT);
}

export function thumbnailRoot() {
  return path.resolve(env.PHOTOS_THUMBNAIL_ROOT || DEFAULT_THUMBNAIL_ROOT);
}

export function isImageFile(filename: string) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

export function encodePhotoPath(relativePath: string) {
  return relativePath
    .split(path.sep)
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

export function resolvePhotoPath(relativePath = '') {
  const root = photosRoot();
  const resolved = path.resolve(root, relativePath);

  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid photo path');
  }

  return resolved;
}

export async function listAlbums(): Promise<PhotoAlbum[]> {
  const root = photosRoot();
  const entries = await readdir(root, { withFileTypes: true });
  const albums = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const imagePaths = await listImagePaths(path.join(root, entry.name), entry.name);
        const coverPath = coverPathForAlbum(imagePaths, entry.name);
        const modifiedAt = coverPath
          ? await latestModifiedAt(imagePaths.map((imagePath) => path.join(root, imagePath)))
          : 0;

        return {
          id: entry.name,
          title: entry.name,
          imageCount: imagePaths.length,
          modifiedAt,
          coverFilename: coverPath ? path.basename(coverPath) : null,
          coverUrl: coverPath ? `/photos/image/${encodePhotoPath(coverPath)}` : null,
          coverThumbUrl: coverPath ? thumbnailUrlFor(coverPath) : null,
        };
      }),
  );

  return albums
    .filter((album) => album.imageCount > 0)
    .sort((a, b) => b.title.localeCompare(a.title, undefined, { numeric: true }));
}

export async function listAlbumImages(albumId: string): Promise<PhotoImage[]> {
  const albumPath = resolvePhotoPath(albumId);
  const imagePaths = await listImagePaths(albumPath, albumId);

  return mapWithConcurrency(imagePaths, METADATA_CONCURRENCY, async (imagePath) => {
    const fileStat = await stat(resolvePhotoPath(imagePath));
    const encodedPath = encodePhotoPath(imagePath);

    return {
      id: imagePath,
      filename: path.basename(imagePath),
      albumId,
      modifiedAt: fileStat.mtimeMs,
      metadata: await metadataForImage(resolvePhotoPath(imagePath), fileStat),
      thumbUrl: thumbnailUrlFor(imagePath),
      imageUrl: `/photos/image/${encodedPath}`,
      downloadUrl: `/photos/download/${encodedPath}`,
    };
  });
}

export async function getImageResponse(relativePath: string, disposition: 'inline' | 'attachment') {
  const filePath = resolvePhotoPath(relativePath);
  const fileStat = await stat(filePath);

  if (!fileStat.isFile() || !isImageFile(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const filename = path.basename(filePath);
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      'content-length': String(fileStat.size),
      'content-type': contentTypeFor(filePath),
      'content-disposition': `${disposition}; filename="${filename.replaceAll('"', '')}"`,
      'cache-control': 'private, max-age=3600',
    },
  });
}

export async function getThumbnailResponse(relativePath: string) {
  return getDerivativeResponse(relativePath, PHOTO_DERIVATIVES.thumb);
}

async function getDerivativeResponse(relativePath: string, derivative: PhotoDerivative) {
  const filePath = resolvePhotoPath(relativePath);
  const fileStat = await stat(filePath);

  if (!fileStat.isFile() || !isImageFile(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const thumbnailPath = await ensureDerivative(
    filePath,
    relativePath,
    fileStat.mtimeMs,
    derivative,
  );
  const thumbnailStat = await stat(thumbnailPath);
  const stream = Readable.toWeb(createReadStream(thumbnailPath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      'content-length': String(thumbnailStat.size),
      'content-type': 'image/jpeg',
      'cache-control': 'private, max-age=86400',
    },
  });
}

export async function ensureThumbnailFor(relativePath: string) {
  const filePath = resolvePhotoPath(relativePath);
  const fileStat = await stat(filePath);

  if (!fileStat.isFile() || !isImageFile(filePath)) {
    return;
  }

  await ensureDerivative(filePath, relativePath, fileStat.mtimeMs, PHOTO_DERIVATIVES.thumb);
}

export async function prewarmAlbumThumbnails(albumId: string) {
  if (activePrewarmAlbums.has(albumId)) {
    return;
  }

  activePrewarmAlbums.add(albumId);

  try {
    const albumPath = resolvePhotoPath(albumId);
    const imagePaths = await listImagePaths(albumPath, albumId);

    for (const imagePath of imagePaths) {
      await ensureThumbnailFor(imagePath);
    }
  } finally {
    activePrewarmAlbums.delete(albumId);
  }
}

async function mapWithConcurrency<T, U>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<U>,
) {
  const results = new Array<U>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));

  return results;
}

async function listImagePaths(directory: string, relativeDirectory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      const relativePath = path.join(relativeDirectory, entry.name);

      if (entry.isDirectory()) {
        return listImagePaths(entryPath, relativePath);
      }

      if (entry.isFile() && isImageFile(entry.name)) {
        return [relativePath];
      }

      return [];
    }),
  );

  return nested.flat().sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function latestModifiedAt(filePaths: string[]) {
  const stats = await Promise.all(filePaths.map((filePath) => stat(filePath)));

  return Math.max(...stats.map((fileStat) => fileStat.mtimeMs));
}

function coverPathForAlbum(imagePaths: string[], albumId: string) {
  return (
    imagePaths.find((imagePath) => isRootCoverImage(imagePath, albumId)) ?? imagePaths[0] ?? null
  );
}

function isRootCoverImage(imagePath: string, albumId: string) {
  return (
    path.dirname(imagePath) === albumId && path.basename(imagePath).toLowerCase() === 'cover.jpg'
  );
}

function metadataCacheKey(filePath: string, mtimeMs: number, sizeBytes: number) {
  return `${filePath}:${mtimeMs}:${sizeBytes}`;
}

async function metadataForImage(filePath: string, fileStat: { mtimeMs: number; size: number }) {
  const cacheKey = metadataCacheKey(filePath, fileStat.mtimeMs, fileStat.size);
  const cachedMetadata = metadataCache.get(cacheKey);

  if (cachedMetadata) {
    return cachedMetadata;
  }

  const activeRead = activeMetadataReads.get(cacheKey);

  if (activeRead) {
    return activeRead;
  }

  const readPromise = readImageMetadata(filePath, fileStat.size)
    .then((metadata) => {
      metadataCache.set(cacheKey, metadata);
      return metadata;
    })
    .finally(() => {
      activeMetadataReads.delete(cacheKey);
    });

  activeMetadataReads.set(cacheKey, readPromise);

  return readPromise;
}

async function readImageMetadata(filePath: string, sizeBytes: number): Promise<PhotoMetadata> {
  const fallback = {
    sizeBytes,
    width: null,
    height: null,
    takenAt: null,
    cameraModel: null,
  };

  try {
    const { stdout } = await execFileAsync('identify', [
      '-quiet',
      '-format',
      '%w\t%h\t%[EXIF:DateTimeOriginal]\t%[EXIF:Model]',
      filePath,
    ]);
    const [width, height, dateTaken, cameraModel] = stdout.split('\t');

    return {
      sizeBytes,
      width: numberOrNull(width),
      height: numberOrNull(height),
      takenAt: dateTaken ? parseExifDate(dateTaken) : null,
      cameraModel: cameraModel?.trim() || null,
    };
  } catch {
    return fallback;
  }
}

function numberOrNull(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseExifDate(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second] = match;
  const timestamp = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function contentTypeFor(filename: string) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === '.png') {
    return 'image/png';
  }

  if (extension === '.webp') {
    return 'image/webp';
  }

  if (extension === '.gif') {
    return 'image/gif';
  }

  if (extension === '.avif') {
    return 'image/avif';
  }

  return 'image/jpeg';
}

async function ensureDerivative(
  filePath: string,
  relativePath: string,
  mtimeMs: number,
  derivative: PhotoDerivative,
) {
  const cacheKey = crypto
    .createHash('sha256')
    .update(`${relativePath}:${mtimeMs}:${derivative.version}`)
    .digest('hex');
  const outputPath = path.join(thumbnailRoot(), `${cacheKey}.jpg`);

  try {
    await stat(outputPath);
    return outputPath;
  } catch {
    await mkdir(thumbnailRoot(), { recursive: true });
  }

  await execFileAsync('convert', [
    filePath,
    '-auto-orient',
    '-thumbnail',
    derivative.size,
    '-quality',
    derivative.quality,
    outputPath,
  ]);

  return outputPath;
}

function thumbnailUrlFor(relativePath: string) {
  return `/photos/thumb/${encodePhotoPath(relativePath)}?v=${THUMBNAIL_VERSION}`;
}
