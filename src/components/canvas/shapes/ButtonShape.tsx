import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {ButtonShape, TextStyle} from '@model/shapes'
import type {AppAction} from '@store/types'
import {getButtonIcon} from '@utils/buttonIcons'
import {fillBackground} from '@utils/fillCSS'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {cornerRadiiCSS, strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS, textGradientKey, textGradientSpanCSS} from '@utils/textStyleCSS'
import {type CSSProperties, type Dispatch} from 'react'
import {BoxShapeBase} from "./BoxShapeBase";
import {EmojiCompletionPopup} from './EmojiCompletionPopup'
import {useTextEdit, vAlignToJustify} from './useTextEdit'

interface Props {
    shape: ButtonShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function ButtonShapeComp({
                                    shape,
                                    isSelected,
                                    isEditing,
                                    dispatch,
                                    onClick,
                                    onDoubleClick,
                                    handDrawn
                                }: Props) {
    const {transform, fill, stroke, text, icon} = shape
    const {width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea, emojiCompletion} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const vJustify = vAlignToJustify(text.verticalAlign)

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
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: fillBackground(fill),
                    ...strokeBorderCSS(stroke),
                    borderRadius: cornerRadiiCSS(shape.cornerRadius ?? 0, shape.cornerRadii),
                }}/>
            )}

            {isEditing ? (
                <>
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
                        pointerEvents: 'all',
                    }}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onClick={onClickTextarea}
                />
                <EmojiCompletionPopup
                    state={emojiCompletion.emojiState}
                    onSelect={emojiCompletion.onSelectEmoji}
                    onClose={emojiCompletion.closeEmoji}
                    setPopupRef={emojiCompletion.setPopupRef}
                    setSelectedIndex={emojiCompletion.setSelectedIndex}
                />
                </>
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
                    <ButtonContent text={text} icon={icon}/>
                </div>
            )}
        </BoxShapeBase>
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
        ...(textGradientSpanCSS(text) ?? {}),
    }

    return (
        <div style={rowStyle}>
            {IconComp && (
                <IconComp size={iconSize} color={text.color} strokeWidth={1.5}/>
            )}
            {text.content && <span key={textGradientKey(text)} style={textStyle}>{text.content}</span>}
        </div>
    )
}
