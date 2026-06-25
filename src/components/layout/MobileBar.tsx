import {useAppDispatch, useAppState} from '@store/context'
import {Layers, PanelRight, Trash2, Copy} from 'lucide-react'
import styles from './MobileBar.module.css'

export function MobileBar() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    const selectedIds = state.selection.ids
    if (selectedIds.length === 0) return null

    return (
        <div className={styles.bar}>
            <button
                className={styles.btn}
                onClick={() => dispatch({type: 'TOGGLE_LEFT_PANEL'})}
                title="Layers"
            >
                <Layers size={20}/>
                <span className={styles.label}>Layers</span>
            </button>
            <button
                className={styles.btn}
                onClick={() => dispatch({type: 'TOGGLE_RIGHT_PANEL'})}
                title="Properties"
            >
                <PanelRight size={20}/>
                <span className={styles.label}>Properties</span>
            </button>
            <div className={styles.divider}/>
            <button
                className={styles.btn}
                onClick={() => dispatch({type: 'DUPLICATE_SHAPES', ids: selectedIds})}
                title="Duplicate"
            >
                <Copy size={20}/>
                <span className={styles.label}>Duplicate</span>
            </button>
            <button
                className={`${styles.btn} ${styles.danger}`}
                onClick={() => {
                    dispatch({type: 'DELETE_SHAPES', ids: selectedIds})
                    dispatch({type: 'DESELECT_ALL'})
                }}
                title="Delete"
            >
                <Trash2 size={20}/>
                <span className={styles.label}>Delete</span>
            </button>
        </div>
    )
}
