const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

let accessToken: string | null = null

export function hasClientId() {
  return Boolean(CLIENT_ID && CLIENT_ID.length > 0)
}

export function isGoogleReady() {
  return typeof window !== 'undefined' && (window as any).google && hasClientId()
}

export async function waitForGoogle(maxMs = 5000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    // @ts-ignore
    if ((window as any).google) return true
    await new Promise((r) => setTimeout(r, 100))
  }
  return false
}

export async function getAccessToken(scope = 'https://www.googleapis.com/auth/calendar') {
  return new Promise<string>(async (resolve, reject) => {
    try {
      if (!hasClientId()) throw new Error('Missing VITE_GOOGLE_CLIENT_ID')
      const loaded = await waitForGoogle()
      if (!loaded) throw new Error('Google script not loaded')
      const google: any = (window as any).google
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope,
        callback: (tokenResponse: any) => {
          accessToken = tokenResponse.access_token
          resolve(accessToken!)
        },
      })
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } catch (e) {
      reject(e)
    }
  })
}

export function getStoredAccessToken() {
  return accessToken
}

export function revokeAccessToken() {
  const google: any = (window as any).google
  if (accessToken && google?.accounts?.oauth2?.revoke) {
    google.accounts.oauth2.revoke(accessToken, () => {
      accessToken = null
    })
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  if (!accessToken) throw new Error('No Google access token')
  const res = await fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json()
}

export async function listPrimaryEvents(timeMin?: string, timeMax?: string) {
  const params = new URLSearchParams()
  if (timeMin) params.set('timeMin', timeMin)
  if (timeMax) params.set('timeMax', timeMax)
  params.set('singleEvents', 'true')
  params.set('orderBy', 'startTime')
  return apiFetch(`calendars/primary/events?${params.toString()}`)
}

export async function insertPrimaryEvent(event: {
  summary: string
  description?: string
  start: { dateTime: string }
  end: { dateTime: string }
}) {
  return apiFetch('calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(event),
  })
}
