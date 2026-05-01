import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import inputStyles from '../inputs/inputs.module.css'

interface Props {
    id: string
    content: string
    dispatch: Dispatch<AppAction>
}

export function ContentSection({id, content, dispatch}: Props) {
    return (
        <CollapsibleSection title="Content">
<textarea
    className={inputStyles.contentTextarea}
    value={content}
    rows={3}
    onChange={e =>
        dispatch({type: 'COMMIT_TEXT_EDIT', id, content: e.target.value})
    }
    onKeyDown={e => e.stopPropagation()}
/>
        </CollapsibleSection>
    )
}
