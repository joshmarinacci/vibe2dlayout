import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Check, Lock, Copy } from 'lucide-react'
import { useAppState, useAppDispatch } from '@store/context'
import { BUILT_IN_THEMES, getActiveTheme } from '@model/theme'
import type { Theme } from '@model/theme'
import { generateId } from '@utils/idgen'
import styles from './ThemeEditorModal.module.css'

export function ThemeEditorModal() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (!state.showThemeModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'TOGGLE_THEME_MODAL' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.showThemeModal, dispatch])

  const themes = state.document.themes ?? BUILT_IN_THEMES
  const activeThemeId = state.document.activeThemeId ?? 'hand-drawn'

  const [selectedId, setSelectedId] = useState<string>(() => activeThemeId)
  const selectedTheme = themes.find(t => t.id === selectedId) ?? themes[0]

  if (!state.showThemeModal) return null

  const isBuiltIn = selectedTheme?.isBuiltIn ?? false

  const updateTheme = (patch: Partial<Theme>) => {
    if (!selectedTheme || isBuiltIn) return
    dispatch({ type: 'UPDATE_THEME', theme: { ...selectedTheme, ...patch } })
  }

  const addTheme = () => {
    const base = selectedTheme ?? getActiveTheme(state.document)
    const id = generateId()
    const newTheme: Theme = { ...base, id, name: `${base.name} Copy`, isBuiltIn: false }
    dispatch({ type: 'ADD_THEME', theme: newTheme })
    setSelectedId(id)
  }

  const deleteTheme = (id: string) => {
    if (themes.find(t => t.id === id)?.isBuiltIn) return
    dispatch({ type: 'DELETE_THEME', themeId: id })
    const remaining = themes.filter(t => t.id !== id)
    setSelectedId(remaining[0]?.id ?? '')
  }

  const setActive = (id: string) => {
    dispatch({ type: 'SET_ACTIVE_THEME', themeId: id })
  }

  const applyToAll = () => {
    if (!selectedTheme) return
    if (selectedTheme.id !== activeThemeId) {
      dispatch({ type: 'SET_ACTIVE_THEME', themeId: selectedTheme.id })
    }
    dispatch({ type: 'APPLY_THEME_TO_ALL_SHAPES' })
  }

  return (
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_THEME_MODAL' }) }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Themes</span>
          <button className={styles.closeBtn} onClick={() => dispatch({ type: 'TOGGLE_THEME_MODAL' })}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>
          {/* Left sidebar: theme list */}
          <div className={styles.themeList}>
            {themes.map(theme => (
              <div
                key={theme.id}
                className={`${styles.themeRow} ${theme.id === selectedId ? styles.themeRowActive : ''}`}
                onClick={() => setSelectedId(theme.id)}
              >
                {/* Color preview swatch */}
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: theme.borderRadius,
                  background: theme.background,
                  border: `${Math.min(theme.borderWidth, 2)}px solid ${theme.border}`,
                  flexShrink: 0,
                }} />
                <span className={styles.themeName}>{theme.name}</span>
                {theme.isBuiltIn ? (
                  <Lock size={11} style={{ color: '#bbb', flexShrink: 0 }} />
                ) : (
                  <button
                    className={styles.deleteBtn}
                    onClick={e => { e.stopPropagation(); deleteTheme(theme.id) }}
                    title="Delete theme"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
                {theme.id === activeThemeId && (
                  <Check size={12} style={{ color: '#3b82f6', flexShrink: 0 }} />
                )}
              </div>
            ))}
            <button className={styles.addBtn} onClick={addTheme}>
              {isBuiltIn ? <Copy size={13} /> : <Plus size={13} />}
              {isBuiltIn ? 'Duplicate' : 'Add theme'}
            </button>
          </div>

          {/* Right: theme editor */}
          {selectedTheme ? (
            <div className={styles.themeEditor}>
              {isBuiltIn && (
                <div className={styles.builtInNote}>
                  <span>Built-in theme — read only.</span>
                  <button className={styles.duplicateBtn} onClick={addTheme}>
                    <Copy size={12} />
                    Duplicate to customize
                  </button>
                </div>
              )}

              {/* Name */}
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Name</label>
                <input
                  className={styles.textInput}
                  type="text"
                  value={selectedTheme.name}
                  disabled={isBuiltIn}
                  onChange={e => updateTheme({ name: e.target.value })}
                />
              </div>

              {/* Colors */}
              <div className={styles.sectionTitle}>Colors</div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Foreground (text)</label>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={selectedTheme.foreground}
                  disabled={isBuiltIn}
                  onChange={e => updateTheme({ foreground: e.target.value })}
                />
                <span className={styles.colorHex}>{selectedTheme.foreground}</span>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Background (fill)</label>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={selectedTheme.background}
                  disabled={isBuiltIn}
                  onChange={e => updateTheme({ background: e.target.value })}
                />
                <span className={styles.colorHex}>{selectedTheme.background}</span>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Border color</label>
                <input
                  type="color"
                  className={styles.colorInput}
                  value={selectedTheme.border}
                  disabled={isBuiltIn}
                  onChange={e => updateTheme({ border: e.target.value })}
                />
                <span className={styles.colorHex}>{selectedTheme.border}</span>
              </div>

              {/* Border */}
              <div className={styles.sectionTitle}>Border</div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Border width</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={selectedTheme.borderWidth}
                  min={0}
                  max={20}
                  step={0.5}
                  disabled={isBuiltIn}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateTheme({ borderWidth: v }) }}
                />
                <span className={styles.unit}>px</span>
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Border radius</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={selectedTheme.borderRadius}
                  min={0}
                  max={100}
                  step={1}
                  disabled={isBuiltIn}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateTheme({ borderRadius: v }) }}
                />
                <span className={styles.unit}>px</span>
              </div>

              {/* Typography */}
              <div className={styles.sectionTitle}>Typography</div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Font family</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={selectedTheme.fontFamily}
                  disabled={isBuiltIn}
                  onChange={e => updateTheme({ fontFamily: e.target.value })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Font size</label>
                <input
                  type="number"
                  className={styles.numberInput}
                  value={selectedTheme.fontSize}
                  min={6}
                  max={96}
                  step={1}
                  disabled={isBuiltIn}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) updateTheme({ fontSize: v }) }}
                />
                <span className={styles.unit}>px</span>
              </div>

              {/* Style */}
              <div className={styles.sectionTitle}>Style</div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Hand drawn</label>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={selectedTheme.handDrawn}
                    disabled={isBuiltIn}
                    onChange={e => updateTheme({ handDrawn: e.target.checked })}
                  />
                  <span className={styles.toggleText}>{selectedTheme.handDrawn ? 'Rough / sketchy' : 'Plain / clean'}</span>
                </label>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  className={styles.applyBtn}
                  onClick={() => setActive(selectedTheme.id)}
                  disabled={selectedTheme.id === activeThemeId}
                  title="Apply this theme to new shapes"
                >
                  {selectedTheme.id === activeThemeId ? 'Active theme' : 'Set as active theme'}
                </button>
                <button
                  className={styles.applyAllBtn}
                  onClick={applyToAll}
                  title="Apply this theme's values to all existing shapes in the document"
                >
                  Apply to all shapes
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyRight}>Select a theme to edit</div>
          )}
        </div>
      </div>
    </div>
  )
}
