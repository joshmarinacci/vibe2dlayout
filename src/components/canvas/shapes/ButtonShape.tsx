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

  const vJustify = text.verticalAlign === 'top' ? 'flex-start' : text.verticalAlign === 'bottom' ? 'flex-end' : 'center'

  const textStyle: React.CSSProperties = {
    fontFamily: text.fontFamily,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight,
    fontStyle: text.fontStyle,
    color: text.color,
    textAlign: text.align,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    width: '100%',
    userSelect: 'none',
  }

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
            textAlign: text.align,
            outline: 'none',
            padding: '4px 8px',
            pointerEvents: 'all',
          }}
          onChange={e => { editValueRef.current = e.target.value }}
          onKeyDown={e => {
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
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: vJustify,
          padding: '4px 8px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={textStyle}>{text.content}</div>
        </div>
      )}
    </div>
  )
}
