// Base URL for the Java Spring Boot backend.
// Set NEXT_PUBLIC_API_URL in your .env.local for deployment.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"

// Typed fetch wrapper for all backend calls
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!res.ok) {
    let message: string
    try {
      const body = await res.json()
      message = body?.error ?? body?.message ?? res.statusText
    } catch {
      message = await res.text().catch(() => res.statusText)
    }
    throw new Error(`API error ${res.status}: ${message}`)
  }

  // Handle 204 No Content (DELETE endpoints)
  if (res.status === 204) return undefined as T

  return res.json()
}
