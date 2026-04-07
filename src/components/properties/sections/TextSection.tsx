import type { TextStyle } from '@model/shapes'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput } from '../inputs/SelectInput'
import styles from '../PropertiesPanel.module.css'

const FONT_SIZES: { value: number; label: string }[] = [
  { value: 10, label: 'XS' },
  { value: 14, label: 'Small' },
  { value: 20, label: 'Medium' },
  { value: 32, label: 'Large' },
  { value: 56, label: 'XL' },
]

interface Props {
  text: TextStyle
  onChange: (t: TextStyle) => void
}

export function TextSection({ text, onChange }: Props) {
  const isPreset = FONT_SIZES.some(s => s.value === text.fontSize)
  const sizeOptions = [
    ...FONT_SIZES.map(s => ({ value: String(s.value), label: s.label })),
    ...(!isPreset ? [{ value: String(text.fontSize), label: `${text.fontSize}px` }] : []),
  ]

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Text</div>
      <ColorInput label="Color" value={text.color} onChange={v => onChange({ ...text, color: v })} />
      <SelectInput
        label="Size"
        value={String(text.fontSize)}
        options={sizeOptions}
        onChange={v => onChange({ ...text, fontSize: Number(v) })}
      />
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
