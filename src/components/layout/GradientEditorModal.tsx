import type {GradientDef} from '@model/document'
import type {GradientStop} from '@model/shapes'
import {generateId} from '@utils/idgen'
import {Plus, Trash2, X} from 'lucide-react'
import {useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {useAppDispatch, useAppState} from '@store/context'
import styles from './GradientEditorModal.module.css'
import {GradientStopBar} from '@components/properties/sections/GradientStopBar'
import {gradientCSS} from '@utils/fillCSS'

function interpolateHex(c1: string, c2: string, t: number): string {
    const parse = (hex: string) => [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
    ]
    const [r1, g1, b1] = parse(c1)
    const [r2, g2, b2] = parse(c2)
    const r = Math.round(r1 + (r2 - r1) * t).toString(16).padStart(2, '0')
    const g = Math.round(g1 + (g2 - g1) * t).toString(16).padStart(2, '0')
    const b = Math.round(b1 + (b2 - b1) * t).toString(16).padStart(2, '0')
    return `#${r}${g}${b}`
}

interface Props {
    onClose: () => void
}

function previewCSS(g: GradientDef): string {
    return gradientCSS({type: 'gradient', gradientType: 'linear', angle: 90, stops: g.stops, opacity: 1})
}

export function GradientEditorModal({onClose}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const gradients = state.document.gradients ?? []

    const [selectedId, setSelectedId] = useState<string>(gradients[0]?.id ?? '')
    const [selectedStopIdx, setSelectedStopIdx] = useState(0)

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

    const safeStopIdx = Math.min(selectedStopIdx, Math.max(0, (selected?.stops.length ?? 1) - 1))

    const addGradient = () => {
        const id = generateId()
        const g: GradientDef = {
            id,
            name: 'New Gradient',
            stops: [{color: '#ff0000', position: 0}, {color: '#0000ff', position: 1}],
        }
        dispatch({type: 'ADD_GRADIENT', gradient: g})
        setSelectedId(id)
        setSelectedStopIdx(0)
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

    const handleMoveStop = (index: number, position: number) => {
        if (!selected) return
        const stops = selected.stops.map((s, i) => i === index ? {...s, position} : s)
        update({stops})
    }

    const handleAddStop = (position: number) => {
        if (!selected) return
        const sorted = [...selected.stops].sort((a, b) => a.position - b.position)
        const before = sorted.filter(s => s.position <= position).pop()
        const after = sorted.find(s => s.position > position)
        let color: string
        if (before && after) {
            const t = (position - before.position) / (after.position - before.position)
            color = interpolateHex(before.color, after.color, t)
        } else {
            color = before?.color ?? after?.color ?? '#888888'
        }
        const newStop: GradientStop = {color, position}
        const stops = [...selected.stops, newStop].sort((a, b) => a.position - b.position)
        update({stops})
        setSelectedStopIdx(stops.indexOf(newStop))
    }

    const handleDeleteStop = (index: number) => {
        if (!selected || selected.stops.length <= 2) return
        const stops = selected.stops.filter((_, i) => i !== index)
        update({stops})
        setSelectedStopIdx(prev => Math.min(prev, stops.length - 1))
    }

    const handleDragEnd = () => {
        if (!selected) return
        const prevStop = selected.stops[safeStopIdx]
        const sorted = [...selected.stops].sort((a, b) => a.position - b.position)
        update({stops: sorted})
        const newIdx = sorted.indexOf(prevStop)
        if (newIdx >= 0) setSelectedStopIdx(newIdx)
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
                                onClick={() => { setSelectedId(g.id); setSelectedStopIdx(0) }}
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
                            <GradientStopBar
                                stops={selected.stops}
                                gradientType="linear"
                                angle={90}
                                selectedIndex={safeStopIdx}
                                onSelectStop={setSelectedStopIdx}
                                onMoveStop={handleMoveStop}
                                onAddStop={handleAddStop}
                                onDeleteStop={handleDeleteStop}
                                onDragEnd={handleDragEnd}
                            />
                            <div className={styles.stopDetails}>
                                <span className={styles.label}>Color</span>
                                <input
                                    type="color"
                                    className={styles.colorPicker}
                                    value={selected.stops[safeStopIdx]?.color ?? '#000000'}
                                    onChange={e => updateStop(safeStopIdx, {color: e.target.value})}
                                />
                                <span className={styles.label}>Pos</span>
                                <input
                                    type="number"
                                    className={styles.numberInput}
                                    min={0} max={100}
                                    value={Math.round((selected.stops[safeStopIdx]?.position ?? 0) * 100)}
                                    onChange={e => updateStop(safeStopIdx, {position: parseInt(e.target.value) / 100})}
                                />
                                <span className={styles.unit}>%</span>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyRight}>Select or create a gradient</div>
                    )}
                </div>
        </div>,
        document.body,
    )
}


