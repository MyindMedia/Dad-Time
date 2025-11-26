let loading = false
let loaded = false

export function isMapsReady() {
  return typeof window !== 'undefined' && (window as any).google?.maps
}

export function loadGoogleMaps(apiKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (isMapsReady()) {
      loaded = true
      resolve()
      return
    }
    if (loading) {
      const check = setInterval(() => {
        if (isMapsReady()) {
          clearInterval(check)
          loaded = true
          resolve()
        }
      }, 100)
      return
    }
    loading = true
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry,places`
    script.async = true
    script.defer = true
    script.onload = () => {
      loaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })
}
