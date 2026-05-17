import {useEffect, useRef, useState} from 'react'
import styles from './inputs.module.css'

interface Props {
    label: string
    value: boolean
    onChange: (v: boolean) => void
    className?: string
}

export function ToggleInput({
                                label,
                                value,
                                onChange,
                                className,
                            }: Props) {
    const [showDropdown, setShowDropdown] = useState(false)
    const wrapRef = useRef<HTMLDivElement>(null)


    useEffect(() => {
        if (!showDropdown) return
        const handler = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showDropdown])

    return (
        <div className={styles.field + (className?(' ' + className):'')}>
            <label className={styles.label}>{label}</label>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, position: 'relative'}}
                 ref={wrapRef}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={e => onChange(e.target.checked)}
                    className={styles.checkbox}
                />
            </div>
        </div>
    )
}
