import type { FillStyle } from '@model/shapes'
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
  fill: FillStyle
  onChange: (f: FillStyle) => void
  colorVar?: VarProps
  opacityVar?: VarProps
}

export function FillSection({ fill, onChange, colorVar, opacityVar }: Props) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Fill</div>
      <ColorInput
        label="Color"
        value={{ color: fill.color, paletteColorId: fill.paletteColorId }}
        onChange={ref => onChange({ ...fill, color: ref.color, paletteColorId: ref.paletteColorId })}
        {...colorVar}
      />
      <NumberInput
        label="Opacity"
        value={Math.round(fill.opacity * 100)}
        min={0} max={100}
        onChange={v => onChange({ ...fill, opacity: v / 100 })}
        unit="%"
        {...opacityVar}
      />
    </div>
  )
}
