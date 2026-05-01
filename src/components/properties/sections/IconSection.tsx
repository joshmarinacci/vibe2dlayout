import type {IconShape} from '@model/shapes'
import {lookupIcon} from '@utils/allLucideIcons'
import {useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {IconPickerDialog} from '../IconPickerDialog'
import styles from '../PropertiesPanel.module.css'

interface Props {
    icon: IconShape['icon']
    onChange: (icon: IconShape['icon']) => void
}

export function IconSection({icon, onChange}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false)

    const CurrentIcon = lookupIcon(icon.name)

    return (
        <CollapsibleSection title="Icon">

            <button className={styles.iconPickerBtn} onClick={() => setPickerOpen(true)}>
                {CurrentIcon
                    ? <><CurrentIcon size={15} strokeWidth={1.5}/><span>{icon.name}</span></>
                    : <span>Choose icon…</span>
                }
            </button>

            {pickerOpen && (
                <IconPickerDialog
                    currentIcon={icon.name}
                    onSelect={name => {
                        onChange({name});
                        setPickerOpen(false)
                    }}
                    onClose={() => setPickerOpen(false)}
                />
            )}
        </CollapsibleSection>
    )
}
