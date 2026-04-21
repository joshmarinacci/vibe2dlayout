import type { Dispatch } from 'react'
import type { AppAction } from '@store/types'
import { FileText } from 'lucide-react'
import styles from './DocumentRow.module.css'

interface Props {
  documentName: string
  documentSelected: boolean
  dispatch: Dispatch<AppAction>
}

export function DocumentRow({ documentName, documentSelected, dispatch }: Props) {
  return (
    <div
      className={`${styles.row} ${documentSelected ? styles.selected : ''}`}
      onClick={() => dispatch({ type: 'SELECT_DOCUMENT' })}
      title="Document"
    >
      <FileText size={13} className={styles.icon} />
      <span className={styles.name}>{documentName}</span>
    </div>
  )
}
