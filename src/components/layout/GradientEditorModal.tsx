import type {GradientDef} from '@model/document'
import type {GradientStop} from '@model/shapes'
import {generateId} from '@utils/idgen'
import {Plus, Trash2, X} from 'lucide-react'
import {useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useAppDispatch, useAppState} from '@store/context'
import styles from './GradientEditorModal.module.css'

interface Props {
    onClose: () => void
}

function previewCSS(g: GradientDef): string {
    const stops = g.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')
    return `linear-gradient(90deg, ${stops})`
}

export function GradientEditorModal({onClose}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const gradients = state.document.gradients ?? []

    const [selectedId, setSelectedId] = useState<string>(gradients[0]?.id ?? '')

    // Drag state
    const [pos, setPos] = useState({x: Math.max(0, window.innerWidth / 2 - 300), y: 80})
    const dragStart = useRef<{mx: number; my: number; px: number; py: number} | null>(null)

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        dragStart.current = {mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y}
        const onMove = (me: MouseEvent) => {
            if (!dragStart.current) return
            setPos({
                x: dragStart.current.px + me.clientX - dragStart.current.mx,
                y: dragStart.current.py + me.clientY - dragStart.current.my,
            })
        }
        const onUp = () => {
            dragStart.current = null
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    const selected = gradients.find(g => g.id === selectedId) ?? null

    const addGradient = () => {
        const id = generateId()
        const g: GradientDef = {
            id,
            name: 'New Gradient',
            stops: [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}],
        }
        dispatch({type: 'ADD_GRADIENT', gradient: g})
        setSelectedId(id)
    }

    const deleteGradient = (id: string) => {
        dispatch({type: 'DELETE_GRADIENT', gradientId: id})
        if (selectedId === id) {
            setSelectedId(gradients.find(g => g.id !== id)?.id ?? '')
        }
    }

    const update = (patch: Partial<GradientDef>) => {
        if (!selected) return
        dispatch({type: 'UPDATE_GRADIENT', gradient: {...selected, ...patch}})
    }

    const updateStop = (index: number, patch: Partial<GradientStop>) => {
        if (!selected) return
        const stops = selected.stops.map((s, i) => i === index ? {...s, ...patch} : s)
        update({stops})
    }

    const addStop = () => {
        if (!selected) return
        const stops = [...selected.stops, {color: '#888888', position: 0.5}]
        update({stops})
    }

    const deleteStop = (index: number) => {
        if (!selected) return
        const stops = selected.stops.filter((_, i) => i !== index)
        update({stops})
    }

    return createPortal(
        <div className={styles.modal} style={{left: pos.x, top: pos.y}}>
                <div className={styles.header} onMouseDown={onHeaderMouseDown}>
                    <span className={styles.title}>Edit Gradients</span>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
                </div>
                <div className={styles.body}>
                    {/* Left: gradient list */}
                    <div className={styles.list}>
                        {gradients.map(g => (
                            <div
                                key={g.id}
                                className={`${styles.row} ${g.id === selectedId ? styles.rowActive : ''}`}
                                onClick={() => setSelectedId(g.id)}
                            >
                                <div
                                    className={styles.swatch}
                                    style={{background: previewCSS(g)}}
                                />
                                <span className={styles.rowName}>{g.name}</span>
                                <button
                                    className={styles.deleteBtn}
                                    onClick={e => {
                                        e.stopPropagation()
                                        deleteGradient(g.id)
                                    }}
                                    title="Delete gradient"
                                ><Trash2 size={13}/></button>
                            </div>
                        ))}
                        <button className={styles.addBtn} onClick={addGradient}>
                            <Plus size={13}/> New Gradient
                        </button>
                    </div>

                    {/* Right: editor */}
                    {selected ? (
                        <div className={styles.editor}>
                            <input
                                className={styles.nameInput}
                                value={selected.name}
                                onChange={e => update({name: e.target.value})}
                                placeholder="Gradient name"
                            />
                            <div className={styles.sectionLabel}>Stops</div>
                            {selected.stops.map((stop, i) => (
                                <div key={i} className={styles.stopRow}>
                                    <input
                                        type="color"
                                        className={styles.colorPicker}
                                        value={stop.color}
                                        onChange={e => updateStop(i, {color: e.target.value})}
                                    />
                                    <input
                                        className={styles.posInput}
                                        type="range"
                                        min={0} max={100}
                                        value={Math.round(stop.position * 100)}
                                        onChange={e => updateStop(i, {position: parseInt(e.target.value) / 100})}
                                    />
                                    <span className={styles.posLabel}>{Math.round(stop.position * 100)}%</span>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => deleteStop(i)}
                                        disabled={selected.stops.length <= 2}
                                        title="Delete stop"
                                    ><Trash2 size={12}/></button>
                                </div>
                            ))}
                            <button className={styles.addBtn} onClick={addStop}>
                                <Plus size={13}/> Add Stop
                            </button>
                            <div
                                className={styles.preview}
                                style={{background: previewCSS(selected)}}
                            />
                        </div>
                    ) : (
                        <div className={styles.emptyRight}>Select or create a gradient</div>
                    )}
                </div>
        </div>,
        document.body,
    )
}


