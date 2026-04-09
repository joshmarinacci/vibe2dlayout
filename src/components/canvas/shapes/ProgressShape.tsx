import type { Dispatch } from 'react'
import type { ProgressShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: ProgressShape
  isSelected: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function ProgressShapeComp({ shape, isSelected, onClick, onDoubleClick }: Props) {
  const { transform, value, fill, trackFill, stroke } = shape
  const { x, y, width, height, rotation } = transform

  const seed = seedFromId(shape.id)
  const pad = 2
  const barWidth = Math.max(pad * 2, (value / 100) * (width - pad * 2))

  const trackPaths = roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed,
    roughness: 1,
    bowing: 0.5,
    fill: trackFill.color === 'transparent' ? undefined : trackFill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const barPaths = barWidth > 0 ? roughRect(pad, pad, barWidth, height - pad * 2, {
    seed: seed + 1,
    roughness: 1,
    bowing: 0.5,
    fill: fill.color,
    fillStyle: 'solid',
    fillWeight: 2,
    stroke: 'none',
    strokeWidth: 0,
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
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        width={width}
        height={height}
      >
        <RoughSvgPaths paths={trackPaths} />
        <RoughSvgPaths paths={barPaths} />
      </svg>
    </div>
  )
}
