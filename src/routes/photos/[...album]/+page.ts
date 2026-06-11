import { readJsonResponse } from '$lib/http/json';
import type { PhotoImage } from '$lib/photos/types';

type AlbumResponse = { album: string; images: PhotoImage[]; error?: string };

export async function load({ fetch, params }) {
  const response = await fetch(`/photos/api/albums/${encodeURIComponent(params.album)}`);
  const data = await readJsonResponse<AlbumResponse>(response, isAlbumResponse);

  if (!data) {
    return { album: params.album, images: [] as PhotoImage[], error: 'Unable to read photo album' };
  }

  return { album: data.album, images: data.images, error: data.error };
}

function isAlbumResponse(data: unknown): data is AlbumResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'album' in data &&
    'images' in data &&
    typeof data.album === 'string' &&
    Array.isArray(data.images)
  );
}
