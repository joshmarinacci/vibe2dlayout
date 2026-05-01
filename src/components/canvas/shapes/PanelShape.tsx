import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {PanelShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {cornerRadiiCSS, strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS, textGradientSpanCSS} from '@utils/textStyleCSS'
import {type Dispatch, useEffect, useRef} from 'react'

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

export function PanelShapeComp({
                                   shape,
                                   isSelected,
                                   isEditing,
                                   dispatch,
                                   onClick,
                                   onDoubleClick,
                                   children,
                                   handDrawn
                               }: Props) {
    const {transform, fill, stroke, text, clipChildren} = shape
    const {width, height} = transform
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const editValueRef = useRef(text?.content ?? '')
    const cancelRef = useRef(false)
    const wasEditingRef = useRef(false)

    useEffect(() => {
        if (isEditing && !wasEditingRef.current) {
            wasEditingRef.current = true
            editValueRef.current = text?.content ?? ''
            cancelRef.current = false
            textareaRef.current?.focus()
            textareaRef.current?.select()
        } else if (!isEditing && wasEditingRef.current) {
            wasEditingRef.current = false
            if (!cancelRef.current && text) {
                dispatch({type: 'COMMIT_TEXT_EDIT', id: shape.id, content: editValueRef.current})
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    const titleBarHeight = text ? (text.fontSize + 12) : 0
    const pad = 2

    const seed = seedFromId(shape.id)

    const dividerPath = handDrawn && text ? roughLine(pad, titleBarHeight, width - pad, titleBarHeight, {
        seed: seed + 1,
        roughness: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width * 0.75,
    }) : []

    return (
        <BoxShapeBase shape={shape} isSelected={isSelected} onClick={onClick}
                      onDoubleClick={onDoubleClick} clipChildren={clipChildren}>
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
                    <RoughSvgPaths paths={dividerPath}/>
                </svg>
            ) : (
                <>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: fillBackground(fill),
                        ...strokeBorderCSS(stroke),
                        borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
                    }}/>
                    {text && (
                        <div style={{
                            position: 'absolute',
                            top: stroke.width,
                            left: stroke.width,
                            right: stroke.width,
                            height: titleBarHeight,
                            borderBottom: `${stroke.width * 0.75}px solid ${stroke.color}`,
                        }}/>
                    )}
                </>
            )}

            {/* Title bar */}
            {text && (
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
                                ...textExtraCSS(text),
                            }}
                            onChange={e => {
                                editValueRef.current = e.target.value
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                    dispatch({type: 'STOP_TEXT_EDIT'})
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return
                                }
                                if (e.key === 'Escape') {
                                    cancelRef.current = true
                                    dispatch({type: 'STOP_TEXT_EDIT'})
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return
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
                                ...textExtraCSS(text),
                            }}>
                                {(() => {
                                    const g = textGradientSpanCSS(text);
                                    return g ? <span style={g}>{text.content}</span> : text.content
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Children area */}
            <div style={{position: 'absolute', top: titleBarHeight, left: 0, right: 0, bottom: 0}}>
                {children}
            </div>
        </BoxShapeBase>
    )
}
