import { useRef, useEffect, type Dispatch } from 'react'
import type { TextShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import styles from './Shape.module.css'

interface Props {
  shape: TextShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function TextShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick }: Props) {
  const { transform, text, fill } = shape
  const { x, y, width, height, rotation } = transform
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  const commitEdit = () => {
    if (textareaRef.current) {
      dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: textareaRef.current.value })
    }
    dispatch({ type: 'STOP_TEXT_EDIT' })
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
        background: fill.color === 'transparent' ? 'transparent' : fill.color,
        display: 'flex',
        alignItems: text.verticalAlign === 'top' ? 'flex-start' : text.verticalAlign === 'bottom' ? 'flex-end' : 'center',
        justifyContent: text.align === 'left' ? 'flex-start' : text.align === 'right' ? 'flex-end' : 'center',
        overflow: 'hidden',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          defaultValue={text.content}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'transparent',
            resize: 'none',
            fontFamily: text.fontFamily,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight,
            fontStyle: text.fontStyle,
            color: text.color,
            textAlign: text.align,
            outline: 'none',
            padding: 4,
          }}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); commitEdit() }
            e.stopPropagation()
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span
          style={{
            fontFamily: text.fontFamily,
            fontSize: text.fontSize,
            fontWeight: text.fontWeight,
            fontStyle: text.fontStyle,
            color: text.color,
            textAlign: text.align,
            whiteSpace: 'pre-wrap',
            padding: 4,
          }}
        >
          {text.content}
        </span>
      )}
    </div>
  )
}
