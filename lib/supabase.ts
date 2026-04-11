type SupabaseConfig = {
  url: string
  anonKey: string
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return {
    url: url.replace(/\/$/, ""),
    anonKey,
  }
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, anonKey } = getSupabaseConfig()

  const headers = new Headers(init.headers)
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  headers.set("apikey", anonKey)
  headers.set("Authorization", `Bearer ${anonKey}`)

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Supabase REST error: ${response.status}`)
  }

  const body = await response.text()
  return (body ? JSON.parse(body) : null) as T
}
