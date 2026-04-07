import {
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  Plus, Minus, Check, X,
  Search, Pencil, Trash2, Save, Download, Upload,
  Home, Settings, User, Heart, Star, Info,
  Play, Mail, Lock, Share2, Copy, RefreshCw,
  Bell, Calendar, Clock, Send, Zap, Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ButtonIconDef {
  name: string
  label: string
  Icon: LucideIcon
}

export const BUTTON_ICONS: ButtonIconDef[] = [
  { name: 'ArrowRight',   label: 'Arrow Right',  Icon: ArrowRight },
  { name: 'ArrowLeft',    label: 'Arrow Left',   Icon: ArrowLeft },
  { name: 'ArrowUp',      label: 'Arrow Up',     Icon: ArrowUp },
  { name: 'ArrowDown',    label: 'Arrow Down',   Icon: ArrowDown },
  { name: 'ChevronRight', label: 'Chevron Right',Icon: ChevronRight },
  { name: 'ChevronLeft',  label: 'Chevron Left', Icon: ChevronLeft },
  { name: 'ChevronDown',  label: 'Chevron Down', Icon: ChevronDown },
  { name: 'ChevronUp',    label: 'Chevron Up',   Icon: ChevronUp },
  { name: 'Plus',         label: 'Plus',         Icon: Plus },
  { name: 'Minus',        label: 'Minus',        Icon: Minus },
  { name: 'Check',        label: 'Check',        Icon: Check },
  { name: 'X',            label: 'Close',        Icon: X },
  { name: 'Search',       label: 'Search',       Icon: Search },
  { name: 'Pencil',       label: 'Edit',         Icon: Pencil },
  { name: 'Trash2',       label: 'Delete',       Icon: Trash2 },
  { name: 'Save',         label: 'Save',         Icon: Save },
  { name: 'Download',     label: 'Download',     Icon: Download },
  { name: 'Upload',       label: 'Upload',       Icon: Upload },
  { name: 'Home',         label: 'Home',         Icon: Home },
  { name: 'Settings',     label: 'Settings',     Icon: Settings },
  { name: 'User',         label: 'User',         Icon: User },
  { name: 'Heart',        label: 'Heart',        Icon: Heart },
  { name: 'Star',         label: 'Star',         Icon: Star },
  { name: 'Info',         label: 'Info',         Icon: Info },
  { name: 'Play',         label: 'Play',         Icon: Play },
  { name: 'Mail',         label: 'Mail',         Icon: Mail },
  { name: 'Lock',         label: 'Lock',         Icon: Lock },
  { name: 'Share2',       label: 'Share',        Icon: Share2 },
  { name: 'Copy',         label: 'Copy',         Icon: Copy },
  { name: 'RefreshCw',    label: 'Refresh',      Icon: RefreshCw },
  { name: 'Bell',         label: 'Bell',         Icon: Bell },
  { name: 'Calendar',     label: 'Calendar',     Icon: Calendar },
  { name: 'Clock',        label: 'Clock',        Icon: Clock },
  { name: 'Send',         label: 'Send',         Icon: Send },
  { name: 'Zap',          label: 'Zap',          Icon: Zap },
  { name: 'Globe',        label: 'Globe',        Icon: Globe },
]

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  BUTTON_ICONS.map(({ name, Icon }) => [name, Icon])
)

export function getButtonIcon(name: string): LucideIcon | null {
  return ICON_MAP[name] ?? null
}
