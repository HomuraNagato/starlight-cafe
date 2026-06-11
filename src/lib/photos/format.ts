import type { PhotoImage } from '$lib/photos/types';

export function formatDate(timestamp: number | null) {
  if (!timestamp) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

export function formatBytes(sizeBytes: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: sizeBytes >= 1024 * 1024 ? 1 : 0,
    style: 'unit',
    unit: sizeBytes >= 1024 * 1024 ? 'megabyte' : 'kilobyte',
    unitDisplay: 'short',
  }).format(sizeBytes >= 1024 * 1024 ? sizeBytes / 1024 / 1024 : sizeBytes / 1024);
}

export function dimensionsFor(image: PhotoImage) {
  if (!image.metadata.width || !image.metadata.height) {
    return '';
  }

  return `${image.metadata.width} x ${image.metadata.height}`;
}

export function dateFor(image: PhotoImage) {
  return formatDate(image.metadata.takenAt ?? image.modifiedAt);
}
