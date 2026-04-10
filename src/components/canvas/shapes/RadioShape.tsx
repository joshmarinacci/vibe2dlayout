import { type Dispatch } from 'react'
import type { RadioShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughCircle, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { useTextEdit } from './useTextEdit'
import styles from './Shape.module.css'

interface Props {
  shape: RadioShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
}

export function RadioShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick }: Props) {
  const { transform, checked, text, fill, stroke } = shape
  const { x, y, width, height, rotation } = transform
  const { textareaRef, onChange, onKeyDown, onClickTextarea } = useTextEdit({
    content: text.content, isEditing, shapeId: shape.id, dispatch,
  })

  const boxSize = Math.min(height - 2, 16)
  const cx = boxSize / 2 + 1
  const cy = height / 2

  const seed = seedFromId(shape.id)
  const circlePaths = roughCircle(cx, cy, boxSize, {
    seed,
    roughness: 1.2,
    bowing: 0.5,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  })

  const dotPaths = checked ? roughCircle(cx, cy, boxSize * 0.45, {
    seed: seed + 1,
    roughness: 1,
    fill: stroke.color,
    fillStyle: 'solid',
    fillWeight: 2,
    stroke: stroke.color,
    strokeWidth: 0.5,
  }) : []

  const labelLeft = boxSize + 8

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
        <RoughSvgPaths paths={circlePaths} />
        <RoughSvgPaths paths={dotPaths} />
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
          onChange={onChange}
          onKeyDown={onKeyDown}
          onClick={onClickTextarea}
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
