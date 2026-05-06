export async function fetchText(
  url: string,
  init?: RequestInit
): Promise<{ status: number; headers: Headers; body: string }> {
  const response = await fetch(url, init);
  const body = await response.text();

  return {
    status: response.status,
    headers: response.headers,
    body
  };
}
