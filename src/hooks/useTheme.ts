import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

const mq = window.matchMedia('(prefers-color-scheme: dark)')
const systemTheme = (): Theme => (mq.matches ? 'dark' : 'light')

export function useTheme(): [Theme, () => void] {
  // null = follow system, 'light'/'dark' = user override
  const [override, setOverride] = useState<Theme | null>(() => {
    return localStorage.getItem('ui-theme') as Theme | null
  })

  const [system, setSystem] = useState<Theme>(systemTheme)

  const theme = override ?? system

  // Apply theme attribute whenever resolved theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Persist override (or remove it when following system)
  useEffect(() => {
    if (override) {
      localStorage.setItem('ui-theme', override)
    } else {
      localStorage.removeItem('ui-theme')
    }
  }, [override])

  // React to OS preference changes (only visible when no override)
  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Toggle: if currently following system, set explicit override to opposite of system.
  // If already overridden, clear the override to return to system.
  const toggle = () => {
    setOverride(prev => {
      if (prev === null) {
        // Following system — override to the opposite
        return system === 'dark' ? 'light' : 'dark'
      }
      // Already overriding — clear to follow system again
      return null
    })
  }

  return [theme, toggle]
}
