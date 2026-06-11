import { json } from '@sveltejs/kit';
import { listAlbumImages } from '$lib/server/photos';

export async function GET({ params }) {
  try {
    return json({ album: params.album, images: await listAlbumImages(params.album) });
  } catch {
    return json(
      { album: params.album, images: [], error: 'Unable to read photo album' },
      { status: 404 },
    );
  }
}
