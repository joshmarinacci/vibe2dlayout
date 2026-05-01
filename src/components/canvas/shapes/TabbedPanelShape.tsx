import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import { fillBackground } from '@utils/fillCSS'
import { strokeBorderCSS, cornerRadiiCSS } from '@utils/strokeStyleCSS'
import { useRef, useEffect, type Dispatch } from 'react'
import type { TabbedPanelShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: TabbedPanelShape
  isSelected: boolean
  isEditing: boolean
  dispatch: Dispatch<AppAction>
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  children?: React.ReactNode
  handDrawn: boolean
}

export function TabbedPanelShapeComp({ shape, isSelected, isEditing, dispatch, onClick, onDoubleClick, children, handDrawn }: Props) {
  const { transform, fill, stroke, text, activeTab, clipChildren } = shape
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

  const tabLabels = text.content.split(',').map(t => t.trim()).filter(Boolean)
  const safeActiveTab = Math.max(0, Math.min(activeTab, tabLabels.length - 1))
  const tabBarHeight = text.fontSize + 16
  const pad = 2

  const seed = seedFromId(shape.id)

  const dividerPaths = handDrawn ? roughLine(pad, tabBarHeight, width - pad, tabBarHeight, {
    seed: seed + 1,
    roughness: 1,
    stroke: stroke.color,
    strokeWidth: stroke.width * 0.75,
  }) : []

  const tabCount = tabLabels.length || 1
  const tabSeparatorPaths = handDrawn
    ? tabLabels.slice(0, -1).flatMap((_, i) => {
        const sepX = (width / tabCount) * (i + 1)
        return roughLine(sepX, 2, sepX, tabBarHeight - 2, {
          seed: seed + 2 + i,
          roughness: 0.8,
          stroke: stroke.color,
          strokeWidth: stroke.width * 0.5,
        })
      })
    : []

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
          <RoughSvgPaths paths={makeRoughRect(shape)} />
          <RoughSvgPaths paths={dividerPaths} />
          <RoughSvgPaths paths={tabSeparatorPaths} />
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
          <div style={{
            position: 'absolute',
            top: stroke.width,
            left: stroke.width,
            right: stroke.width,
            height: tabBarHeight,
            borderBottom: `${stroke.width * 0.75}px solid ${stroke.color}`,
          }} />
        </>
      )}

      {/* Tab bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: tabBarHeight,
        display: 'flex',
        zIndex: 1,
        overflow: 'hidden',
      }}>
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
          tabLabels.map((label, i) => {
            const isActive = i === safeActiveTab
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: text.fontFamily,
                  fontSize: text.fontSize,
                  fontWeight: isActive ? 'bold' : text.fontWeight,
                  color: text.color,
                  opacity: isActive ? 1 : 0.45,
                  borderRight: i < tabLabels.length - 1
                    ? `${Math.max(stroke.width * 0.5, 0.5)}px solid ${stroke.color}`
                    : 'none',
                  userSelect: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '0 4px',
                }}
              >
                {label}
              </div>
            )
          })
        )}
      </div>

      {/* Content area */}
      <div style={{ position: 'absolute', top: tabBarHeight, left: 0, right: 0, bottom: 0 }}>
        {children}
      </div>
    </div>
  )
}
