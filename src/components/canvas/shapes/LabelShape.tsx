import type { Dispatch } from 'react'
import type { LabelShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { useTextEdit, vAlignToJustify } from './useTextEdit'
import styles from './Shape.module.css'

interface Props {
  shape: LabelShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

export function LabelShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, text } = shape
  const { x, y, width, height, rotation } = transform
  const { textareaRef, onChange, onKeyDown, onClickTextarea } = useTextEdit({
    content: text.content, isEditing, shapeId: shape.id, dispatch,
  })

  const seed = seedFromId(shape.id)
  const underline = handDrawn ? roughLine(0, height - 1, width, height - 1, {
    seed,
    roughness: 0.8,
    stroke: '#bbbbbb',
    strokeWidth: 0.8,
  }) : []

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
          <RoughSvgPaths paths={underline} />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          borderBottom: '1px solid #cccccc',
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
            fontStyle: text.fontStyle,
            color: text.color,
            textAlign: text.align,
            outline: 'none',
            padding: '0 2px',
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
          padding: '0 2px',
          overflow: 'hidden',
        }}>
          <div style={textStyle}>{text.content}</div>
        </div>
      )}
    </div>
  )
}
