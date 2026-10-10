const USER_KEY = 'starhub-demo-user-id'

export function getDemoUserId(): string | null {
  return sessionStorage.getItem(USER_KEY)
}

export function setDemoUserId(id: string) {
  sessionStorage.setItem(USER_KEY, id)
}

export function clearDemoUser() {
  sessionStorage.removeItem(USER_KEY)
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const userId = getDemoUserId()
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (userId) {
    headers.set('X-Demo-User-Id', userId)
  }
  const res = await fetch(path, { ...init, headers })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { detail?: string }
    throw new Error(body.detail ?? `API ${res.status}`)
  }
  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}
