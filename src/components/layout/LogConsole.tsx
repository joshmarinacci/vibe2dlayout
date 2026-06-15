import {useAppDispatch, useAppState} from '@store/context'
import {clearLogRecords, useLogRecords} from '@logging'
import type {LogLevel, LogRecord} from '@logging'
import {Check, Copy, Pause, Play, Search, Trash2, X} from 'lucide-react'
import {useDeferredValue, useEffect, useMemo, useRef, useState} from 'react'
import styles from './LogConsole.module.css'

const ALL_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error']

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
}

function recordToText(record: LogRecord): string {
    const payload = record.payload === undefined ? '' : ` ${JSON.stringify(record.payload, null, 2)}`
    return `[${formatTime(record.timestamp)}] ${record.level.toUpperCase()} ${record.subsystem}: ${record.message}${payload}`
}

function recordSearchText(record: LogRecord): string {
    const payloadText = record.payload === undefined ? '' : JSON.stringify(record.payload)
    return `${record.subsystem} ${record.level} ${record.message} ${payloadText}`.toLowerCase()
}

interface LogConsoleProps {
    height?: number
}

export function LogConsole({height}: LogConsoleProps) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const records = useLogRecords()
    const [search, setSearch] = useState('')
    const deferredSearch = useDeferredValue(search)
    const [levelFilter, setLevelFilter] = useState<Record<LogLevel, boolean>>({
        debug: true,
        info: true,
        warn: true,
        error: true,
    })
    const [subsystemFilter, setSubsystemFilter] = useState<string[] | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
    const [paused, setPaused] = useState(false)
    const [copied, setCopied] = useState(false)
    const listRef = useRef<HTMLDivElement>(null)
    const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const subsystems = useMemo(
        () => [...new Set(records.map(record => record.subsystem))].sort((a, b) => a.localeCompare(b)),
        [records],
    )

    const filteredRecords = useMemo(() => {
        const searchText = deferredSearch.trim().toLowerCase()
        return records.filter(record => {
            if (!levelFilter[record.level]) return false
            if (subsystemFilter !== null && !subsystemFilter.includes(record.subsystem)) return false
            if (searchText.length > 0 && !recordSearchText(record).includes(searchText)) return false
            return true
        })
    }, [records, deferredSearch, levelFilter, subsystemFilter])

    useEffect(() => {
        if (paused) return
        const el = listRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [filteredRecords, paused])

    useEffect(() => {
        return () => {
            if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
        }
    }, [])

    const allLevelsEnabled = ALL_LEVELS.every(level => levelFilter[level])

    const toggleLevel = (level: LogLevel) => {
        setLevelFilter(current => ({...current, [level]: !current[level]}))
    }

    const toggleSubsystem = (subsystem: string) => {
        setSubsystemFilter(current => {
            const base = current ? [...current] : [...subsystems]
            const index = base.indexOf(subsystem)
            if (index >= 0) {
                base.splice(index, 1)
            } else {
                base.push(subsystem)
            }
            return base.length === subsystems.length ? null : base
        })
    }

    const copyVisibleLogs = async () => {
        const text = filteredRecords.map(recordToText).join('\n')
        await navigator.clipboard.writeText(text)
        setCopied(true)
        if (copyResetTimer.current) clearTimeout(copyResetTimer.current)
        copyResetTimer.current = setTimeout(() => setCopied(false), 1200)
    }

    if (!state.showLogConsole) return null

    return (
        <section className={styles.console} aria-label="Logging console" style={height ? {height} : undefined}>
            <div className={styles.header}>
                <div className={styles.titleBlock}>
                    <span className={styles.title}>Logs</span>
                    <span className={styles.count}>{filteredRecords.length}/{records.length}</span>
                </div>
                <div className={styles.actions}>
                    <button type="button" className={styles.iconButton} onClick={() => setPaused(v => !v)} title={paused ? 'Resume follow' : 'Pause follow'}>
                        {paused ? <Play size={14}/> : <Pause size={14}/>}
                    </button>
                    <button type="button" className={styles.iconButton} onClick={copyVisibleLogs} title="Copy visible logs">
                        {copied ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                    <button type="button" className={styles.iconButton} onClick={() => clearLogRecords()} title="Clear logs">
                        <Trash2 size={14}/>
                    </button>
                    <button type="button" className={styles.iconButton} onClick={() => dispatch({type: 'TOGGLE_LOG_CONSOLE'})} title="Close log console">
                        <X size={14}/>
                    </button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <label className={styles.search}>
                    <Search size={13}/>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search logs"
                    />
                </label>

                <div className={styles.filterGroup}>
                    {ALL_LEVELS.map(level => (
                        <button
                            type="button"
                            key={level}
                            className={`${styles.filterChip} ${levelFilter[level] ? styles.active : ''}`}
                            onClick={() => toggleLevel(level)}
                        >
                            {level.toUpperCase()}
                        </button>
                    ))}
                    <button
                        type="button"
                        className={`${styles.filterChip} ${allLevelsEnabled ? styles.active : ''}`}
                        onClick={() => setLevelFilter({debug: true, info: true, warn: true, error: true})}
                    >
                        All
                    </button>
                </div>
            </div>

            <div className={styles.subsystems}>
                <button
                    type="button"
                    className={`${styles.filterChip} ${subsystemFilter === null ? styles.active : ''}`}
                    onClick={() => setSubsystemFilter(null)}
                >
                    All subsystems
                </button>
                {subsystems.map(subsystem => {
                    const active = subsystemFilter === null || subsystemFilter.includes(subsystem)
                    return (
                        <button
                            type="button"
                            key={subsystem}
                            className={`${styles.filterChip} ${active ? styles.active : ''}`}
                            onClick={() => toggleSubsystem(subsystem)}
                        >
                            {subsystem}
                        </button>
                    )
                })}
            </div>

            <div className={styles.list} ref={listRef}>
                {filteredRecords.length === 0 ? (
                    <div className={styles.empty}>No matching log entries.</div>
                ) : (
                    filteredRecords.map(record => {
                        const expanded = expandedIds.has(record.id)
                        return (
                            <article key={record.id} className={`${styles.row} ${styles[record.level]}`}>
                                <button
                                    type="button"
                                    className={styles.rowHeader}
                                    onClick={() => setExpandedIds(current => {
                                        const next = new Set(current)
                                        if (next.has(record.id)) next.delete(record.id)
                                        else next.add(record.id)
                                        return next
                                    })}
                                >
                                    <span className={styles.time}>{formatTime(record.timestamp)}</span>
                                    <span className={`${styles.levelBadge} ${styles[record.level]}`}>{record.level}</span>
                                    <span className={styles.subsystem}>{record.subsystem}</span>
                                    <span className={styles.message}>{record.message}</span>
                                </button>
                                {record.payload !== undefined && (
                                    <details open={expanded} className={styles.payload}>
                                        <summary>JSON</summary>
                                        <pre>{JSON.stringify(record.payload, null, 2)}</pre>
                                    </details>
                                )}
                            </article>
                        )
                    })
                )}
            </div>
        </section>
    )
}
