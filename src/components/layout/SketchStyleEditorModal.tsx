import type {SketchStyleDef} from '@model/document'
import {sketchFillCSS} from '@utils/fillCSS'
import {generateId} from '@utils/idgen'
import {Plus, Trash2, X} from 'lucide-react'
import {useState} from 'react'
import {createPortal} from 'react-dom'
import {useAppDispatch, useAppState} from '@store/context'
import styles from './SketchStyleEditorModal.module.css'

interface Props {
    onClose: () => void
}

function previewStyle(s: SketchStyleDef): string {
    return sketchFillCSS({
        type: 'sketch',
        color: '#333333',
        fillStyle: s.fillStyle,
        hachureAngle: s.hachureAngle,
        hachureGap: s.hachureGap,
        opacity: 1,
    })
}

export function SketchStyleEditorModal({onClose}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const sketchStyles = state.document.sketchStyles ?? []

    const [selectedId, setSelectedId] = useState<string>(sketchStyles[0]?.id ?? '')

    const selected = sketchStyles.find(s => s.id === selectedId) ?? null

    const addStyle = () => {
        const id = generateId()
        const s: SketchStyleDef = {
            id,
            name: 'New Style',
            fillStyle: 'hatched',
            hachureAngle: 45,
            hachureGap: 4,
        }
        dispatch({type: 'ADD_SKETCH_STYLE', style: s})
        setSelectedId(id)
    }

    const deleteStyle = (id: string) => {
        dispatch({type: 'DELETE_SKETCH_STYLE', styleId: id})
        if (selectedId === id) {
            setSelectedId(sketchStyles.find(s => s.id !== id)?.id ?? '')
        }
    }

    const update = (patch: Partial<SketchStyleDef>) => {
        if (!selected) return
        dispatch({type: 'UPDATE_SKETCH_STYLE', style: {...selected, ...patch}})
    }

    return createPortal(
        <div className={styles.overlay} onClick={e => {
            if (e.target === e.currentTarget) onClose()
        }}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <span className={styles.title}>Edit Sketch Styles</span>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
                </div>
                <div className={styles.body}>
                    {/* Left: style list */}
                    <div className={styles.list}>
                        {sketchStyles.map(s => (
                            <div
                                key={s.id}
                                className={`${styles.row} ${s.id === selectedId ? styles.rowActive : ''}`}
                                onClick={() => setSelectedId(s.id)}
                            >
                                <div
                                    className={styles.swatch}
                                    style={{background: previewStyle(s)}}
                                />
                                <span className={styles.rowName}>{s.name}</span>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={e => {
                                        e.stopPropagation()
                                        deleteStyle(s.id)
                                    }}
                                    title="Delete style"
                                ><Trash2 size={13}/></button>
                            </div>
                        ))}
                        <button className={styles.addBtn} onClick={addStyle}>
                            <Plus size={13}/> New Style
                        </button>
                    </div>

                    {/* Right: editor */}
                    {selected ? (
                        <div className={styles.editor}>
                            <input
                                className={styles.nameInput}
                                value={selected.name}
                                onChange={e => update({name: e.target.value})}
                                placeholder="Style name"
                            />
                            <div className={styles.row2}>
                                <label className={styles.label}>Fill</label>
                                <select
                                    className={styles.select}
                                    value={selected.fillStyle}
                                    onChange={e => update({fillStyle: e.target.value as SketchStyleDef['fillStyle']})}
                                >
                                    <option value="solid">Solid</option>
                                    <option value="hatched">Hatched</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                            {selected.fillStyle === 'hatched' && (<>
                                <div className={styles.row2}>
                                    <label className={styles.label}>Angle</label>
                                    <input
                                        className={styles.numberInput}
                                        type="number"
                                        value={selected.hachureAngle}
                                        min={0} max={180}
                                        onChange={e => update({hachureAngle: parseInt(e.target.value) || 0})}
                                    />
                                    <span className={styles.unit}>°</span>
                                </div>
                                <div className={styles.row2}>
                                    <label className={styles.label}>Gap</label>
                                    <input
                                        className={styles.numberInput}
                                        type="number"
                                        value={selected.hachureGap}
                                        min={1} max={40}
                                        onChange={e => update({hachureGap: parseInt(e.target.value) || 2})}
                                    />
                                    <span className={styles.unit}>px</span>
                                </div>
                            </>)}
                            <div className={styles.sectionLabel}>Preview</div>
                            <div
                                className={styles.preview}
                                style={{background: previewStyle(selected)}}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyRight}>Select or create a sketch style</div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    )
}
