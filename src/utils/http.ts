export async function fetchText(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<{ status: number; headers: Headers; body: string; url: string }> {
  const controller = new AbortController();
  const timeoutMs = init?.timeoutMs ?? 10_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, {
    ...init,
    signal: controller.signal
  });
  const body = await response.text();
  clearTimeout(timeout);

  return {
    status: response.status,
    headers: response.headers,
    body,
    url: response.url
  };
}
