import type {VibeDocument} from '@model/document'
import {deleteDoc, getIndex, loadDoc, type StoredDocEntry} from '@utils/localStorageDB'
import {Trash2, X} from 'lucide-react'
import {useEffect, useState} from 'react'
import styles from './DocumentsModal.module.css'

interface DocumentsModalProps {
    mode: 'open' | 'save-as'
    currentName: string
    onClose: () => void
    onLoad: (id: string, name: string, doc: VibeDocument) => void
    onSave: (id: string | null, name: string) => void
}

function formatDate(ts: number): string {
    const diff = Date.now() - ts
    const min = Math.floor(diff / 60000)
    if (min < 1) return 'just now'
    if (min < 60) return `${min}m ago`
    const hrs = Math.floor(min / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(ts).toLocaleDateString()
}

export function DocumentsModal({mode, currentName, onClose, onLoad, onSave}: DocumentsModalProps) {
    const [entries, setEntries] = useState<StoredDocEntry[]>([])
    const [name, setName] = useState(currentName)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    useEffect(() => {
        setEntries(getIndex())
    }, [])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        deleteDoc(id)
        setEntries(prev => prev.filter(en => en.id !== id))
        if (selectedId === id) setSelectedId(null)
    }

    const handleRowClick = (entry: StoredDocEntry) => {
        if (mode === 'open') {
            const result = loadDoc(entry.id)
            if (result) {
                onLoad(result.entry.id, result.entry.name, result.document)
            }
        } else {
            setSelectedId(entry.id)
            setName(entry.name)
        }
    }

    const handleSave = () => {
        if (!name.trim()) return
        onSave(selectedId, name.trim())
    }

    const title = mode === 'open' ? 'Open Document' : 'Save As'

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>{title}</span>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
                </div>
                <div className={styles.body}>
                    {mode === 'save-as' && (
                        <div className={styles.saveRow}>
                            <input
                                className={styles.nameInput}
                                type="text"
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    setSelectedId(null)
                                }}
                                placeholder="Document name"
                                autoFocus
                                onKeyDown={e => {
                                    if (e.key === 'Enter') handleSave()
                                }}
                            />
                            <button className={styles.saveBtn} onClick={handleSave}
                                    disabled={!name.trim()}>
                                Save
                            </button>
                        </div>
                    )}

                    {entries.length > 0 && (
                        <div className={styles.listLabel}>
                            {mode === 'open' ? 'Saved Documents' : 'Overwrite existing'}
                        </div>
                    )}

                    <div className={styles.list}>
                        {entries.length === 0 ? (
                            <div className={styles.empty}>No saved documents yet</div>
                        ) : (
                            entries.map(entry => (
                                <div
                                    key={entry.id}
                                    className={`${styles.docRow} ${selectedId === entry.id ? styles.docRowSelected : ''}`}
                                    onClick={() => handleRowClick(entry)}
                                >
                                    <div className={styles.docInfo}>
                                        <div className={styles.docName}>{entry.name}</div>
                                        <div
                                            className={styles.docDate}>{formatDate(entry.savedAt)}</div>
                                    </div>
                                    <button
                                        className={styles.deleteBtn}
                                        title="Delete"
                                        onClick={e => handleDelete(e, entry.id)}
                                    ><Trash2 size={13}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
