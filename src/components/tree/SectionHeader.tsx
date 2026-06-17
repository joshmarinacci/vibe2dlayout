import {ChevronDown, ChevronRight} from 'lucide-react'
import styles from './SectionHeader.module.css'

interface Props {
    label: string
    collapsible?: boolean
    collapsed?: boolean
    onToggle?: () => void
}

export function SectionHeader({label, collapsible, collapsed, onToggle}: Props) {
    if (collapsible) {
        return (
            <div className={`${styles.header} ${styles.clickable}`} onClick={onToggle}>
                {collapsed
                    ? <ChevronRight size={10} className={styles.chevron}/>
                    : <ChevronDown size={10} className={styles.chevron}/>
                }
                {label}
            </div>
        )
    }
    return <div className={styles.header}>{label}</div>
}
