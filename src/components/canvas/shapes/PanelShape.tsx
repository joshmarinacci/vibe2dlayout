import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import { useRef, useEffect, type Dispatch } from 'react'
import type { PanelShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughRect, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import { textExtraCSS } from '@utils/textStyleCSS'
import styles from './Shape.module.css'

interface Props {
  shape: PanelShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
  handDrawn: boolean
}

export function PanelShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, children, handDrawn }: Props) {
  const { transform, fill, stroke, title, clipChildren } = shape
  const { x, y, width, height } = transform
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editValueRef = useRef(title?.content ?? '')
  const cancelRef = useRef(false)
  const wasEditingRef = useRef(false)

  useEffect(() => {
    if (isEditing && !wasEditingRef.current) {
      wasEditingRef.current = true
      editValueRef.current = title?.content ?? ''
      cancelRef.current = false
      textareaRef.current?.focus()
      textareaRef.current?.select()
    } else if (!isEditing && wasEditingRef.current) {
      wasEditingRef.current = false
      if (!cancelRef.current && title) {
        dispatch({ type: 'COMMIT_TEXT_EDIT', id: shape.id, content: editValueRef.current })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const titleBarHeight = title ? (title.fontSize + 12) : 0
  const pad = 2

  const seed = seedFromId(shape.id)
  const bodyPaths = handDrawn ? roughRect(pad, pad, width - pad * 2, height - pad * 2, {
    seed,
    roughness: 1.4,
    bowing: 1,
    fill: fill.color === 'transparent' ? undefined : fill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width,
  }) : []

  const dividerPaths = handDrawn && title ? roughLine(pad, titleBarHeight, width - pad, titleBarHeight, {
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
        ...boxShadowCSS(shape),
        left: x,
        top: y,
        width,
        height,
        transform: buildCSSTransform(transform),
        transformOrigin: 'center center',
        opacity: fill.opacity,
        overflow: clipChildren ? 'hidden' : 'visible',
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
          <RoughSvgPaths paths={bodyPaths} />
          <RoughSvgPaths paths={dividerPaths} />
        </svg>
      ) : (
        <>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: fillBackground(fill),
            ...strokeBorderCSS(stroke),
            borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
          }} />
          {title && (
            <div style={{
              position: 'absolute',
              top: stroke.width,
              left: stroke.width,
              right: stroke.width,
              height: titleBarHeight,
              borderBottom: `${stroke.width * 0.75}px solid ${stroke.color}`,
            }} />
          )}
        </>
      )}

      {/* Title bar */}
      {title && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: titleBarHeight,
          overflow: 'hidden',
          zIndex: 1,
        }}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              defaultValue={title.content}
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                background: 'transparent',
                resize: 'none',
                fontFamily: title.fontFamily,
                fontSize: title.fontSize,
                fontWeight: title.fontWeight,
                color: title.color,
                textAlign: title.align,
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
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '0 8px',
              overflow: 'hidden',
            }}>
              <div style={{
                fontFamily: title.fontFamily,
                fontSize: title.fontSize,
                fontWeight: title.fontWeight,
                fontStyle: title.fontStyle,
                color: title.color,
                textAlign: title.align,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                width: '100%',
                userSelect: 'none',
                ...textExtraCSS(title),
              }}>
                {title.content}
              </div>
            </div>
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
