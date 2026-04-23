import type { Dispatch } from 'react'
import type { TextShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { useTextEdit, vAlignToJustify } from './useTextEdit'
import { textShadowCSS } from '@utils/textStyleCSS'
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
  const { textareaRef, onChange, onKeyDown, onClickTextarea } = useTextEdit({
    content: text.content, isEditing, shapeId: shape.id, dispatch,
  })

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
    ...textShadowCSS(text),
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
            position: 'absolute',
            inset: 0,
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
            padding: '4px 8px',
          }}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onClick={onClickTextarea}
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: vAlignToJustify(text.verticalAlign),
          padding: '4px 8px',
          overflow: 'hidden',
        }}>
          <div style={textStyle}>{text.content}</div>
        </div>
      )}
    </div>
  )
}
