import type { FillStyle } from '@model/shapes'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  fill: FillStyle
  onChange: (f: FillStyle) => void
}

export function FillSection({ fill, onChange }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Fill</div>
      <ColorInput
        label="Color"
        value={{ color: fill.color, paletteColorId: fill.paletteColorId }}
        onChange={ref => onChange({ ...fill, color: ref.color, paletteColorId: ref.paletteColorId })}
      />
      <NumberInput label="Opacity" value={Math.round(fill.opacity * 100)} min={0} max={100} onChange={v => onChange({ ...fill, opacity: v / 100 })} unit="%" />
    </div>
  )
}
