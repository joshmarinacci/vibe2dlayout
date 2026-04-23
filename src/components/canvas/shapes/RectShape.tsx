import { buildCSSTransform } from '@model/transform'
import { cornerRadiiCSS } from '@utils/strokeStyleCSS'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS } from '@utils/strokeStyleCSS'
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
  const { transform, fill, stroke, clipChildren } = shape
  const { x, y, width, height } = transform

  return (
    <div
      className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        ...boxShadowCSS(shape),
        left: x,
        top: y,
        width,
        height,
        transform: buildCSSTransform(transform),
        transformOrigin: 'center center',
        background: fillBackground(fill),
        opacity: fill.opacity,
        borderRadius: cornerRadiiCSS(shape.cornerRadius, shape.cornerRadii),
        ...strokeBorderCSS(stroke),
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
