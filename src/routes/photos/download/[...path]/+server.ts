import { responseOrNotFound } from '$lib/server/responses';
import { getImageResponse } from '$lib/server/photos';

export async function GET({ params }) {
  return responseOrNotFound(() => getImageResponse(params.path, 'attachment'));
}
