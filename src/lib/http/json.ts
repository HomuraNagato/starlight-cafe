export async function readJsonResponse<T>(
  response: Response,
  isExpectedShape: (data: unknown) => data is T,
) {
  if (!response.ok) {
    return null;
  }

  try {
    const data: unknown = await response.json();
    return isExpectedShape(data) ? data : null;
  } catch {
    return null;
  }
}
