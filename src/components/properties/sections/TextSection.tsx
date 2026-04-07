import type { TextStyle } from '@model/shapes'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import { SelectInput } from '../inputs/SelectInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  text: TextStyle
  onChange: (t: TextStyle) => void
}

export function TextSection({ text, onChange }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Text</div>
      <ColorInput label="Color" value={text.color} onChange={v => onChange({ ...text, color: v })} />
      <NumberInput label="Size" value={text.fontSize} min={6} max={200} onChange={v => onChange({ ...text, fontSize: v })} unit="px" />
      <SelectInput
        label="Align"
        value={text.align}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
        onChange={v => onChange({ ...text, align: v as TextStyle['align'] })}
      />
      <SelectInput
        label="V-Align"
        value={text.verticalAlign}
        options={[
          { value: 'top', label: 'Top' },
          { value: 'middle', label: 'Middle' },
          { value: 'bottom', label: 'Bottom' },
        ]}
        onChange={v => onChange({ ...text, verticalAlign: v as TextStyle['verticalAlign'] })}
      />
      <SelectInput
        label="Weight"
        value={text.fontWeight}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'bold', label: 'Bold' },
        ]}
        onChange={v => onChange({ ...text, fontWeight: v as TextStyle['fontWeight'] })}
      />
    </div>
  )
}
