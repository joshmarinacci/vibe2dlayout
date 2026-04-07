import { useRef, useEffect, type Dispatch } from 'react'
import type { PanelShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: PanelShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
}

export function PanelShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, children }: Props) {
  const { transform, fill, stroke, title, clipChildren } = shape
  const { x, y, width, height, rotation } = transform
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const commitEdit = () => {
    if (textareaRef.current && title) {
      dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: textareaRef.current.value })
    }
    dispatch({ type: 'STOP_TEXT_EDIT' })
  }

  const titleBarHeight = title ? (title.fontSize + 12) : 0
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

  const dividerPaths = title ? roughLine(pad, titleBarHeight, width - pad, titleBarHeight, {
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
      {/* Rough background SVG */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        width={width}
        height={height}
      >
        <RoughSvgPaths paths={bodyPaths} />
        <RoughSvgPaths paths={dividerPaths} />
      </svg>

      {/* Title bar */}
      {title && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: titleBarHeight,
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              defaultValue={title.content}
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                background: 'transparent',
                resize: 'none',
                fontFamily: title.fontFamily,
                fontSize: title.fontSize,
                fontWeight: title.fontWeight,
                color: title.color,
                textAlign: title.align,
                outline: 'none',
                padding: '4px 8px',
              }}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Escape') { e.preventDefault(); commitEdit() }
                e.stopPropagation()
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
              overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: title.fontFamily,
                fontSize: title.fontSize,
                fontWeight: title.fontWeight,
                fontStyle: title.fontStyle,
                color: title.color,
                textAlign: title.align,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                width: '100%',
                userSelect: 'none',
              }}>
                {title.content}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Children area */}
      <div style={{ position: 'absolute', top: titleBarHeight, left: 0, right: 0, bottom: 0 }}>
        {children}
      </div>
    </div>
  )
}
