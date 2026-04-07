import type { CircleShape } from '@model/shapes'
import styles from './Shape.module.css'

interface Props {
  shape: CircleShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

export function CircleShapeComp({ shape, isSelected, onClick, onDoubleClick, children }: Props) {
  const { transform, fill, stroke, clipChildren } = shape
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
        borderRadius: '50%',
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
