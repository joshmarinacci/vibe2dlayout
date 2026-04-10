import type { TextStyle } from '@model/shapes'
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput } from '../inputs/SelectInput'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'

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
      <ColorInput
        label="Color"
        value={{ color: text.color, paletteColorId: text.paletteColorId }}
        onChange={ref => onChange({ ...text, color: ref.color, paletteColorId: ref.paletteColorId })}
      />
      <SelectInput
        label="Size"
        value={String(text.fontSize)}
        options={sizeOptions}
        onChange={v => onChange({ ...text, fontSize: Number(v) })}
      />
      <div className={inputStyles.field}>
        <span className={inputStyles.label}>Align</span>
        <div className={inputStyles.iconBtnGroup}>
          {([
            { value: 'left',   Icon: AlignLeft },
            { value: 'center', Icon: AlignCenter },
            { value: 'right',  Icon: AlignRight },
          ] as const).map(({ value, Icon }) => (
            <button
              key={value}
              className={`${inputStyles.iconBtn} ${text.align === value ? inputStyles.iconBtnActive : ''}`}
              title={value.charAt(0).toUpperCase() + value.slice(1)}
              onClick={() => onChange({ ...text, align: value })}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className={inputStyles.field}>
        <span className={inputStyles.label}>V-Align</span>
        <div className={inputStyles.iconBtnGroup}>
          {([
            { value: 'top',    Icon: AlignVerticalJustifyStart },
            { value: 'middle', Icon: AlignVerticalJustifyCenter },
            { value: 'bottom', Icon: AlignVerticalJustifyEnd },
          ] as const).map(({ value, Icon }) => (
            <button
              key={value}
              className={`${inputStyles.iconBtn} ${text.verticalAlign === value ? inputStyles.iconBtnActive : ''}`}
              title={value.charAt(0).toUpperCase() + value.slice(1)}
              onClick={() => onChange({ ...text, verticalAlign: value })}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>
      </div>
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
