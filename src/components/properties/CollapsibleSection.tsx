import { useState } from 'react'
import styles from './PropertiesPanel.module.css'

interface Props {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ title, children, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitleRow} onClick={() => setOpen(v => !v)}>
        <span className={`${styles.sectionChevron} ${open ? styles.sectionChevronOpen : ''}`}>›</span>
        <span className={styles.sectionTitle} style={{ marginBottom: 0 }}>{title}</span>
      </div>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  )
}
