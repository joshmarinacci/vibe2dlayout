import {useAppDispatch, useAppState} from '@store/context'
import {DEFAULT_SETTINGS} from '@store/types'
import {RotateCcw, X} from 'lucide-react'
import {useEffect} from 'react'
import styles from './SettingsModal.module.css'

export function SettingsModal() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    useEffect(() => {
        if (!state.showSettingsModal) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dispatch({type: 'TOGGLE_SETTINGS_MODAL'})
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [state.showSettingsModal, dispatch])

    if (!state.showSettingsModal) return null

    const {pinchZoomSpeed, wheelZoomStep} = state.settings

    // pinchZoomSpeed stored as e.g. 0.005; display as 1–20 integer
    const pinchSlider = Math.round(pinchZoomSpeed * 1000)
    // wheelZoomStep stored as fraction e.g. 0.1; display as percentage 5–30
    const wheelPct = Math.round(wheelZoomStep * 100)

    return (
        <div
            className={styles.overlay}
            onClick={() => dispatch({type: 'TOGGLE_SETTINGS_MODAL'})}
        >
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <span className={styles.title}>Settings</span>
                    <button
                        className={styles.closeBtn}
                        onClick={() => dispatch({type: 'TOGGLE_SETTINGS_MODAL'})}
                    ><X size={16}/></button>
                </div>

                <div className={styles.body}>
                    <h3 className={styles.sectionTitle}>Zoom</h3>

                    <div className={styles.row}>
                        <label className={styles.label}>
                            Pinch zoom speed
                            <span className={styles.hint}>Controls how fast a trackpad pinch gesture zooms</span>
                        </label>
                        <div className={styles.control}>
                            <span className={styles.rangeLabel}>Slow</span>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                step={1}
                                value={pinchSlider}
                                onChange={e =>
                                    dispatch({
                                        type: 'UPDATE_SETTINGS',
                                        patch: {pinchZoomSpeed: Number(e.target.value) / 1000}
                                    })
                                }
                                className={styles.slider}
                            />
                            <span className={styles.rangeLabel}>Fast</span>
                            <span className={styles.value}>{pinchSlider}</span>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <label className={styles.label}>
                            Scroll wheel zoom step
                            <span className={styles.hint}>How much each scroll wheel click zooms in or out</span>
                        </label>
                        <div className={styles.control}>
                            <span className={styles.rangeLabel}>5%</span>
                            <input
                                type="range"
                                min={5}
                                max={30}
                                step={5}
                                value={wheelPct}
                                onChange={e =>
                                    dispatch({
                                        type: 'UPDATE_SETTINGS',
                                        patch: {wheelZoomStep: Number(e.target.value) / 100}
                                    })
                                }
                                className={styles.slider}
                            />
                            <span className={styles.rangeLabel}>30%</span>
                            <span className={styles.value}>{wheelPct}%</span>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        className={styles.resetBtn}
                        onClick={() => dispatch({
                            type: 'UPDATE_SETTINGS',
                            patch: {...DEFAULT_SETTINGS}
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
