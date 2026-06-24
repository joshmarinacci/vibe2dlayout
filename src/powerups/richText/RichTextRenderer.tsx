import {buildCSSTransform} from '@model/transform'
import type {RichTextShape} from '@model/shapes'
import type {ShapeRenderProps} from '@powerups/types'
import {useAppState} from '@store/context'
import {marked} from 'marked'
import {DEFAULT_STYLE_SET, DEFAULT_STYLE_SET_ID} from './defaultStyleSet'
import {styleSetToCSS} from './styleSetToCSS'
import type {RichTextDocumentSettings} from './types'
import {useTextEdit} from '@components/canvas/shapes/useTextEdit'

const POWER_UP_ID = 'powerup.rich-text'

function getRichTextSettings(state: ReturnType<typeof useAppState>['state']): RichTextDocumentSettings {
    const entry = state.document.powerUps?.find(p => p.id === POWER_UP_ID)
    const settings = entry?.settings as RichTextDocumentSettings | undefined
    return settings ?? {styleSets: [DEFAULT_STYLE_SET], defaultStyleSetId: DEFAULT_STYLE_SET_ID}
}

const markedOptions = {breaks: true, gfm: true}

export function RichTextRenderer({shape: rawShape, isEditingText, dispatch, onClick, onDoubleClick}: ShapeRenderProps) {
    const shape = rawShape as RichTextShape
    const {state} = useAppState()
    const settings = getRichTextSettings(state)
    const styleSet = settings.styleSets.find(s => s.id === shape.styleSetId) ?? DEFAULT_STYLE_SET
    const scopeClass = `rt-${shape.id}`
    const css = styleSetToCSS(styleSet, scopeClass)
    const html = marked(shape.content, markedOptions) as string

    const {x, y, width: w, height: h} = shape.transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: shape.content,
        isEditing: isEditingText,
        shapeId: shape.id,
        dispatch,
    })

    const outer: React.CSSProperties = {
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        overflow: 'hidden',
        cursor: 'move',
        userSelect: 'none',
        transform: buildCSSTransform(shape.transform),
        transformOrigin: 'center center',
        backgroundColor: shape.backgroundColor ?? 'transparent',
        boxSizing: 'border-box',
    }

    if (isEditingText) {
        return (
            <div style={outer} onClick={onClick} onDoubleClick={onDoubleClick}>
                <textarea
                    ref={textareaRef}
                    defaultValue={shape.content}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        background: 'transparent',
                        resize: 'none',
                        outline: 'none',
                        padding: shape.padding,
                        boxSizing: 'border-box',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: '#1a1a1a',
                    }}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onClick={onClickTextarea}
                />
            </div>
        )
    }

    return (
        <div style={outer} onClick={onClick} onDoubleClick={onDoubleClick}>
            <style dangerouslySetInnerHTML={{__html: css}} />
            <div
                className={scopeClass}
                style={{padding: shape.padding, height: '100%', overflow: 'hidden', boxSizing: 'border-box'}}
                dangerouslySetInnerHTML={{__html: html}}
            />
        </div>
    )
}
