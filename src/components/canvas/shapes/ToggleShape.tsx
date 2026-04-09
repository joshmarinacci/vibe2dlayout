import { useRef, useEffect, type Dispatch } from 'react'
import type { ToggleShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, roughCircle, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: ToggleShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function ToggleShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick }: Props) {
  const { transform, checked, text, trackFill, thumbFill, stroke } = shape
  const { x, y, width, height, rotation } = transform
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editValueRef = useRef(text.content)
  const cancelRef = useRef(false)
  const wasEditingRef = useRef(false)

  useEffect(() => {
    if (isEditing && !wasEditingRef.current) {
      wasEditingRef.current = true
      editValueRef.current = text.content
      cancelRef.current = false
      textareaRef.current?.focus()
      textareaRef.current?.select()
    } else if (!isEditing && wasEditingRef.current) {
      wasEditingRef.current = false
      if (!cancelRef.current) {
        dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: editValueRef.current })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const trackH = Math.min(height, 22)
  const trackW = Math.round(trackH * 1.9)
  const trackY = (height - trackH) / 2
  const thumbDia = trackH - 6
  const thumbCy = height / 2
  const thumbCx = checked
    ? trackW - thumbDia / 2 - 4
    : thumbDia / 2 + 4

  const seed = seedFromId(shape.id)
  const trackColor = checked
    ? (thumbFill.color === 'transparent' ? '#3b82f6' : thumbFill.color)
    : (trackFill.color === 'transparent' ? '#e5e7eb' : trackFill.color)

  const trackPaths = roughRect(1, trackY, trackW - 2, trackH - 2, {
    seed,
    roughness: 0.8,
    bowing: 3,
    fill: trackColor,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const thumbPaths = roughCircle(thumbCx, thumbCy, thumbDia, {
    seed: seed + 1,
    roughness: 1.2,
    fill: '#ffffff',
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const labelLeft = trackW + 8

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
        <RoughSvgPaths paths={thumbPaths} />
      </svg>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          defaultValue={text.content}
          style={{
            position: 'absolute',
            left: labelLeft,
            top: 0,
            right: 0,
            bottom: 0,
            border: 'none',
            background: 'transparent',
            resize: 'none',
            fontSize: text.fontSize,
            fontFamily: text.fontFamily,
            fontWeight: text.fontWeight,
            color: text.color,
            outline: 'none',
            padding: '0 2px',
          }}
          onChange={e => { editValueRef.current = e.target.value }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              dispatch({ type: 'STOP_TEXT_EDIT' })
              e.preventDefault(); e.stopPropagation(); return
            }
            if (e.key === 'Escape') {
              cancelRef.current = true
              dispatch({ type: 'STOP_TEXT_EDIT' })
              e.preventDefault(); e.stopPropagation(); return
            }
            e.stopPropagation()
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <div style={{
          position: 'absolute',
          left: labelLeft,
          top: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          fontSize: text.fontSize,
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          color: text.color,
          userSelect: 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          {text.content}
        </div>
      )}
    </div>
  )
}
