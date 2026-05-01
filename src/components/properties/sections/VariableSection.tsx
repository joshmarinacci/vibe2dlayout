import type {Variable} from '@model/variable'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {NumberInput} from '../inputs/NumberInput'
import {ToggleInput} from '../inputs/ToggleInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
    variable: Variable
    dispatch: Dispatch<AppAction>
}

export function VariableSection({variable, dispatch}: Props) {
    const update = (patch: Partial<Variable>) =>
        dispatch({type: 'UPDATE_VARIABLE', variable: {...variable, ...patch}})

    const typeBadgeStyle: React.CSSProperties = {
        display: 'inline-block',
        padding: '1px 6px',
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#f0f0f0',
        color: '#666',
    }

    return (
        <>
            <CollapsibleSection title="Variable">
                <div className={styles.nameRow}>
                    <input
                        className={styles.nameInput}
                        value={variable.name}
                        onChange={e => update({name: e.target.value})}
                        placeholder="Variable name"
                    />
                </div>
                <div className={styles.row}>
                    <label className={styles.label}>Type</label>
                    <span style={typeBadgeStyle}>{variable.type}</span>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Value">
                {variable.type === 'number' && (
                    <NumberInput
                        label="Value"
                        value={variable.value as number}
                        onChange={v => update({value: v})}
                    />
                )}
                {variable.type === 'color' && (
                    <ColorInput
                        label="Color"
                        value={{color: variable.value as string}}
                        onChange={ref => update({value: ref.color})}
                    />
                )}
                {variable.type === 'boolean' && (
                    <ToggleInput
                        label="Value"
                        value={variable.value as boolean}
                        onChange={v => update({value: v})}
                    />
                )}
                {variable.type === 'string' && (
                    <div className={styles.row}>
                        <label className={styles.label}>Text</label>
                        <input
                            className={styles.nameInput}
                            value={variable.value as string}
                            onChange={e => update({value: e.target.value})}
                            placeholder="Variable value"
                        />
                    </div>
                )}
            </CollapsibleSection>
        </>
    )
}
