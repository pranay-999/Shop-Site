// This is the base URL of your Java Spring Boot server.
// When running locally: http://localhost:8080/api
// When deployed: replace with your server's public URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api"

// A helper function to make requests to your Java backend
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const message = await res.text()
    throw new Error(`API error ${res.status}: ${message}`)
  }
  return res.json()
}