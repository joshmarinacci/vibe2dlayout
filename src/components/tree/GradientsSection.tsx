import type {GradientDef} from '@model/document'
import type {AppAction} from '@store/types'
import {gradientCSS} from '@utils/fillCSS'
import {type Dispatch, useState} from 'react'
import styles from './StylesSection.module.css'
import rowStyles from './StyleRow.module.css'

interface Props {
    gradients: GradientDef[]
    selectedGradientId: string | null
    dispatch: Dispatch<AppAction>
}

function swatchCSS(g: GradientDef): string {
    return gradientCSS({
        type: 'gradient',
        gradientType: 'linear',
        angle: 90,
        stops: g.stops,
        opacity: 1,
    })
}

export function GradientsSection({gradients, selectedGradientId, dispatch}: Props) {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Gradients</span>
                </div>
                <button
                    className={styles.addBtn}
                    onClick={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}
                    title="Edit gradients"
                >…</button>
            </div>
            {!collapsed && gradients.map(g => (
                <div
                    key={g.id}
                    className={`${rowStyles.row} ${g.id === selectedGradientId ? rowStyles.selected : ''}`}
                    onClick={() => dispatch({type: 'SELECT_GRADIENT', gradientId: g.id})}
                    title={g.name}
                >
                    <div
                        style={{
                            width: 28,
                            height: 14,
                            borderRadius: 3,
                            border: '1px solid rgba(0,0,0,0.15)',
                            background: swatchCSS(g),
                            flexShrink: 0,
                        }}
                    />
                    <span className={rowStyles.name}>{g.name}</span>
                </div>
            ))}
            {!collapsed && gradients.length === 0 && (
                <div style={{padding: '4px 12px', fontSize: 11, color: 'var(--color-text-disabled)'}}>
                    No gradients
                </div>
            )}
        </div>
    )
}
