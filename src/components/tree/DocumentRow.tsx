import { useState, useRef, type Dispatch } from 'react'
import type { AppAction } from '@store/types'
import { FileText, Plus } from 'lucide-react'
import styles from './DocumentRow.module.css'

interface Props {
  documentName: string
  documentSelected: boolean
  dispatch: Dispatch<AppAction>
  onAddPage: () => void
  onRename: (name: string) => void
}

export function DocumentRow({ documentName, documentSelected, dispatch, onAddPage, onRename }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(documentName)
  const inputRef = useRef<HTMLInputElement>(null)

  const startRename = () => {
    setEditName(documentName)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitRename = () => {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== documentName) onRename(trimmed)
    setIsEditing(false)
  }

  return (
    <div
      className={`${styles.row} ${documentSelected ? styles.selected : ''}`}
      onClick={() => dispatch({ type: 'SELECT_DOCUMENT' })}
      onDoubleClick={e => { e.stopPropagation(); startRename() }}
      title="Document"
    >
      <FileText size={13} className={styles.icon} />
      {isEditing ? (
        <input
          ref={inputRef}
          className={styles.nameInput}
          value={editName}
          autoFocus
          onChange={e => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename() }
            if (e.key === 'Escape') setIsEditing(false)
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className={styles.name}>{documentName}</span>
      )}
      <button
        className={styles.addPageBtn}
        title="Add page"
        onClick={e => { e.stopPropagation(); onAddPage() }}
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
