import { useState, useRef, type Dispatch } from 'react'
import type { AppAction } from '@store/types'
import styles from './FontsSection.module.css'

interface Props {
  customFonts: string[]
  dispatch: Dispatch<AppAction>
}

export function FontsSection({ customFonts, dispatch }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [fontInput, setFontInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openMenu = () => {
    setShowAddMenu(true)
    setFontInput('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancel = () => {
    setShowAddMenu(false)
    setFontInput('')
  }

  const confirm = () => {
    const name = fontInput.trim()
    if (!name) return
    dispatch({ type: 'ADD_CUSTOM_FONT', fontName: name })
    cancel()
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
          <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
          <span className={styles.label}>Fonts</span>
        </div>
        <div className={styles.addBtnWrap}>
          <button className={styles.addBtn} onClick={openMenu} title="Add Google Font">+</button>
          {showAddMenu && (
            <div className={styles.addMenu}>
              <input
                ref={inputRef}
                className={styles.addInput}
                placeholder="Google Font name (e.g. Roboto)"
                value={fontInput}
                onChange={e => setFontInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') confirm()
                  if (e.key === 'Escape') cancel()
                }}
              />
              <div className={styles.addActions}>
                <button className={styles.cancelBtn} onClick={cancel}>Cancel</button>
                <button className={styles.confirmBtn} onClick={confirm}>Add</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {!collapsed && (
        customFonts.length === 0
          ? <div className={styles.empty}>No custom fonts</div>
          : customFonts.map(name => (
            <div key={name} className={styles.fontRow}>
              <span className={styles.fontName} style={{ fontFamily: name }}>{name}</span>
              <button
                className={styles.removeBtn}
                title={`Remove ${name}`}
                onClick={() => dispatch({ type: 'DELETE_CUSTOM_FONT', fontName: name })}
              >×</button>
            </div>
          ))
      )}
    </div>
  )
}
