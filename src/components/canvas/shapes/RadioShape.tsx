import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import type {RadioShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughCircle, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import {type Dispatch} from 'react'
import {useTextEdit} from './useTextEdit'

interface Props {
    shape: RadioShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function RadioShapeComp({
                                   shape,
                                   isSelected,
                                   isEditing,
                                   dispatch,
                                   onClick,
                                   onDoubleClick,
                                   handDrawn
                               }: Props) {
    const {transform, checked, text, fill, stroke} = shape
    const {width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const boxSize = Math.min(height - 2, 16)
    const cx = boxSize / 2 + 1
    const cy = height / 2

    const seed = seedFromId(shape.id)
    const circlePaths = handDrawn ? roughCircle(cx, cy, boxSize, {
        seed,
        roughness: 1.2,
        bowing: 0.5,
        fill: fill.color === 'transparent' ? undefined : fill.color,
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    }) : []

    const dotPaths = handDrawn && checked ? roughCircle(cx, cy, boxSize * 0.45, {
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
        <BoxShapeBase shape={shape} isSelected={isSelected} onClick={onClick}
                      onDoubleClick={onDoubleClick}>
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
                    <RoughSvgPaths paths={circlePaths}/>
                    <RoughSvgPaths paths={dotPaths}/>
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    left: 1,
                    top: cy - boxSize / 2,
                    width: boxSize,
                    height: boxSize,
                    background: fillBackground(fill),
                    ...strokeBorderCSS(stroke),
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {checked && (
                        <div style={{
                            width: boxSize * 0.45,
                            height: boxSize * 0.45,
                            background: stroke.color,
                            borderRadius: '50%',
                        }}/>
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
        </BoxShapeBase>
    )
}
