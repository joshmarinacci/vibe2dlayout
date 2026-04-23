import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS } from '@utils/strokeStyleCSS'
import type { Dispatch } from 'react'
import type { StickyNoteShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { useTextEdit } from './useTextEdit'
import { textExtraCSS } from '@utils/textStyleCSS'
import styles from './Shape.module.css'

const FOLD = 20

interface Props {
  shape: StickyNoteShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

export function StickyNoteShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, fill, stroke, text } = shape
  const { x, y, width, height } = transform
  const { textareaRef, onChange, onKeyDown, onClickTextarea } = useTextEdit({
    content: text.content, isEditing, shapeId: shape.id, dispatch,
  })

  const seed = seedFromId(shape.id)
  const pad = 2

  // Body (clip the top-right corner with clip-path)
  const clipPath = `polygon(0 0, ${width - FOLD}px 0, ${width}px ${FOLD}px, ${width}px ${height}px, 0 ${height}px)`

  // Hand-drawn paths: body rect + two fold lines
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

  // The fold shadow line (horizontal, then vertical)
  const foldH = handDrawn ? roughLine(width - FOLD - pad, pad, width - pad, FOLD + pad, {
    seed: seed + 1,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
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
        clipPath: handDrawn ? undefined : clipPath,
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
          <RoughSvgPaths paths={foldH} />
        </svg>
      ) : (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: fillBackground(fill),
            ...strokeBorderCSS(stroke),
          }} />
          {/* Fold corner triangle overlay */}
          <svg
            style={{ position: 'absolute', top: 0, right: 0, width: FOLD, height: FOLD, overflow: 'visible' }}
            width={FOLD}
            height={FOLD}
          >
            {/* Darken the fold crease */}
            <line x1={0} y1={0} x2={FOLD} y2={FOLD} stroke={stroke.color} strokeWidth={stroke.width * 0.75} />
          </svg>
        </>
      )}

      {/* Text area */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        right: handDrawn ? 8 : FOLD + 4,
        bottom: 8,
        overflow: 'hidden',
      }}>
        {isEditing ? (
          <textarea
            ref={textareaRef}
            defaultValue={text.content}
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              background: 'transparent',
              resize: 'none',
              fontFamily: text.fontFamily,
              fontSize: text.fontSize,
              fontWeight: text.fontWeight,
              color: text.color,
              outline: 'none',
              padding: 0,
            }}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onClick={onClickTextarea}
          />
        ) : (
          <div style={{
            fontFamily: text.fontFamily,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight,
            fontStyle: text.fontStyle,
            color: text.color,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            userSelect: 'none',
            ...textExtraCSS(text),
          }}>
            {text.content}
          </div>
        )}
      </div>
    </div>
  )
}
