import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function PageTransition({ children }: Props) {
  const location = useLocation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
    const t = setTimeout(() => setReady(true), 0)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div
      key={location.pathname}
      className={`transition-all duration-300 ease-out transform ${
        ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  )
}
