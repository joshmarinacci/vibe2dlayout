import { useEffect, useRef } from 'react'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  icon?: string
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

  // Adjust position so menu doesn't overflow the viewport
  useEffect(() => {
    const el = menuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw) el.style.left = `${x - rect.width}px`
    if (rect.bottom > vh) el.style.top = `${y - rect.height}px`
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
