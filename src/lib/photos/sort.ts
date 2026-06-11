import type { PhotoAlbum, PhotoImage } from '$lib/photos/types';

export type AlbumSortMode = 'title-asc' | 'newest' | 'oldest';
export type PhotoSortMode = 'filename-asc' | 'newest' | 'oldest';
export type PhotoViewMode = 'square' | 'fit' | 'large';

export function isAlbumSortMode(value: string | null): value is AlbumSortMode {
  return value === 'title-asc' || value === 'newest' || value === 'oldest';
}

export function isPhotoSortMode(value: string | null): value is PhotoSortMode {
  return value === 'filename-asc' || value === 'newest' || value === 'oldest';
}

export function isPhotoViewMode(value: string | null): value is PhotoViewMode {
  return value === 'square' || value === 'fit' || value === 'large';
}

export function sortAlbums(albums: PhotoAlbum[], mode: AlbumSortMode) {
  return [...albums].sort((firstAlbum, secondAlbum) => {
    if (mode === 'newest') {
      return secondAlbum.modifiedAt - firstAlbum.modifiedAt;
    }

    if (mode === 'oldest') {
      return firstAlbum.modifiedAt - secondAlbum.modifiedAt;
    }

    return firstAlbum.title.localeCompare(secondAlbum.title, undefined, { numeric: true });
  });
}

export function sortPhotos(images: PhotoImage[], mode: PhotoSortMode) {
  return [...images].sort((firstImage, secondImage) => {
    if (mode === 'newest') {
      return secondImage.modifiedAt - firstImage.modifiedAt;
    }

    if (mode === 'oldest') {
      return firstImage.modifiedAt - secondImage.modifiedAt;
    }

    return firstImage.filename.localeCompare(secondImage.filename, undefined, { numeric: true });
  });
}
