// B-02: Google Safe Browsing v4 — threat check via Supabase proxy.
//
// The API key lives in the edge function's environment (Supabase secrets)
// and is never shipped inside the extension bundle.
//
// Results are cached per service-worker lifetime to avoid redundant calls.
// Fails open on any error so a Supabase outage never blocks browsing.

const PROXY_URL = `${import.meta.env['VITE_SUPABASE_URL'] as string}/functions/v1/check-url`

export type CheckResult = 'safe' | 'warn' | 'block'

// In-memory cache; lives as long as the service worker is alive.
const cache = new Map<string, CheckResult>()

export async function checkUrl(url: string): Promise<CheckResult> {
  // No Supabase URL configured (dev / missing .env) — skip check.
  if (!PROXY_URL || PROXY_URL === '/functions/v1/check-url') return 'safe'

  const hit = cache.get(url)
  if (hit) return hit

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })

    if (!res.ok) {
      console.warn('[SeniorBrowse] Safe Browsing proxy error:', res.status)
      return 'safe'
    }

    const data = (await res.json()) as { result?: string }
    const result: CheckResult =
      data.result === 'warn' || data.result === 'block' ? data.result : 'safe'

    cache.set(url, result)
    return result
  } catch (err) {
    // Network error → fail open (don't block the user on an outage).
    console.warn('[SeniorBrowse] Safe Browsing check failed:', err)
    return 'safe'
  }
}
