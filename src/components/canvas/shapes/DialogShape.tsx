import type { Dispatch } from 'react'
import type { DialogShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: DialogShape
  isSelected: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

export function DialogShapeComp({ shape, isSelected, onClick, onDoubleClick, children }: Props) {
  const { transform, fill, stroke, title, titleFontSize, okLabel, cancelLabel } = shape
  const { x, y, width, height, rotation } = transform

  const titleBarHeight = titleFontSize + 12
  const footerHeight = 44
  const pad = 2

  const seed = seedFromId(shape.id)

  const bodyPaths = roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed,
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const titleDivider = roughLine(pad, titleBarHeight, width - pad, titleBarHeight, {
    seed: seed + 1,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
  })

  const footerDivider = roughLine(pad, height - footerHeight, width - pad, height - footerHeight, {
    seed: seed + 2,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
  })

  const btnW = 80
  const btnH = 28
  const btnY = height - footerHeight + (footerHeight - btnH) / 2

  const cancelBtnPaths = roughRect(12, btnY, btnW, btnH, {
    seed: seed + 3,
    roughness: 1.2,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const okBtnPaths = roughRect(width - btnW - 12, btnY, btnW, btnH, {
    seed: seed + 4,
    roughness: 1.2,
    fill: '#3b82f6',
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
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
        opacity: fill.opacity,
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        width={width}
        height={height}
      >
        <RoughSvgPaths paths={bodyPaths} />
        <RoughSvgPaths paths={titleDivider} />
        <RoughSvgPaths paths={footerDivider} />
        <RoughSvgPaths paths={cancelBtnPaths} />
        <RoughSvgPaths paths={okBtnPaths} />
      </svg>

      {/* Title */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: titleBarHeight,
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontFamily: 'Caveat, cursive',
        fontSize: titleFontSize,
        fontWeight: 'bold',
        color: '#222',
        userSelect: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}>
        {title}
      </div>

      {/* Body */}
      <div style={{
        position: 'absolute',
        top: titleBarHeight,
        left: 0,
        right: 0,
        bottom: footerHeight,
        overflow: 'hidden',
      }}>
        {children}
      </div>

      {/* Footer button labels */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: footerHeight,
        display: 'flex',
        alignItems: 'center',
        zIndex: 1,
        pointerEvents: 'none',
      }}>
        <span style={{
          position: 'absolute',
          left: 12,
          width: btnW,
          textAlign: 'center',
          fontFamily: 'Caveat, cursive',
          fontSize: 14,
          color: '#333',
          userSelect: 'none',
        }}>{cancelLabel}</span>
        <span style={{
          position: 'absolute',
          right: 12,
          width: btnW,
          textAlign: 'center',
          fontFamily: 'Caveat, cursive',
          fontSize: 14,
          color: '#ffffff',
          userSelect: 'none',
        }}>{okLabel}</span>
      </div>
    </div>
  )
}
