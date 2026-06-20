import type React from 'react'
import type {RefObject} from 'react'
import {ChevronDown, ChevronRight} from 'lucide-react'
import styles from './SectionHeader.module.css'

interface Props {
    label: string
    collapsible?: boolean
    collapsed?: boolean
    onToggle?: () => void
    actionLabel?: string
    actionTitle?: string
    actionButtonRef?: RefObject<HTMLButtonElement>
    onAction?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export function SectionHeader({
    label,
    collapsible,
    collapsed,
    onToggle,
    actionLabel = '+',
    actionTitle,
    actionButtonRef,
    onAction,
}: Props) {
    if (collapsible) {
        return (
            <div className={styles.header}>
                <div className={styles.clickable} onClick={onToggle}>
                    {collapsed
                        ? <ChevronRight size={10} className={styles.chevron}/>
                        : <ChevronDown size={10} className={styles.chevron}/>
                    }
                    {label}
                </div>
                {onAction && (
                    <button
                        ref={actionButtonRef}
                        className={styles.actionBtn}
                        title={actionTitle}
                        onClick={e => {
                            e.stopPropagation()
                            onAction(e)
                        }}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        )
    }
    return (
        <div className={styles.header}>
            <span>{label}</span>
            {onAction && (
                <button
                    ref={actionButtonRef}
                    className={styles.actionBtn}
                    title={actionTitle}
                    onClick={e => {
                        e.stopPropagation()
                        onAction(e)
                    }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
