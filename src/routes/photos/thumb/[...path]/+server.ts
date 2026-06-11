import { responseOrNotFound } from '$lib/server/responses';
import { getThumbnailResponse } from '$lib/server/photos';

export async function GET({ params }) {
  return responseOrNotFound(() => getThumbnailResponse(params.path));
}
