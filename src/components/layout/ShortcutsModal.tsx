import {useAppDispatch, useAppState} from '@store/context'
import {KEYBOARD_SHORTCUTS, MOUSE_SHORTCUTS} from '@utils/shortcutDefs'
import {X} from 'lucide-react'
import {useEffect} from 'react'
import styles from './ShortcutsModal.module.css'

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
