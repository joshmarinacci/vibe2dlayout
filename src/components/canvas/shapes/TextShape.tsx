import type {TextShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import type {AppAction} from '@store/types'
import {svgFill} from '@utils/fillSVG'
import {svgDropShadow} from '@utils/shadowSVG'
import {buildSvgTransform} from '@utils/svgTransform'
import {textExtraCSS, textGradientKey, textGradientSpanCSS, textStrokeCSS} from '@utils/textStyleCSS'
import type {Dispatch} from 'react'
import {EmojiCompletionPopup} from './EmojiCompletionPopup'
import {useTextEdit, vAlignToJustify} from './useTextEdit'

interface Props {
    shape: TextShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
}

export function TextShapeComp({
    shape,
    isEditing,
    dispatch,
    onClick,
    onDoubleClick,
}: Props) {
    const {transform, text, fill} = shape
    const {x, y, width: w, height: h} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea, emojiCompletion} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const fillResult = svgFill(fill, shape.id, w, h)
    const shadow = svgDropShadow(shape.boxShadow, shape.id)
    const hasDefs = fillResult.defs || shadow
    const filterAttr = shadow ? `url(#shadow-${shape.id})` : undefined
    const svgTransform = buildSvgTransform(transform)

    const gradientSpan = textGradientSpanCSS(text)
    const gradientKey = textGradientKey(text)

    const extraCSS = textExtraCSS(text)
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
        ...extraCSS,
        ...textStrokeCSS(text),
        // Force GPU compositing layer so font-variation-settings re-evaluates on every
        // render — browsers sometimes cache glyph rendering inside foreignObject.
        ...(text.fontVariationSettings && Object.keys(text.fontVariationSettings).length > 0
            ? {transform: (extraCSS as React.CSSProperties).transform
                ? (extraCSS as React.CSSProperties).transform + ' translateZ(0)'
                : 'translateZ(0)'}
            : {}),
    }

    return (
        <svg
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                overflow: 'visible',
                cursor: 'move',
                userSelect: 'none',
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {hasDefs && (
                <defs>
                    {fillResult.defs}
                    {shadow?.filterEl}
                </defs>
            )}
            <rect
                x={0} y={0} width={w} height={h}
                fill={fillResult.fillAttr}
                fillOpacity={fillResult.opacity}
                filter={filterAttr}
                transform={svgTransform}
                pointerEvents="all"
            />
            <foreignObject x={0} y={0} width={w} height={h} transform={svgTransform}>
                {isEditing ? (
                    <>
                        <textarea
                            ref={textareaRef}
                            defaultValue={text.content}
                            style={{
                                display: 'block',
                                width: w,
                                height: h,
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
                                padding: '4px 8px',
                                boxSizing: 'border-box',
                                ...textExtraCSS(text),
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
                        width: w,
                        height: h,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: vAlignToJustify(text.verticalAlign),
                        padding: '4px 8px',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                    }}>
                        <div style={textStyle}>
                            {gradientSpan ?
                                <span key={gradientKey} style={gradientSpan}>{text.content}</span>
                                : text.content}
                        </div>
                    </div>
                )}
            </foreignObject>
        </svg>
    )
}
