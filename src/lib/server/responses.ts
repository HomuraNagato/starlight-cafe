export async function responseOrNotFound(getResponse: () => Promise<Response>) {
  try {
    return await getResponse();
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
