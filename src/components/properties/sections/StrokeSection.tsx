import type {StrokeStyle, StrokeType} from '@model/shapes'
import type { Variable } from '@model/variable'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import { SelectInput } from '../inputs/SelectInput'
import { CollapsibleSection } from '../CollapsibleSection'

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
    <CollapsibleSection title="Stroke">
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
<SelectInput
  label="Style"
  value={stroke.type}
  options={[
      { value: 'solid',  label: 'Solid' },
      { value: 'sketch',  label: 'Sketch' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'none', label: 'None' },
  ]}
  onChange={v => onChange({ ...stroke, type:(v as StrokeType) })}
/>
    </CollapsibleSection>
  )
}
