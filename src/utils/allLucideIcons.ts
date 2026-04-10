import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface IconEntry {
  name: string
  label: string
  Icon: LucideIcon
}

function toLabel(name: string): string {
  return name.replace(/([A-Z])/g, ' $1').trim()
}

// All lucide icon components are uppercase-named functions
const NON_ICONS = new Set(['createLucideIcon'])

export const ALL_ICONS: IconEntry[] = Object.entries(LucideIcons)
  .filter(([name, val]) =>
    typeof val === 'function' &&
    /^[A-Z]/.test(name) &&
    !NON_ICONS.has(name)
  )
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, Icon]) => ({ name, label: toLabel(name), Icon: Icon as LucideIcon }))

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ALL_ICONS.map(({ name, Icon }) => [name, Icon])
)

export function lookupIcon(name: string): LucideIcon | null {
  return ICON_MAP[name] ?? null
}
