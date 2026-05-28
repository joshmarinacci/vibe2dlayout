import {useAppState} from '@store/context'
import {shortcutEvents} from '@utils/shortcutEvents'
import {useEffect, useState} from 'react'
import styles from './ShortcutIndicator.module.css'

interface ShortcutFlash {
    keys: string
    description: string
    id: number
}

export function ShortcutIndicator() {
    const {state} = useAppState()
    const [current, setCurrent] = useState<ShortcutFlash | null>(null)

    useEffect(() => {
        return shortcutEvents.subscribe((keys, description) => {
            setCurrent({keys, description, id: Date.now()})
        })
    }, [])

    // Clear after animation completes
    useEffect(() => {
        if (!current) return
        const timer = setTimeout(() => setCurrent(null), 2500)
        return () => clearTimeout(timer)
    }, [current])

    if (!state.settings.showShortcutIndicator || !current) return null

    return (
        <div key={current.id} className={styles.indicator}>
            <kbd className={styles.keys}>{current.keys}</kbd>
            <span className={styles.description}>{current.description}</span>
        </div>
    )
}
