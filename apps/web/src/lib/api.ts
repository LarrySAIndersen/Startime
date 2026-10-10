/**
 * Typed API client (OpenAPI-generated in a later task).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:5080";

export async function fetchMe(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/me`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`API /me failed: ${res.status}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}
