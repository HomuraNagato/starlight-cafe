import { readJsonResponse } from '$lib/http/json';
import type { PhotoAlbum } from '$lib/photos/types';

type AlbumsResponse = { albums: PhotoAlbum[]; error?: string };

export async function load({ fetch }) {
  const response = await fetch('/photos/api/albums');
  const data = await readJsonResponse<AlbumsResponse>(response, isAlbumsResponse);

  if (!data) {
    return { albums: [] as PhotoAlbum[], error: 'Unable to read photo albums' };
  }

  return { albums: data.albums, error: data.error };
}

function isAlbumsResponse(data: unknown): data is AlbumsResponse {
  return (
    typeof data === 'object' && data !== null && 'albums' in data && Array.isArray(data.albums)
  );
}
