import type {CheckboxShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {boxShadowCSS} from '@utils/shadowCSS'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import {type Dispatch} from 'react'
import styles from './Shape.module.css'
import {useTextEdit} from './useTextEdit'

interface Props {
    shape: CheckboxShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function CheckboxShapeComp({
                                      shape,
                                      isSelected,
                                      isEditing,
                                      dispatch,
                                      onClick,
                                      onDoubleClick,
                                      handDrawn
                                  }: Props) {
    const {transform, checked, text, fill, stroke} = shape
    const {x, y, width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const boxSize = Math.min(height - 2, 16)
    const boxY = (height - boxSize) / 2

    const seed = seedFromId(shape.id)
    const boxPaths = handDrawn ? roughRect(1, boxY, boxSize, boxSize, {
        seed,
        roughness: 1.2,
        bowing: 0.5,
        fill: fill.color === 'transparent' ? undefined : fill.color,
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    }) : []

    const checkPaths = handDrawn && checked ? [
        ...roughLine(3, boxY + boxSize * 0.5, boxSize * 0.42, boxY + boxSize * 0.78, {
            seed: seed + 1,
            roughness: 1.5,
            stroke: stroke.color,
            strokeWidth: stroke.width + 0.5,
        }),
        ...roughLine(boxSize * 0.42, boxY + boxSize * 0.78, boxSize - 2, boxY + boxSize * 0.22, {
            seed: seed + 2,
            roughness: 1.5,
            stroke: stroke.color,
            strokeWidth: stroke.width + 0.5,
        }),
    ] : []

    const labelLeft = boxSize + 6

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
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'visible'
                    }}
                    width={width}
                    height={height}
                >
                    <RoughSvgPaths paths={boxPaths}/>
                    <RoughSvgPaths paths={checkPaths}/>
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    left: 1,
                    top: boxY,
                    width: boxSize,
                    height: boxSize,
                    background: fillBackground(fill),
                    ...strokeBorderCSS(stroke),
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {checked && (
                        <svg width={boxSize - 4} height={boxSize - 4} viewBox="0 0 12 12">
                            <polyline points="2,6 5,9 10,3" fill="none" stroke={stroke.color}
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    )}
                </div>
            )}

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
                        ...textExtraCSS(text),
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
                    ...textExtraCSS(text),
                }}>
                    {text.content}
                </div>
            )}
        </div>
    )
}
