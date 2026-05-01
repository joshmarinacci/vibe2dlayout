import type {ButtonShape} from '@model/shapes'
import {lookupIcon} from '@utils/allLucideIcons'
import {DEFAULT_BUTTON_ICON} from '@utils/buttonIcons'
import {useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {IconPickerDialog} from '../IconPickerDialog'
import styles from '../PropertiesPanel.module.css'

interface Props {
    icon: ButtonShape['icon']
    onChange: (icon: ButtonShape['icon']) => void
}

export function ButtonIconSection({icon, onChange}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false)

    const CurrentIcon = icon ? lookupIcon(icon.name) : null

    return (
        <CollapsibleSection title="Icon">

            <div className={styles.iconSideRow}>
                <label className={styles.iconSideLabel}>
                    <input
                        type="radio"
                        name="iconSide"
                        value="left"
                        checked={icon?.side === 'left'}
                        onChange={() => onChange(icon ? {
                            ...icon,
                            side: 'left'
                        } : {name: DEFAULT_BUTTON_ICON, side: 'left'})}
                    />
                    Left
                </label>
                <label className={styles.iconSideLabel}>
                    <input
                        type="radio"
                        name="iconSide"
                        value="right"
                        checked={icon?.side === 'right'}
                        onChange={() => onChange(icon ? {
                            ...icon,
                            side: 'right'
                        } : {name: DEFAULT_BUTTON_ICON, side: 'right'})}
                    />
                    Right
                </label>
                <button
                    className={styles.iconClearBtn}
                    onClick={() => onChange(null)}
                    disabled={!icon}
                    title="Remove icon"
                >
                    None
                </button>
            </div>

            <button className={styles.iconPickerBtn} onClick={() => setPickerOpen(true)}>
                {CurrentIcon
                    ? <><CurrentIcon size={15} strokeWidth={1.5}/><span>{icon!.name}</span></>
                    : <span>Choose icon…</span>
                }
            </button>

            {pickerOpen && (
                <IconPickerDialog
                    currentIcon={icon?.name ?? null}
                    onSelect={name => onChange({name, side: icon?.side ?? 'left'})}
                    onClose={() => setPickerOpen(false)}
                />
            )}
        </CollapsibleSection>
    )
}
