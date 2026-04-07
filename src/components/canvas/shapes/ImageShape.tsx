import type { ImageShape } from '@model/shapes'
import styles from './Shape.module.css'

interface Props {
  shape: ImageShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function ImageShapeComp({ shape, isSelected, onClick, onDoubleClick }: Props) {
  const { transform, src, mimeType, preserveAspectRatio, opacity } = shape
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
        opacity,
        overflow: 'hidden',
        background: src ? undefined : '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {src ? (
        <img
          src={`data:${mimeType};base64,${src}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: preserveAspectRatio ? 'contain' : 'fill',
          }}
          draggable={false}
          alt=""
        />
      ) : (
        <span style={{ color: '#9ca3af', fontSize: 12 }}>Image</span>
      )}
    </div>
  )
}
