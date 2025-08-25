import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add focus-visible polyfill for better keyboard navigation
    import('focus-visible' as any).catch((err: any) => {
      console.warn('focus-visible polyfill not available:', err)
    })
  }, [])

  return <Component {...pageProps} />
}