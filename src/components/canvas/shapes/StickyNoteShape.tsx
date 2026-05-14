import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {StickyNoteShape} from '@model/shapes'
import {strokeColor} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS, textGradientKey, textGradientSpanCSS} from '@utils/textStyleCSS'
import type {Dispatch} from 'react'
import {useTextEdit} from './useTextEdit'

const FOLD = 20

interface Props {
    shape: StickyNoteShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function StickyNoteShapeComp({
                                        shape,
                                        isSelected,
                                        isEditing,
                                        dispatch,
                                        onClick,
                                        onDoubleClick,
                                        handDrawn
                                    }: Props) {
    const {transform, fill, stroke, text} = shape
    const {width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const seed = seedFromId(shape.id)
    const pad = 2

    // Body (clip the top-right corner with clip-path)
    // const clipPath = `polygon(0 0, ${width - FOLD}px 0, ${width}px ${FOLD}px, ${width}px ${height}px, 0 ${height}px)`

    // Hand-drawn paths: body rect + two fold lines

    // The fold shadow line (horizontal, then vertical)
    const foldH = handDrawn ? roughLine(width - FOLD - pad, pad, width - pad, FOLD + pad, {
        seed: seed + 1,
        roughness: 1,
        stroke: strokeColor(stroke),
        strokeWidth: stroke.width * 0.75,
    }) : []

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
                    <RoughSvgPaths paths={makeRoughRect(shape)}/>
                    <RoughSvgPaths paths={foldH}/>
                </svg>
            ) : (
                <>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: fillBackground(fill),
                        ...strokeBorderCSS(stroke),
                    }}/>
                    {/* Fold corner triangle overlay */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: FOLD,
                            height: FOLD,
                            overflow: 'visible'
                        }}
                        width={FOLD}
                        height={FOLD}
                    >
                        {/* Darken the fold crease */}
                        <line x1={0} y1={0} x2={FOLD} y2={FOLD} stroke={strokeColor(stroke)}
                              strokeWidth={stroke.width * 0.75}/>
                    </svg>
                </>
            )}

            {/* Text area */}
            <div style={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: handDrawn ? 8 : FOLD + 4,
                bottom: 8,
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
                            padding: 0,
                            ...textExtraCSS(text),
                        }}
                        onChange={onChange}
                        onKeyDown={onKeyDown}
                        onClick={onClickTextarea}
                    />
                ) : (
                    <div style={{
                        fontFamily: text.fontFamily,
                        fontSize: text.fontSize,
                        fontWeight: text.fontWeight,
                        fontStyle: text.fontStyle,
                        color: text.color,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        userSelect: 'none',
                        ...textExtraCSS(text),
                    }}>
                        {(() => {
                            const g = textGradientSpanCSS(text);
                            return g ? <span key={textGradientKey(text)} style={g}>{text.content}</span> : text.content
                        })()}
                    </div>
                )}
            </div>
        </BoxShapeBase>
    )
}
