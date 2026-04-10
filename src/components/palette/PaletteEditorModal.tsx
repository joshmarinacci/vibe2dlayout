import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Trash2 } from 'lucide-react'
import { useAppState, useAppDispatch } from '@store/context'
import { generateId } from '@utils/idgen'
import styles from './PaletteEditorModal.module.css'

interface Props {
  onClose: () => void
}

export function PaletteEditorModal({ onClose }: Props) {
  const { state } = useAppState()
  const dispatch = useAppDispatch()
  const palettes = state.document.palettes ?? []

  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(palettes[0]?.id ?? '')
  const [editingColorId, setEditingColorId] = useState<string | null>(null)

  const selectedPalette = palettes.find(p => p.id === selectedPaletteId) ?? null

  const addPalette = () => {
    const id = generateId()
    dispatch({ type: 'ADD_PALETTE', palette: { id, name: 'New Palette', colors: [] } })
    setSelectedPaletteId(id)
  }

  const deletePalette = (id: string) => {
    dispatch({ type: 'DELETE_PALETTE', paletteId: id })
    if (selectedPaletteId === id) {
      setSelectedPaletteId(palettes.find(p => p.id !== id)?.id ?? '')
    }
  }

  const addColor = () => {
    if (!selectedPalette) return
    const id = generateId()
    dispatch({
      type: 'ADD_PALETTE_COLOR',
      paletteId: selectedPalette.id,
      color: { id, name: 'New Color', color: '#888888' },
    })
    setEditingColorId(id)
  }

  return createPortal(
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>Edit Palettes</span>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={styles.body}>
          {/* Left: palette list */}
          <div className={styles.paletteList}>
            {palettes.map(p => (
              <div
                key={p.id}
                className={`${styles.paletteRow} ${p.id === selectedPaletteId ? styles.paletteRowActive : ''}`}
                onClick={() => setSelectedPaletteId(p.id)}
              >
                <span className={styles.paletteName}>{p.name}</span>
                <button
                  className={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); deletePalette(p.id) }}
                  title="Delete palette"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button className={styles.addBtn} onClick={addPalette}>
              <Plus size={13} /> New Palette
            </button>
          </div>

          {/* Right: selected palette editor */}
          {selectedPalette ? (
            <div className={styles.paletteEditor}>
              <input
                className={styles.paletteNameInput}
                value={selectedPalette.name}
                onChange={e => dispatch({ type: 'RENAME_PALETTE', paletteId: selectedPalette.id, name: e.target.value })}
              />
              <div className={styles.colorGrid}>
                {selectedPalette.colors.map(pc => (
                  <div key={pc.id} className={styles.colorEntry}>
                    <div
                      className={styles.colorCircle}
                      style={{ background: pc.color }}
                      onClick={() => setEditingColorId(editingColorId === pc.id ? null : pc.id)}
                    />
                    {editingColorId === pc.id ? (
                      <div className={styles.colorEditRow}>
                        <input
                          type="color"
                          className={styles.colorPickerInput}
                          value={pc.color}
                          onChange={e => dispatch({ type: 'UPDATE_PALETTE_COLOR', paletteId: selectedPalette.id, colorId: pc.id, color: e.target.value })}
                        />
                        <input
                          className={styles.colorNameInput}
                          value={pc.name}
                          onChange={e => dispatch({ type: 'UPDATE_PALETTE_COLOR', paletteId: selectedPalette.id, colorId: pc.id, name: e.target.value })}
                        />
                        <button
                          className={styles.deleteBtn}
                          onClick={() => { dispatch({ type: 'DELETE_PALETTE_COLOR', paletteId: selectedPalette.id, colorId: pc.id }); setEditingColorId(null) }}
                          title="Delete color"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className={styles.colorLabel}>{pc.name}</span>
                    )}
                  </div>
                ))}
              </div>
              <button className={styles.addBtn} onClick={addColor}>
                <Plus size={13} /> Add Color
              </button>
            </div>
          ) : (
            <div className={styles.emptyRight}>Select or create a palette</div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
