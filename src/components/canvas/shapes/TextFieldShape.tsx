import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS } from '@utils/strokeStyleCSS'
import { useRef, useEffect, type Dispatch } from 'react'
import type { TextFieldShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { textExtraCSS, textGradientSpanCSS } from '@utils/textStyleCSS'
import styles from './Shape.module.css'

interface Props {
  shape: TextFieldShape
  isSelected: boolean
  isEditing: boolean
  handDrawn: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function TextFieldShapeComp({ shape, isSelected, isEditing, handDrawn, dispatch, onClick, onDoubleClick }: Props) {
  const { transform, text, placeholder, fill, stroke } = shape
  const { x, y, width, height } = transform
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


  const showPlaceholder = !text.content

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
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: fillBackground(fill),
          ...strokeBorderCSS(stroke),
          borderRadius: 4,
          opacity: fill.opacity,
        }} />
      )}

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
            padding: '4px 8px',
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
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          fontFamily: text.fontFamily,
          fontSize: text.fontSize,
          fontWeight: text.fontWeight,
          color: showPlaceholder ? '#aaaaaa' : text.color,
          userSelect: 'none',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          ...textExtraCSS(text),
        }}>
          {showPlaceholder ? placeholder : (() => { const g = textGradientSpanCSS(text); return g ? <span style={g}>{text.content}</span> : text.content })()}
        </div>
      )}
    </div>
  )
}
