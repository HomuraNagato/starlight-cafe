import { json } from '@sveltejs/kit';
import { logServerError } from '$lib/server/logging';
import { prewarmAlbumThumbnails } from '$lib/server/photos';

export async function POST({ params }) {
  void prewarmAlbumThumbnails(params.album).catch((error) => {
    logServerError('photos.prewarm', error, { album: params.album });
  });

  return json({ ok: true });
}
