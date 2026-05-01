import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS } from '@utils/strokeStyleCSS'
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
  handDrawn: boolean
  themeFontFamily: string
}

export function DialogShapeComp({ shape, isSelected, onClick, onDoubleClick, children, handDrawn, themeFontFamily }: Props) {
  const { transform, fill, stroke, title, titleFontSize, titleColor, okLabel, cancelLabel } = shape
  const { x, y, width, height } = transform

  const titleBarHeight = titleFontSize + 12
  const footerHeight = 44
  const pad = 2

  const seed = seedFromId(shape.id)

  const titleDivider = handDrawn ? roughLine(pad, titleBarHeight, width - pad, titleBarHeight, {
    seed: seed + 1,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
  }) : []

  const footerDivider = handDrawn ? roughLine(pad, height - footerHeight, width - pad, height - footerHeight, {
    seed: seed + 2,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
  }) : []

  const btnW = 80
  const btnH = 28
  const btnY = height - footerHeight + (footerHeight - btnH) / 2

  const cancelBtnPaths = handDrawn ? roughRect(12, btnY, btnW, btnH, {
    seed: seed + 3,
    roughness: 1.2,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : []

  const okBtnPaths = handDrawn ? roughRect(width - btnW - 12, btnY, btnW, btnH, {
    seed: seed + 4,
    roughness: 1.2,
    fill: stroke.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : []

  const titleFont = shape.titleFontFamily ?? themeFontFamily
  const textColor = titleColor ?? stroke.color
  const okTextColor = handDrawn ? '#ffffff' : fill.color

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
          <RoughSvgPaths paths={makeRoughRect(shape)} />
          <RoughSvgPaths paths={titleDivider} />
          <RoughSvgPaths paths={footerDivider} />
          <RoughSvgPaths paths={cancelBtnPaths} />
          <RoughSvgPaths paths={okBtnPaths} />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: fillBackground(fill),
          ...strokeBorderCSS(stroke),
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Title bar divider */}
          <div style={{ height: titleBarHeight, borderBottom: `${stroke.width * 0.75}px solid ${stroke.color}`, flexShrink: 0 }} />
          {/* Body */}
          <div style={{ flex: 1 }} />
          {/* Footer divider */}
          <div style={{ height: footerHeight, borderTop: `${stroke.width * 0.75}px solid ${stroke.color}`, flexShrink: 0, position: 'relative' }}>
            {/* Cancel button */}
            <div style={{
              position: 'absolute',
              left: 12,
              top: (footerHeight - btnH) / 2,
              width: btnW,
              height: btnH,
              ...strokeBorderCSS(stroke),
              borderRadius: 4,
            }} />
            {/* OK button */}
            <div style={{
              position: 'absolute',
              right: 12,
              top: (footerHeight - btnH) / 2,
              width: btnW,
              height: btnH,
              background: stroke.color,
              borderRadius: 4,
            }} />
          </div>
        </div>
      )}

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
        fontFamily: titleFont,
        fontSize: titleFontSize,
        fontWeight: 'bold',
        color: textColor,
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
          fontFamily: titleFont,
          fontSize: 14,
          color: textColor,
          userSelect: 'none',
        }}>{cancelLabel}</span>
        <span style={{
          position: 'absolute',
          right: 12,
          width: btnW,
          textAlign: 'center',
          fontFamily: titleFont,
          fontSize: 14,
          color: okTextColor,
          userSelect: 'none',
        }}>{okLabel}</span>
      </div>
    </div>
  )
}
