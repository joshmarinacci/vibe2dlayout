import type { RectShape as RectShapeType } from '@model/shapes'
import styles from './Shape.module.css'

interface Props {
  shape: RectShapeType
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

export function RectShape({ shape, isSelected, onClick, onDoubleClick, children }: Props) {
  const { transform, fill, stroke, cornerRadius, clipChildren } = shape
  const { x, y, width, height, rotation } = transform

  return (
    <div
      className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
        background: fill.color,
        opacity: fill.opacity,
        borderRadius: cornerRadius,
        border: `${stroke.width}px solid ${stroke.color}`,
        overflow: clipChildren ? 'hidden' : 'visible',
        boxSizing: 'border-box',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  )
}
