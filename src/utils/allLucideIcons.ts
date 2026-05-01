import type {LucideIcon} from 'lucide-react'
import {icons} from 'lucide-react'

export interface IconEntry {
    name: string
    label: string
    Icon: LucideIcon
}

function toLabel(name: string): string {
    return name.replace(/([A-Z])/g, ' $1').trim()
}

export const ALL_ICONS: IconEntry[] = Object.entries(icons)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, Icon]) => ({name, label: toLabel(name), Icon: Icon as LucideIcon}))

const ICON_MAP = icons as Record<string, LucideIcon>

export function lookupIcon(name: string): LucideIcon | null {
    return ICON_MAP[name] ?? null
}
