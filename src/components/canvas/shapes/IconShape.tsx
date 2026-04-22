import type { IconShape } from '@model/shapes'
import { lookupIcon } from '@utils/allLucideIcons'
import styles from './Shape.module.css'

interface Props {
  shape: IconShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function IconShapeComp({ shape, isSelected, onClick, onDoubleClick }: Props) {
  const { transform, fill, icon } = shape
  const { x, y, width, height, rotation } = transform

  const IconComp = lookupIcon(icon.name)
  const iconSize = Math.round(Math.min(width, height) * 0.8)

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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fill.color === 'transparent' ? 'currentColor' : fill.color,
        opacity: fill.opacity,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {IconComp && <IconComp size={iconSize} strokeWidth={1.5} />}
    </div>
  )
}
