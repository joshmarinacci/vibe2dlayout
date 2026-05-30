import type {GradientDef} from '@model/document'
import type {GradientStop} from '@model/shapes'
import type {AppAction} from '@store/types'
import {gradientCSS} from '@utils/fillCSS'
import {type Dispatch, useState} from 'react'
import styles from '../PropertiesPanel.module.css'
import {GradientStopBar} from './GradientStopBar'

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
    gradient: GradientDef
    dispatch: Dispatch<AppAction>
}

export function DocumentGradientSection({gradient, dispatch}: Props) {
    const [selectedStopIdx, setSelectedStopIdx] = useState(0)
    const safeStopIdx = Math.min(selectedStopIdx, Math.max(0, gradient.stops.length - 1))

    const update = (patch: Partial<GradientDef>) =>
        dispatch({type: 'UPDATE_GRADIENT', gradient: {...gradient, ...patch}})

    const updateStop = (index: number, patch: Partial<GradientStop>) => {
        const stops = gradient.stops.map((s, i) => i === index ? {...s, ...patch} : s)
        update({stops})
    }

    const handleMoveStop = (index: number, position: number) => {
        const stops = gradient.stops.map((s, i) => i === index ? {...s, position} : s)
        update({stops})
    }

    const handleAddStop = (position: number) => {
        const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
        const before = sorted.filter(s => s.position <= position).pop()
        const after = sorted.find(s => s.position > position)
        let color: string
        if (before && after) {
            color = interpolateHex(before.color, after.color, (position - before.position) / (after.position - before.position))
        } else {
            color = before?.color ?? after?.color ?? '#888888'
        }
        const newStop: GradientStop = {color, position}
        const stops = [...gradient.stops, newStop].sort((a, b) => a.position - b.position)
        update({stops})
        setSelectedStopIdx(stops.indexOf(newStop))
    }

    const handleDeleteStop = (index: number) => {
        if (gradient.stops.length <= 2) return
        const stops = gradient.stops.filter((_, i) => i !== index)
        update({stops})
        setSelectedStopIdx(prev => Math.min(prev, stops.length - 1))
    }

    const handleDragEnd = () => {
        const prevStop = gradient.stops[safeStopIdx]
        const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
        update({stops: sorted})
        const newIdx = sorted.indexOf(prevStop)
        if (newIdx >= 0) setSelectedStopIdx(newIdx)
    }

    const previewCSS = gradientCSS({type: 'gradient', gradientType: 'linear', angle: 90, stops: gradient.stops, opacity: 1})

    return (
        <>
            <div className={styles.section}>
                <div className={styles.row}>
                    <span className={styles.label}>Name</span>
                    <input
                        className={styles.textInput}
                        value={gradient.name}
                        onChange={e => update({name: e.target.value})}
                    />
                </div>
                <div className={styles.row}>
                    <div style={{height: 16, flex: 1, borderRadius: 3, border: '1px solid rgba(0,0,0,0.15)', background: previewCSS}}/>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.sectionTitle}>Stops</div>
                <div style={{padding: '0 12px 6px'}}>
                    <GradientStopBar
                        stops={gradient.stops}
                        gradientType="linear"
                        angle={90}
                        selectedIndex={safeStopIdx}
                        onSelectStop={setSelectedStopIdx}
                        onMoveStop={handleMoveStop}
                        onAddStop={handleAddStop}
                        onDeleteStop={handleDeleteStop}
                        onDragEnd={handleDragEnd}
                    />
                </div>
                <div className={styles.row}>
                    <span className={styles.label}>Color</span>
                    <input
                        type="color"
                        value={gradient.stops[safeStopIdx]?.color ?? '#000000'}
                        onChange={e => updateStop(safeStopIdx, {color: e.target.value})}
                        style={{width: 36, height: 24, padding: 0, border: '1px solid var(--color-border)', borderRadius: 3, cursor: 'pointer'}}
                    />
                    <span className={styles.label} style={{marginLeft: 8}}>Pos</span>
                    <input
                        type="number"
                        min={0} max={100}
                        value={Math.round((gradient.stops[safeStopIdx]?.position ?? 0) * 100)}
                        onChange={e => updateStop(safeStopIdx, {position: parseInt(e.target.value) / 100})}
                        style={{width: 48, fontSize: 12, border: '1px solid var(--color-border)', borderRadius: 3, padding: '2px 4px', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)'}}
                    />
                    <span style={{fontSize: 11, color: 'var(--color-text-muted)'}}>%</span>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.row}>
                    <button
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => dispatch({type: 'DELETE_GRADIENT', gradientId: gradient.id})}
                    >
                        Delete Gradient
                    </button>
                </div>
            </div>
        </>
    )
}
