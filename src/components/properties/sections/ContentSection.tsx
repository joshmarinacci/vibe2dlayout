import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'

interface Props {
    id: string
    content: string
    dispatch: Dispatch<AppAction>
}

export function ContentSection({id, content, dispatch}: Props) {
    return (
        <CollapsibleSection title="Content">
<textarea
    className={'span-full-grid'}
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
