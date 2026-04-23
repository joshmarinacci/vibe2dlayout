import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import type { Dispatch } from 'react'
import type { FrameShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: FrameShape
  isSelected: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
  handDrawn: boolean
}

export function FrameShapeComp({ shape, isSelected, onClick, onDoubleClick, children, handDrawn }: Props) {
  const { transform, fill, stroke, clipChildren } = shape
  const { x, y, width, height } = transform

  const seed = seedFromId(shape.id)
  const pad = 2
  const paths = handDrawn ? roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed,
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : []

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
        opacity: fill.opacity,
        overflow: clipChildren ? 'hidden' : 'visible',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {handDrawn ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          width={width}
          height={height}
        >
          <RoughSvgPaths paths={paths} />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: fillBackground(fill),
          ...strokeBorderCSS(stroke),
          borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
    </div>
  )
}
