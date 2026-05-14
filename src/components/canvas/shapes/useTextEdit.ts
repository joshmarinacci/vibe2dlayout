import type {AppAction} from '@store/types'
import {type Dispatch, useEffect, useRef} from 'react'
import {useEmojiCompletion} from './useEmojiCompletion'

interface UseTextEditOptions {
    content: string
    isEditing: boolean
    shapeId: string
    dispatch: Dispatch<AppAction>
}

export function useTextEdit({content, isEditing, shapeId, dispatch}: UseTextEditOptions) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const editValueRef = useRef(content)
    const cancelRef = useRef(false)
    const wasEditingRef = useRef(false)

    const emojiCompletion = useEmojiCompletion(textareaRef)

    useEffect(() => {
        if (isEditing && !wasEditingRef.current) {
            wasEditingRef.current = true
            editValueRef.current = content
            cancelRef.current = false
            emojiCompletion.closeEmoji()
            textareaRef.current?.focus()
            textareaRef.current?.select()
        } else if (!isEditing && wasEditingRef.current) {
            wasEditingRef.current = false
            emojiCompletion.closeEmoji()
            if (!cancelRef.current) {
                dispatch({type: 'COMMIT_TEXT_EDIT', id: shapeId, content: editValueRef.current})
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        editValueRef.current = e.target.value
        emojiCompletion.onEmojiChange(e)
    }

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Emoji completion intercepts first; if consumed, do not process further
        if (emojiCompletion.onEmojiKeyDown(e)) return

        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            dispatch({type: 'STOP_TEXT_EDIT'})
            e.preventDefault()
            e.stopPropagation()
            return
        }
        if (e.key === 'Escape') {
            cancelRef.current = true
            dispatch({type: 'STOP_TEXT_EDIT'})
            e.preventDefault()
            e.stopPropagation()
            return
        }
        e.stopPropagation()
    }

    const onClickTextarea = (e: React.MouseEvent) => e.stopPropagation()

    return {textareaRef, editValueRef, onChange, onKeyDown, onClickTextarea, emojiCompletion}
}

export function vAlignToJustify(verticalAlign: string): React.CSSProperties['justifyContent'] {
    if (verticalAlign === 'top') return 'flex-start'
    if (verticalAlign === 'bottom') return 'flex-end'
    return 'center'
}
