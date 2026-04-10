import type { StrokeStyle } from '@model/shapes'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'

interface Props {
  stroke: StrokeStyle
  onChange: (s: StrokeStyle) => void
}

export function StrokeSection({ stroke, onChange }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Stroke</div>
      <ColorInput
        label="Color"
        value={{ color: stroke.color, paletteColorId: stroke.paletteColorId }}
        onChange={ref => onChange({ ...stroke, color: ref.color, paletteColorId: ref.paletteColorId })}
      />
      <NumberInput label="Width" value={stroke.width} min={0} step={0.5} onChange={v => onChange({ ...stroke, width: v })} unit="px" />
      <NumberInput label="Opacity" value={Math.round(stroke.opacity * 100)} min={0} max={100} onChange={v => onChange({ ...stroke, opacity: v / 100 })} unit="%" />
    </div>
  )
}
