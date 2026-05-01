import type {LucideIcon} from 'lucide-react'
import {lookupIcon} from './allLucideIcons'

export type {LucideIcon}

export const DEFAULT_BUTTON_ICON = 'ArrowRight'

export function getButtonIcon(name: string): LucideIcon | null {
    return lookupIcon(name)
}
