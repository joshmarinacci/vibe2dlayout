import type { StrokeStyle } from '@model/shapes'
import type { Variable } from '@model/variable'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'

interface VarProps {
  variableId?: string | null
  variables?: Variable[]
  onVariableChange?: (id: string | null) => void
}

interface Props {
  stroke: StrokeStyle
  onChange: (s: StrokeStyle) => void
  colorVar?: VarProps
  widthVar?: VarProps
  opacityVar?: VarProps
}

export function StrokeSection({ stroke, onChange, colorVar, widthVar, opacityVar }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Stroke</div>
      <ColorInput
        label="Color"
        value={{ color: stroke.color, paletteColorId: stroke.paletteColorId }}
        onChange={ref => onChange({ ...stroke, color: ref.color, paletteColorId: ref.paletteColorId })}
        {...colorVar}
      />
      <NumberInput
        label="Width"
        value={stroke.width}
        min={0} step={0.5}
        onChange={v => onChange({ ...stroke, width: v })}
        unit="px"
        {...widthVar}
      />
      <NumberInput
        label="Opacity"
        value={Math.round(stroke.opacity * 100)}
        min={0} max={100}
        onChange={v => onChange({ ...stroke, opacity: v / 100 })}
        unit="%"
        {...opacityVar}
      />
    </div>
  )
}
