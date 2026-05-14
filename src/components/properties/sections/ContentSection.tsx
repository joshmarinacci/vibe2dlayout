import {EmojiCompletionPopup} from '@components/canvas/shapes/EmojiCompletionPopup'
import {useEmojiCompletion} from '@components/canvas/shapes/useEmojiCompletion'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {useRef} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'

interface Props {
    id: string
    content: string
    dispatch: Dispatch<AppAction>
}

export function ContentSection({id, content, dispatch}: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // For a controlled textarea (value={content}), DOM mutation + synthetic events
    // don't reliably trigger React's onChange. Pass a direct dispatch callback instead.
    const emojiCompletion = useEmojiCompletion(textareaRef, (newValue, newCursorPos) => {
        dispatch({type: 'COMMIT_TEXT_EDIT', id, content: newValue})
        // Restore cursor position after React reconciles the textarea to the new value
        requestAnimationFrame(() => {
            textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
        })
    })

    return (
        <CollapsibleSection title="Content">
            <textarea
                ref={textareaRef}
                className={'span-full-grid'}
                value={content}
                rows={3}
                onChange={e => {
                    dispatch({type: 'COMMIT_TEXT_EDIT', id, content: e.target.value})
                    emojiCompletion.onEmojiChange(e)
                }}
                onKeyDown={e => {
                    if (emojiCompletion.onEmojiKeyDown(e)) return
                    e.stopPropagation()
                }}
            />
            <EmojiCompletionPopup
                state={emojiCompletion.emojiState}
                onSelect={emojiCompletion.onSelectEmoji}
                onClose={emojiCompletion.closeEmoji}
                setPopupRef={emojiCompletion.setPopupRef}
                setSelectedIndex={emojiCompletion.setSelectedIndex}
            />
        </CollapsibleSection>
    )
}
