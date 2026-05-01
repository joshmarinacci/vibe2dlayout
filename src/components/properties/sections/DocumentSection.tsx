import type {GridSettings, GridStyle} from '@model/grid'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {NumberInput} from '../inputs/NumberInput'
import {ToggleInput} from '../inputs/ToggleInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
    documentName: string
    documentId: string | null
    gridSettings: GridSettings
    activeThemeName: string
    dispatch: Dispatch<AppAction>
}

export function DocumentSection({
                                    documentName,
                                    documentId,
                                    gridSettings,
                                    activeThemeName,
                                    dispatch
                                }: Props) {
    return (
        <>
            <CollapsibleSection title="Document">
                <div className={styles.nameRow}>
                    <input
                        className={styles.nameInput}
                        value={documentName}
                        placeholder="Untitled"
                        onChange={e => dispatch({
                            type: 'SET_DOCUMENT_META',
                            id: documentId,
                            name: e.target.value
                        })}
                    />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Grid">
                <ToggleInput
                    label="Snap to Grid"
                    value={gridSettings.snapEnabled}
                    onChange={v => dispatch({
                        type: 'UPDATE_GRID_SETTINGS',
                        patch: {snapEnabled: v}
                    })}
                />
                <NumberInput
                    label="Grid Size"
                    value={gridSettings.size}
                    min={1}
                    onChange={v => dispatch({type: 'UPDATE_GRID_SETTINGS', patch: {size: v}})}
                    unit="px"
                />
                <div className={styles.row}>
                    <label className={styles.label}>Grid Style</label>
                    <select
                        value={gridSettings.style}
                        onChange={e => dispatch({
                            type: 'UPDATE_GRID_SETTINGS',
                            patch: {style: e.target.value as GridStyle}
                        })}
                        style={{fontSize: 12}}
                    >
                        <option value="lines">Lines</option>
                        <option value="dots">Dots</option>
                        <option value="none">None</option>
                    </select>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Theme">
                <div className={styles.row}>
                    <label className={styles.label}>Active Theme</label>
                    <span style={{fontSize: 12, color: '#555'}}>{activeThemeName}</span>
                </div>
                <div className={styles.row}>
                    <button
                        style={{fontSize: 12, padding: '3px 8px', cursor: 'pointer'}}
                        onClick={() => dispatch({type: 'TOGGLE_THEME_MODAL'})}
                    >
                        Change...
                    </button>
                </div>
            </CollapsibleSection>
        </>
    )
}
