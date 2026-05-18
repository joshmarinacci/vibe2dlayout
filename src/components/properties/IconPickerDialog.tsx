import {ALL_ICONS} from '@utils/allLucideIcons'
import {X} from 'lucide-react'
import {useEffect, useRef, useState} from 'react'
import styles from './IconPickerDialog.module.css'

interface Props {
    currentIcon: string | null
    onSelect: (name: string) => void
    onClose: () => void
}

export function IconPickerDialog({currentIcon, onSelect, onClose}: Props) {
    const [query, setQuery] = useState('')
    const searchRef = useRef<HTMLInputElement>(null)
    const activeIconRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        searchRef.current?.focus()
        activeIconRef.current?.scrollIntoView({block: 'center'})
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    const filtered = query.trim()
        ? ALL_ICONS.filter(({label, name}) =>
            label.toLowerCase().includes(query.toLowerCase()) ||
            name.toLowerCase().includes(query.toLowerCase())
        )
        : ALL_ICONS

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>Choose Icon</span>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
                </div>

                <div className={styles.searchRow}>
                    <input
                        ref={searchRef}
                        className={styles.searchInput}
                        type="text"
                        placeholder="Search icons…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>

                <div
                    className={styles.count}>{filtered.length} icon{filtered.length !== 1 ? 's' : ''}</div>

                <div className={styles.grid}>
                    {filtered.length === 0 ? (
                        <div className={styles.empty}>No icons match "{query}"</div>
                    ) : (
                        filtered.map(({name, label, Icon}) => (
                            <button
                                key={name}
                                ref={currentIcon === name ? activeIconRef : undefined}
                                className={`${styles.cell} ${currentIcon === name ? styles.cellActive : ''}`}
                                title={label}
                                onClick={() => {
                                    onSelect(name);
                                    onClose()
                                }}
                            >
                                <Icon size={18} strokeWidth={1.5}/>
                                <span className={styles.cellName}>{label}</span>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
