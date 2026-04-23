import type React from 'react'
import { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
}

export interface ContextMenuGroup {
  items: ContextMenuItem[]
}

interface Props {
  x: number
  y: number
  groups: ContextMenuGroup[]
  onClose: () => void
}

export function ContextMenu({ x, y, groups, onClose }: Props) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position so menu stays within the viewport
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = x
    let top = y
    if (left + rect.width > vw) left = x - rect.width
    if (top + rect.height > vh) top = y - rect.height
    // Clamp to viewport edges with 8px margin
    left = Math.max(8, Math.min(left, vw - rect.width - 8))
    top  = Math.max(8, Math.min(top,  vh - rect.height - 8))
    el.style.left = `${left}px`
    el.style.top  = `${top}px`
  }, [x, y])

  // Close on outside click or Escape
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: x, top: y }}
      onPointerDown={e => e.stopPropagation()}
      onPointerUp={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation() }}
    >
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className={styles.divider} />}
          {group.items.map((item, ii) => (
            <button
              key={ii}
              className={`${styles.item} ${item.danger ? styles.danger : ''}`}
              disabled={item.disabled}
              onClick={() => { item.onClick(); onClose() }}
            >
              {item.icon && <span className={styles.icon}>{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
