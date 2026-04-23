import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import { type Dispatch, type CSSProperties } from 'react'
import type { ButtonShape, TextStyle } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { getButtonIcon } from '@utils/buttonIcons'
import { useTextEdit, vAlignToJustify } from './useTextEdit'
import { textExtraCSS } from '@utils/textStyleCSS'
import styles from './Shape.module.css'

interface Props {
  shape: ButtonShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

export function ButtonShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, fill, stroke, text, icon } = shape
  const { x, y, width, height } = transform
  const { textareaRef, onChange, onKeyDown, onClickTextarea } = useTextEdit({
    content: text.content, isEditing, shapeId: shape.id, dispatch,
  })

  const pad = 2
  const roughPaths = handDrawn ? roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed: seedFromId(shape.id),
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : null

  const vJustify = vAlignToJustify(text.verticalAlign)

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
        opacity: fill.opacity,
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
          <RoughSvgPaths paths={roughPaths!} />
        </svg>
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: fillBackground(fill),
          ...strokeBorderCSS(stroke),
          borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
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
            textAlign: text.align,
            outline: 'none',
            padding: '4px 8px',
            pointerEvents: 'all',
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
          justifyContent: vJustify,
          padding: '4px 8px',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <ButtonContent text={text} icon={icon} />
        </div>
      )}
    </div>
  )
}

function ButtonContent({
  text,
  icon,
}: {
  text: TextStyle
  icon: ButtonShape['icon']
}) {
  const IconComp = icon ? getButtonIcon(icon.name) : null
  const iconSize = Math.round(text.fontSize * 1.1)

  const rowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: icon?.side === 'right' ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: IconComp ? 4 : 0,
    width: '100%',
    justifyContent: text.align === 'left' ? 'flex-start' : text.align === 'right' ? 'flex-end' : 'center',
  }

  const textStyle: CSSProperties = {
    fontFamily: text.fontFamily,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight,
    fontStyle: text.fontStyle,
    color: text.color,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    userSelect: 'none',
    ...textExtraCSS(text),
  }

  return (
    <div style={rowStyle}>
      {IconComp && (
        <IconComp size={iconSize} color={text.color} strokeWidth={1.5} />
      )}
      {text.content && <span style={textStyle}>{text.content}</span>}
    </div>
  )
}
