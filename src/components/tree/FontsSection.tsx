import { useState, useRef, type Dispatch } from 'react'
import type { AppAction } from '@store/types'
import type { CustomFont } from '@model/document'
import styles from './FontsSection.module.css'

interface Props {
  customFonts: CustomFont[]
  selectedFontName: string | null
  dispatch: Dispatch<AppAction>
}

export function FontsSection({ customFonts, selectedFontName, dispatch }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [fontInput, setFontInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const openMenu = () => {
    setShowAddMenu(true)
    setFontInput('')
    setValidationError(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const cancel = () => {
    setShowAddMenu(false)
    setFontInput('')
    setValidationError(null)
  }

  const confirm = async () => {
    const name = fontInput.trim()
    if (!name) return
    setValidating(true)
    setValidationError(null)
    let valid = false
    try {
      const encoded = name.replace(/ /g, '+')
      const resp = await fetch(`https://fonts.googleapis.com/css2?family=${encoded}:wght@400&display=swap`)
      if (resp.ok) {
        const css = await resp.text()
        valid = css.includes('@font-face')
      }
    } catch {
      // network failure — treat as invalid
    }
    setValidating(false)
    if (!valid) {
      setValidationError(`"${name}" was not found in Google Fonts.`)
      return
    }
    dispatch({ type: 'ADD_CUSTOM_FONT', font: { name, isVariable: null, axes: [] } })
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
                onChange={e => { setFontInput(e.target.value); setValidationError(null) }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !validating) void confirm()
                  if (e.key === 'Escape') cancel()
                }}
              />
              {validationError && (
                <div className={styles.error}>{validationError}</div>
              )}
              <div className={styles.addActions}>
                <button className={styles.cancelBtn} onClick={cancel}>Cancel</button>
                <button className={styles.confirmBtn} onClick={() => void confirm()} disabled={validating}>
                  {validating ? 'Checking…' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {!collapsed && (
        customFonts.length === 0
          ? <div className={styles.empty}>No custom fonts</div>
          : customFonts.map(font => (
            <div
              key={font.name}
              className={`${styles.fontRow} ${selectedFontName === font.name ? styles.fontRowSelected : ''}`}
              onClick={() => dispatch({ type: 'SELECT_FONT', fontName: font.name })}
            >
              <span className={styles.fontName} style={{ fontFamily: font.name }}>{font.name}</span>
              {font.isVariable === true && (
                <span className={styles.variableBadge}>var</span>
              )}
              <button
                className={styles.removeBtn}
                title={`Remove ${font.name}`}
                onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_CUSTOM_FONT', fontName: font.name }) }}
              >×</button>
            </div>
          ))
      )}
    </div>
  )
}
