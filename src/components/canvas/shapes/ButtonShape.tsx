import { useRef, useEffect, type Dispatch } from 'react'
import type { ButtonShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: ButtonShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function ButtonShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick }: Props) {
  const { transform, fill, stroke, text } = shape
  const { x, y, width, height, rotation } = transform
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const commitEdit = () => {
    if (inputRef.current) {
      dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: inputRef.current.value })
    }
    dispatch({ type: 'STOP_TEXT_EDIT' })
  }

  const pad = 2
  const roughPaths = roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed: seedFromId(shape.id),
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
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
        <RoughSvgPaths paths={roughPaths} />
      </svg>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        {isEditing ? (
          <input
            ref={inputRef}
            defaultValue={text.content}
            style={{
              border: 'none',
              background: 'transparent',
              fontFamily: text.fontFamily,
              fontSize: text.fontSize,
              fontWeight: text.fontWeight,
              color: text.color,
              textAlign: 'center',
              outline: 'none',
              width: '90%',
              pointerEvents: 'all',
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
            fontFamily: text.fontFamily,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight,
            fontStyle: text.fontStyle,
            color: text.color,
            userSelect: 'none',
          }}>
            {text.content}
          </span>
        )}
      </div>
    </div>
  )
}
