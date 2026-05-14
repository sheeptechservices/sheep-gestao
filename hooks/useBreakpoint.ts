'use client'
import { useState, useEffect } from 'react'

const MOBILE_BP  = 768   // < 768  → mobile
const TABLET_BP  = 1024  // < 1024 → tablet

export function useBreakpoint() {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  )

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler, { passive: true })
    // Sync on mount (SSR gives 1280 as fallback)
    setWidth(window.innerWidth)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return {
    width,
    isMobile:  width < MOBILE_BP,
    isTablet:  width >= MOBILE_BP && width < TABLET_BP,
    isDesktop: width >= TABLET_BP,
  }
}
