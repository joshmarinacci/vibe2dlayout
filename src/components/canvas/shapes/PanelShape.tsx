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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commitEdit = () => {
    if (inputRef.current && title) {
      dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: inputRef.current.value })
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
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          zIndex: 1,
        }}>
          {isEditing ? (
            <input
              ref={inputRef}
              defaultValue={title.content}
              style={{
                border: 'none',
                background: 'transparent',
                fontFamily: title.fontFamily,
                fontSize: title.fontSize,
                fontWeight: title.fontWeight,
                color: title.color,
                outline: 'none',
                width: '100%',
              }}
              onBlur={commitEdit}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); commitEdit() }
                e.stopPropagation()
              }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span style={{
              fontFamily: title.fontFamily,
              fontSize: title.fontSize,
              fontWeight: title.fontWeight,
              fontStyle: title.fontStyle,
              color: title.color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}>
              {title.content}
            </span>
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
