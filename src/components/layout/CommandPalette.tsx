import {adaptPowerUpMenuAction, adaptPowerUpToolbarAction} from '@actions/adapters'
import {useActionRegistry} from '@actions/useActionRegistry'
import type {ActionDefinition} from '@actions/types'
import {getActivePowerUpMenuActions, getActivePowerUpToolbarActions} from '@powerups/registry'
import {useAppDispatch, useAppState} from '@store/context'
import {Search, X} from 'lucide-react'
import {useEffect, useMemo, useRef, useState} from 'react'
import styles from './CommandPalette.module.css'

function matchesQuery(action: ActionDefinition, query: string): boolean {
    const q = query.toLowerCase()
    if (action.title.toLowerCase().includes(q)) return true
    if (action.description?.toLowerCase().includes(q)) return true
    if (action.tags.some(t => t.toLowerCase().includes(q))) return true
    return false
}

function dedupeById(actions: ActionDefinition[]): ActionDefinition[] {
    const seen = new Set<string>()
    const result: ActionDefinition[] = []
    for (const a of actions) {
        if (!seen.has(a.id)) {
            seen.add(a.id)
            result.push(a)
        }
    }
    return result
}

export function CommandPalette() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const registeredActions = useActionRegistry()
    const [query, setQuery] = useState('')
    const [highlightIndex, setHighlightIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const ctx = useMemo(() => ({state, dispatch}), [state, dispatch])

    const allActions = useMemo(() => {
        const powerUpActions = [
            ...getActivePowerUpToolbarActions(state.document).map(adaptPowerUpToolbarAction),
            ...getActivePowerUpMenuActions(state.document).map(adaptPowerUpMenuAction),
        ]
        // Registry-registered actions win over adapters for same id
        return dedupeById([...registeredActions, ...powerUpActions])
    }, [registeredActions, state.document])

    const filtered = useMemo(() => {
        if (!query.trim()) return allActions
        return allActions.filter(a => matchesQuery(a, query))
    }, [allActions, query])

    // Reset highlight when filtered list changes
    useEffect(() => {
        setHighlightIndex(0)
    }, [filtered.length])

    // Focus input when opened
    useEffect(() => {
        if (state.showCommandPalette) {
            setQuery('')
            setHighlightIndex(0)
            setTimeout(() => inputRef.current?.focus(), 0)
        }
    }, [state.showCommandPalette])

    // Scroll highlighted item into view
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        const item = list.children[highlightIndex] as HTMLElement | undefined
        item?.scrollIntoView({block: 'nearest'})
    }, [highlightIndex])

    if (!state.showCommandPalette) return null

    const close = () => dispatch({type: 'CLOSE_COMMAND_PALETTE'})

    const runAction = (action: ActionDefinition) => {
        if (action.isEnabled && !action.isEnabled(ctx)) return
        close()
        action.run(ctx)
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            close()
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlightIndex(i => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlightIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const action = filtered[highlightIndex]
            if (action) runAction(action)
        }
    }

    return (
        <div className={styles.overlay} onClick={close}>
            <div className={styles.palette} onClick={e => e.stopPropagation()} onKeyDown={onKeyDown}>
                <div className={styles.searchRow}>
                    <Search size={16} className={styles.searchIcon}/>
                    <input
                        ref={inputRef}
                        className={styles.input}
                        placeholder="Search actions…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    <button className={styles.closeBtn} onClick={close} title="Close"><X size={14}/></button>
                </div>
                <ul ref={listRef} className={styles.list} role="listbox">
                    {filtered.length === 0 && (
                        <li className={styles.empty}>No actions match "{query}"</li>
                    )}
                    {filtered.map((action, i) => {
                        const enabled = action.isEnabled ? action.isEnabled(ctx) : true
                        return (
                            <li
                                key={action.id}
                                role="option"
                                aria-selected={i === highlightIndex}
                                className={[
                                    styles.item,
                                    i === highlightIndex ? styles.highlighted : '',
                                    !enabled ? styles.disabled : '',
                                    action.isDanger ? styles.danger : '',
                                ].join(' ')}
                                onMouseEnter={() => setHighlightIndex(i)}
                                onClick={() => runAction(action)}
                            >
                                {action.icon && <span className={styles.icon}>{action.icon}</span>}
                                <span className={styles.itemMain}>
                                    <span className={styles.title}>{action.title}</span>
                                    {action.description && (
                                        <span className={styles.description}>{action.description}</span>
                                    )}
                                </span>
                                <span className={styles.meta}>
                                    {action.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className={styles.tag}>{tag}</span>
                                    ))}
                                    {action.shortcut && (
                                        <kbd className={styles.shortcut}>{action.shortcut}</kbd>
                                    )}
                                </span>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}
