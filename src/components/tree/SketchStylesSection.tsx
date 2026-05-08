import type {SketchStyleDef} from '@model/document'
import type {AppAction} from '@store/types'
import {sketchFillCSS} from '@utils/fillCSS'
import {type Dispatch, useState} from 'react'
import styles from './StylesSection.module.css'
import rowStyles from './StyleRow.module.css'

interface Props {
    sketchStyles: SketchStyleDef[]
    dispatch: Dispatch<AppAction>
}

function swatchCSS(s: SketchStyleDef): string {
    return sketchFillCSS({
        type: 'sketch',
        color: '#333333',
        fillStyle: s.fillStyle,
        hachureAngle: s.hachureAngle,
        hachureGap: s.hachureGap,
        opacity: 1,
    })
}

export function SketchStylesSection({sketchStyles, dispatch}: Props) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Sketch Styles</span>
                </div>
                <button
                    className={styles.addBtn}
                    onClick={() => dispatch({type: 'TOGGLE_SKETCH_STYLE_MODAL'})}
                    title="Edit sketch styles"
                >…</button>
            </div>
            {!collapsed && sketchStyles.map(s => (
                <div
                    key={s.id}
                    className={rowStyles.row}
                    onClick={() => dispatch({type: 'TOGGLE_SKETCH_STYLE_MODAL'})}
                    title={s.name}
                >
                    <div
                        style={{
                            width: 28,
                            height: 14,
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: swatchCSS(s),
                            flexShrink: 0,
                        }}
                    />
                    <span className={rowStyles.name}>{s.name}</span>
                </div>
            ))}
            {!collapsed && sketchStyles.length === 0 && (
                <div style={{padding: '4px 12px', fontSize: 11, color: 'var(--color-text-disabled)'}}>
                    No sketch styles
                </div>
            )}
        </div>
    )
}
