import {useAppDispatch, useAppState} from '@store/context'
import {X} from 'lucide-react'
import {useEffect} from 'react'
import styles from './ShortcutsModal.module.css'

const KEYBOARD_SHORTCUTS = [
    {keys: '⌘Z', description: 'Undo'},
    {keys: '⌘⇧Z', description: 'Redo'},
    {keys: '⌘S', description: 'Save'},
    {keys: 'Del / Backspace', description: 'Delete selected'},
    {keys: '⌘A', description: 'Select all'},
    {keys: '⌘D', description: 'Duplicate selected'},
    {keys: '⌘G', description: 'Group selected'},
    {keys: '⌘⇧G', description: 'Ungroup'},
    {keys: '⌘]', description: 'Bring forward'},
    {keys: '⌘[', description: 'Send backward'},
    {keys: '⌘Enter', description: 'Commit text edit'},
    {keys: 'Escape', description: 'Cancel / deselect'},
    {keys: '↑ ↓ ← →', description: 'Nudge 1px'},
    {keys: '⇧ + Arrow', description: 'Nudge 10px'},
    {keys: 'V', description: 'Select tool'},
    {keys: 'H', description: 'Pan tool'},
    {keys: '?', description: 'Show/hide this help'},
]

const MOUSE_SHORTCUTS = [
    {keys: 'Click', description: 'Select shape'},
    {keys: '⇧ Click', description: 'Add to / remove from selection'},
    {keys: 'Drag shape', description: 'Move shape'},
    {keys: '⌘ Drag shape', description: 'Duplicate and move'},
    {keys: 'Drag canvas', description: 'Marquee select'},
    {keys: 'Space + Drag', description: 'Pan canvas'},
    {keys: 'Double-click', description: 'Edit text'},
    {keys: 'Right-click', description: 'Context menu'},
    {keys: 'Ctrl + Scroll', description: 'Zoom in / out'},
    {keys: 'Scroll', description: 'Pan canvas'},
    {keys: 'Pinch', description: 'Zoom in / out'},
]

export function ShortcutsModal() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (!state.showShortcutsModal) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'})
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [state.showShortcutsModal, dispatch])

    if (!state.showShortcutsModal) return null

    return (
        <div
            className={styles.overlay}
            onClick={() => dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'})}
        >
            <div
                className={styles.modal}
                onClick={e => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <span className={styles.title}>Keyboard &amp; Mouse Shortcuts</span>
                    <button
                        className={styles.closeBtn}
                        onClick={() => dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'})}
                    ><X size={16}/></button>
                </div>
                <div className={styles.body}>
                    <div className={styles.column}>
                        <h3 className={styles.sectionTitle}>Keyboard</h3>
                        <table className={styles.table}>
                            <tbody>
                            {KEYBOARD_SHORTCUTS.map(({keys, description}) => (
                                <tr key={keys}>
                                    <td className={styles.keys}><kbd>{keys}</kbd></td>
                                    <td className={styles.desc}>{description}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.column}>
                        <h3 className={styles.sectionTitle}>Mouse / Pointer</h3>
                        <table className={styles.table}>
                            <tbody>
                            {MOUSE_SHORTCUTS.map(({keys, description}) => (
                                <tr key={keys}>
                                    <td className={styles.keys}><kbd>{keys}</kbd></td>
                                    <td className={styles.desc}>{description}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
