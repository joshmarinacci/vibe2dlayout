import type { Dispatch } from 'react'
import type { AppAction } from '@store/types'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'

interface Props {
  id: string
  content: string
  dispatch: Dispatch<AppAction>
}

export function ContentSection({ id, content, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Content</div>
      <textarea
        className={inputStyles.contentTextarea}
        value={content}
        rows={3}
        onChange={e =>
          dispatch({ type: 'COMMIT_TEXT_EDIT', id, content: e.target.value })
        }
        onKeyDown={e => e.stopPropagation()}
      />
    </div>
  )
}
