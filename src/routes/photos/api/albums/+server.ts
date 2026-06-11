import { json } from '@sveltejs/kit';
import { listAlbums } from '$lib/server/photos';

export async function GET() {
  try {
    return json({ albums: await listAlbums() });
  } catch {
    return json({ albums: [], error: 'Unable to read photo albums' }, { status: 500 });
  }
}
