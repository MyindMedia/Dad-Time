import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import faviconUrl from '../assets/dad_time_text_logo.png'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Dynamically set favicon and touch icon to bundled asset
try {
  const linkIcon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (linkIcon) linkIcon.href = faviconUrl
  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  if (appleIcon) appleIcon.href = faviconUrl
} catch {}
