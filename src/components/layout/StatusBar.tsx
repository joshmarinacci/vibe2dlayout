import {computeBoundingBox} from '@components/canvas/SelectionOverlay'
import {useAppDispatch, useAppState} from '@store/context'
import {PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen} from 'lucide-react'
import styles from './StatusBar.module.css'

export function StatusBar() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const {ids} = state.selection

    let label = ''
    if (ids.length === 1) {
        const shape = state.document.shapes[ids[0]]
        label = shape?.name ?? shape?.type ?? ''
    } else if (ids.length > 1) {
        label = `${ids.length} shapes selected`
    }

    const bbox = ids.length > 0 ? computeBoundingBox(state) : null
    const sizeLabel = bbox
        ? `  ${Math.round(bbox.width)} × ${Math.round(bbox.height)}  at  (${Math.round(bbox.x)}, ${Math.round(bbox.y)})`
        : ''

    return (
        <div className={styles.statusBar}>
            <button
                className={styles.toggleBtn}
                onClick={() => dispatch({type: 'TOGGLE_LEFT_PANEL'})}
                title={state.leftPanelVisible ? 'Hide layer panel' : 'Show layer panel'}
            >
                {state.leftPanelVisible ? <PanelLeftClose size={16}/> : <PanelLeftOpen size={16}/>}
            </button>

            <span className={styles.label}>{label}{sizeLabel}</span>

            <button
                className={styles.toggleBtn}
                onClick={() => dispatch({type: 'TOGGLE_RIGHT_PANEL'})}
                title={state.rightPanelVisible ? 'Hide properties panel' : 'Show properties panel'}
            >
                {state.rightPanelVisible ? <PanelRightClose size={16}/> : <PanelRightOpen size={16}/>}
            </button>
        </div>
    )
}
