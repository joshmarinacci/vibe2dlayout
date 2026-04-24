import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  submenu?: ContextMenuItem[]
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

function SubMenuItem({ item, onClose }: { item: ContextMenuItem; onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const [submenuPos, setSubmenuPos] = useState({ x: 0, y: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!item.submenu) {
    return (
      <button
        className={`${styles.item} ${item.danger ? styles.danger : ''}`}
        disabled={item.disabled}
        onClick={() => { item.onClick?.(); onClose() }}
      >
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        {item.label}
      </button>
    )
  }

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 300)
  }

  const handleMouseEnter = () => {
    cancelClose()
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect()
      // Overlap by 4px so the cursor never crosses a gap between row and submenu
      setSubmenuPos({ x: rect.right - 4, y: rect.top - 4 })
    }
    setOpen(true)
  }

  return (
    <div
      ref={rowRef}
      className={`${styles.item} ${styles.hasSubmenu}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={scheduleClose}
    >
      {item.icon && <span className={styles.icon}>{item.icon}</span>}
      <span style={{ flex: 1 }}>{item.label}</span>
      <span className={styles.submenuArrow}>›</span>
      {open && createPortal(
        <div
          className={styles.submenu}
          style={{ left: submenuPos.x, top: submenuPos.y }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {item.submenu!.map((sub, i) => (
            <button
              key={i}
              className={`${styles.item} ${sub.danger ? styles.danger : ''}`}
              disabled={sub.disabled}
              onClick={() => { sub.onClick?.(); onClose() }}
            >
              {sub.icon && <span className={styles.icon}>{sub.icon}</span>}
              {sub.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
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
            <SubMenuItem key={ii} item={item} onClose={onClose} />
          ))}
        </div>
      ))}
    </div>
  )
}
