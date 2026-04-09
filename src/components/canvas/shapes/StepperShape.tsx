import type { Dispatch } from 'react'
import type { StepperShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: StepperShape
  isSelected: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

const BTN_W = 30

export function StepperShapeComp({ shape, isSelected, onClick, onDoubleClick }: Props) {
  const { transform, value, text, fill, stroke } = shape
  const { x, y, width, height, rotation } = transform

  const seed = seedFromId(shape.id)
  const pad = 2

  const minusPaths = roughRect(pad, pad, BTN_W - pad * 2, height - pad * 2, {
    seed,
    roughness: 1.2,
    bowing: 0.5,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const plusPaths = roughRect(width - BTN_W + pad, pad, BTN_W - pad * 2, height - pad * 2, {
    seed: seed + 1,
    roughness: 1.2,
    bowing: 0.5,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const valuePaths = roughRect(BTN_W + pad, pad, width - BTN_W * 2 - pad * 2, height - pad * 2, {
    seed: seed + 2,
    roughness: 0.8,
    bowing: 0.3,
    fill: undefined,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.6,
  })

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
        <RoughSvgPaths paths={minusPaths} />
        <RoughSvgPaths paths={valuePaths} />
        <RoughSvgPaths paths={plusPaths} />
      </svg>

      {/* − button label */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: BTN_W,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize + 2,
        color: text.color,
        userSelect: 'none',
      }}>−</div>

      {/* Value display */}
      <div style={{
        position: 'absolute',
        left: BTN_W,
        top: 0,
        right: BTN_W,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize,
        color: text.color,
        userSelect: 'none',
      }}>{value}</div>

      {/* + button label */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: BTN_W,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: text.fontFamily,
        fontSize: text.fontSize + 2,
        color: text.color,
        userSelect: 'none',
      }}>+</div>
    </div>
  )
}
