import {useEffect, useRef} from 'react'
import type {GradientFill, GradientStop} from '@model/shapes'
import {gradientCSS} from '@utils/fillCSS'
import styles from './GradientStopBar.module.css'

interface Props {
    stops: GradientStop[]
    gradientType: GradientFill['gradientType']
    angle: number
    selectedIndex: number
    onSelectStop: (index: number) => void
    onMoveStop: (index: number, position: number) => void
    onAddStop: (position: number) => void
    onDeleteStop: (index: number) => void
    onDragEnd?: () => void
}

export function GradientStopBar({
    stops, gradientType, angle, selectedIndex,
    onSelectStop, onMoveStop, onAddStop, onDeleteStop, onDragEnd,
}: Props) {
    const barRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{index: number; startY: number; barLeft: number; barWidth: number} | null>(null)
    const stopsRef = useRef(stops)
    stopsRef.current = stops
    const cbRef = useRef({onMoveStop, onDeleteStop, onDragEnd})
    cbRef.current = {onMoveStop, onDeleteStop, onDragEnd}

    const barCSS = gradientCSS({type: 'gradient', gradientType, angle, stops, opacity: 1})

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            const drag = dragRef.current
            if (!drag) return
            const pos = Math.max(0, Math.min(1, (e.clientX - drag.barLeft) / drag.barWidth))
            cbRef.current.onMoveStop(drag.index, pos)
        }
        const onUp = (e: MouseEvent) => {
            const drag = dragRef.current
            if (!drag) return
            if (Math.abs(e.clientY - drag.startY) > 40 && stopsRef.current.length > 2) {
                cbRef.current.onDeleteStop(drag.index)
            } else {
                cbRef.current.onDragEnd?.()
            }
            dragRef.current = null
        }
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onUp)
        return () => {
            document.removeEventListener('mousemove', onMove)
            document.removeEventListener('mouseup', onUp)
        }
    }, [])

    return (
        <div className={styles.container}>
            <div
                ref={barRef}
                className={styles.bar}
                style={{background: barCSS}}
                onClick={e => {
                    const bar = barRef.current
                    if (!bar) return
                    const rect = bar.getBoundingClientRect()
                    onAddStop(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
                }}
            />
            <div className={styles.handleRow}>
                {stops.map((stop, i) => (
                    <div
                        key={i}
                        className={`${styles.handle}${i === selectedIndex ? ' ' + styles.selected : ''}`}
                        style={{left: `${stop.position * 100}%`}}
                        onMouseDown={e => {
                            e.stopPropagation()
                            onSelectStop(i)
                            const bar = barRef.current
                            if (!bar) return
                            const rect = bar.getBoundingClientRect()
                            dragRef.current = {index: i, startY: e.clientY, barLeft: rect.left, barWidth: rect.width}
                        }}
                    />
                ))}
            </div>
        </div>
    )
}
