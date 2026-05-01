import type {GridStyle} from '@model/grid'
import {DEFAULT_GRID_SETTINGS} from '@model/grid'
import {useAppDispatch, useAppState} from '@store/context'
import {RotateCcw, X} from 'lucide-react'
import {useEffect} from 'react'
import styles from './SettingsModal.module.css'

interface Props {
    onClose: () => void
}

export function DocumentSettingsModal({onClose}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const grid = state.document.gridSettings

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>Document Settings</span>
                    <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
                </div>

                <div className={styles.body}>
                    <h3 className={styles.sectionTitle}>Grid</h3>

                    <div className={styles.row}>
                        <label className={styles.label}>
                            Snap to Grid
                            <span className={styles.hint}>Shapes snap to the nearest grid point when moved or resized</span>
                        </label>
                        <div className={styles.control}>
                            <input
                                type="checkbox"
                                checked={grid.snapEnabled}
                                onChange={e => dispatch({
                                    type: 'UPDATE_GRID_SETTINGS',
                                    patch: {snapEnabled: e.target.checked}
                                })}
                            />
                            <span style={{fontSize: 13, color: '#444'}}>Enabled</span>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <label className={styles.label}>
                            Grid Size
                            <span className={styles.hint}>Size of each grid cell in pixels</span>
                        </label>
                        <div className={styles.control}>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                value={grid.size}
                                onChange={e => {
                                    const v = parseInt(e.target.value)
                                    if (v >= 1 && v <= 200) dispatch({
                                        type: 'UPDATE_GRID_SETTINGS',
                                        patch: {size: v}
                                    })
                                }}
                                style={{
                                    width: 72,
                                    fontSize: 13,
                                    padding: '3px 6px',
                                    border: '1px solid #ccc',
                                    borderRadius: 4,
                                    outline: 'none'
                                }}
                            />
                            <span style={{fontSize: 12, color: '#888'}}>px</span>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <label className={styles.label}>
                            Grid Style
                            <span
                                className={styles.hint}>How the grid is displayed on the canvas</span>
                        </label>
                        <div className={styles.control}>
                            {(['lines', 'dots', 'none'] as GridStyle[]).map(style => (
                                <label key={style} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 13,
                                    color: '#444',
                                    cursor: 'pointer'
                                }}>
                                    <input
                                        type="radio"
                                        name="gridStyle"
                                        value={style}
                                        checked={grid.style === style}
                                        onChange={() => dispatch({
                                            type: 'UPDATE_GRID_SETTINGS',
                                            patch: {style}
                                        })}
                                    />
                                    {style.charAt(0).toUpperCase() + style.slice(1)}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.resetBtn}
                        onClick={() => dispatch({
                            type: 'UPDATE_GRID_SETTINGS',
                            patch: {...DEFAULT_GRID_SETTINGS}
                        })}
                    >
                        <RotateCcw size={13}/>
                        Reset to defaults
                    </button>
                </div>
            </div>
        </div>
    )
}
