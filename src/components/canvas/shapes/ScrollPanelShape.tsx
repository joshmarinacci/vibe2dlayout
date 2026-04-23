import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import type { Dispatch } from 'react'
import type { ScrollPanelShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

const SCROLLBAR_W = 12

interface Props {
  shape: ScrollPanelShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
  children?: React.ReactNode
}

export function ScrollPanelShapeComp({ shape, isSelected, onClick, onDoubleClick, handDrawn, children }: Props) {
  const { transform, fill, stroke, cornerRadius, scrollPosition, clipChildren } = shape
  const { x, y, width, height } = transform
  const pad = 2
  const seed = seedFromId(shape.id)

  // Scrollbar geometry
  const trackTop = 4
  const trackBottom = height - 4
  const trackH = trackBottom - trackTop
  const thumbH = Math.max(20, trackH * 0.3)
  const thumbMaxTop = trackH - thumbH
  const thumbTop = trackTop + scrollPosition * thumbMaxTop
  const sbX = width - SCROLLBAR_W - 2

  const bodyPaths = handDrawn ? roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed,
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : []

  const sbTrackPaths = handDrawn ? roughRect(sbX, trackTop, SCROLLBAR_W, trackH, {
    seed: seed + 2,
    roughness: 0.6,
    fill: '#e5e7eb',
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.5,
  }) : []

  const sbThumbPaths = handDrawn ? roughRect(sbX + 1, thumbTop, SCROLLBAR_W - 2, thumbH, {
    seed: seed + 3,
    roughness: 0.6,
    fill: stroke.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.5,
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
          <RoughSvgPaths paths={bodyPaths} />
          <RoughSvgPaths paths={sbTrackPaths} />
          <RoughSvgPaths paths={sbThumbPaths} />
        </svg>
      ) : (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: fillBackground(fill),
            ...strokeBorderCSS(stroke),
            borderRadius: cornerRadiiCSS(cornerRadius ?? 0, shape.cornerRadii),
          }} />
          {/* Scrollbar track */}
          <div style={{
            position: 'absolute',
            top: trackTop,
            right: 4,
            width: SCROLLBAR_W,
            height: trackH,
            background: '#e5e7eb',
            border: `${stroke.width * 0.5}px solid ${stroke.color}`,
            borderRadius: SCROLLBAR_W / 2,
            boxSizing: 'border-box',
          }} />
          {/* Scrollbar thumb */}
          <div style={{
            position: 'absolute',
            top: thumbTop,
            right: 4,
            width: SCROLLBAR_W,
            height: thumbH,
            background: stroke.color,
            borderRadius: SCROLLBAR_W / 2,
          }} />
        </>
      )}

      {/* Children rendered above background */}
      <div style={{ position: 'absolute', inset: 0, right: SCROLLBAR_W + 6, overflow: clipChildren ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </div>
  )
}
