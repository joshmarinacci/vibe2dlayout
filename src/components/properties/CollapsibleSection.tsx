import {useState} from 'react'
import styles from './PropertiesPanel.module.css'

interface Props {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}

// Module-level map so open/closed state survives selection changes
const sectionState = new Map<string, boolean>()

export function CollapsibleSection({title, children, defaultOpen = true}: Props) {
    const [open, setOpen] = useState(() => {
        if (sectionState.has(title)) return sectionState.get(title)!
        return defaultOpen
    })

    const toggle = () => {
        const next = !open
        sectionState.set(title, next)
        setOpen(next)
    }

    return (
        <div className={styles.section}>
            <div className={styles.sectionTitleRow} onClick={toggle}>
                <span
                    className={`${styles.sectionChevron} ${open ? styles.sectionChevronOpen : ''}`}>›</span>
                <span className={styles.sectionTitle} style={{marginBottom: 0}}>{title}</span>
            </div>
            {open && <div className={styles.sectionBody}>{children}</div>}
        </div>
    )
}
