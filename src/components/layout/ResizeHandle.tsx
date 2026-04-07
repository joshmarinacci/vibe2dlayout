import { useCallback, useRef } from 'react'
import styles from './ResizeHandle.module.css'

interface Props {
  onResize: (delta: number) => void
  side: 'left' | 'right'
}

export function ResizeHandle({ onResize, side }: Props) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    dragging.current = true
    lastX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const delta = e.clientX - lastX.current
    lastX.current = e.clientX
    onResize(side === 'left' ? delta : -delta)
  }, [onResize, side])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return (
    <div
      className={styles.handle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />
  )
}
