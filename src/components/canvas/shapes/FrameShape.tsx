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
  const { x, y, width, height, rotation } = transform

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
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
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
          background: fill.color === 'transparent' ? 'transparent' : fill.color,
          border: `${stroke.width}px solid ${stroke.color}`,
          borderRadius: shape.cornerRadius ?? 0,
        }} />
      )}
      <div style={{ position: 'absolute', inset: 0 }}>
        {children}
      </div>
    </div>
  )
}
