import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {SelectShape} from '@model/shapes'
import {strokeColor} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {boxShadowCSS} from '@utils/shadowCSS'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import {ChevronDown} from 'lucide-react'
import {type Dispatch, useEffect, useRef} from 'react'
import styles from './Shape.module.css'

interface Props {
    shape: SelectShape
    isSelected: boolean
    isEditing: boolean
    handDrawn: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
}

export function SelectShapeComp({
                                    shape,
                                    isSelected,
                                    isEditing,
                                    handDrawn,
                                    dispatch,
                                    onClick,
                                    onDoubleClick
                                }: Props) {
    const {transform, placeholder, text, fill, stroke} = shape
    const {x, y, width, height} = transform
    const inputRef = useRef<HTMLInputElement>(null)
    const editValueRef = useRef(text.content)
    const cancelRef = useRef(false)
    const wasEditingRef = useRef(false)

    useEffect(() => {
        if (isEditing && !wasEditingRef.current) {
            wasEditingRef.current = true
            editValueRef.current = text.content
            cancelRef.current = false
            inputRef.current?.focus()
            inputRef.current?.select()
        } else if (!isEditing && wasEditingRef.current) {
            wasEditingRef.current = false
            if (!cancelRef.current) {
                dispatch({type: 'COMMIT_TEXT_EDIT', id: shape.id, content: editValueRef.current})
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    const displayText = text.content || placeholder
    const isPlaceholder = !text.content

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
                    <RoughSvgPaths paths={makeRoughRect(shape)}/>
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: fillBackground(fill),
                    ...strokeBorderCSS(stroke),
                    borderRadius: 4,
                    opacity: fill.opacity,
                }}/>
            )}

            {isEditing ? (
                <input
                    ref={inputRef}
                    defaultValue={text.content}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        border: 'none',
                        background: 'transparent',
                        fontFamily: text.fontFamily,
                        fontSize: text.fontSize,
                        fontWeight: text.fontWeight,
                        color: text.color,
                        outline: 'none',
                        padding: '0 24px 0 8px',
                    }}
                    onChange={e => {
                        editValueRef.current = e.target.value
                    }}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
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
                    alignItems: 'center',
                    padding: '0 24px 0 8px',
                    fontFamily: text.fontFamily,
                    fontSize: text.fontSize,
                    fontWeight: text.fontWeight,
                    color: isPlaceholder ? '#999' : text.color,
                    userSelect: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    ...textExtraCSS(text),
                }}>
                    {displayText}
                </div>
            )}

            <div style={{
                position: 'absolute',
                right: 4,
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                color: strokeColor(stroke),
                pointerEvents: 'none',
            }}>
                <ChevronDown size={14}/>
            </div>
        </div>
    )
}
