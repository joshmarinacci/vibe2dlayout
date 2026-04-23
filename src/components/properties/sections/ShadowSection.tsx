import type { Dispatch } from 'react'
import type { BoxShadow, Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { ColorInput } from '../inputs/ColorInput'
import { NumberInput } from '../inputs/NumberInput'
import inputStyles from '../inputs/inputs.module.css'
import { CollapsibleSection } from '../CollapsibleSection'

interface Props {
  shape: Shape
  dispatch: Dispatch<AppAction>
}

const DEFAULT_SHADOW: BoxShadow = {
  offsetX: 4,
  offsetY: 4,
  blur: 8,
  spread: 0,
  color: 'rgba(0,0,0,0.25)',
  inset: false,
}

export function ShadowSection({ shape, dispatch }: Props) {
  const shadow = (shape as unknown as { boxShadow?: BoxShadow | null }).boxShadow ?? null
  const patch = (s: BoxShadow | null) =>
    dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: { boxShadow: s } as Partial<Shape> })

  return (
    <CollapsibleSection title="Shadow">
<div className={inputStyles.field}>
  <span className={inputStyles.label}>Enabled</span>
  <input
    type="checkbox"
    className={inputStyles.checkbox}
    checked={!!shadow}
    onChange={e => patch(e.target.checked ? { ...DEFAULT_SHADOW } : null)}
  />
</div>
{shadow && (
  <>
    <ColorInput
      label="Color"
      value={{ color: shadow.color }}
      onChange={ref => patch({ ...shadow, color: ref.color })}
    />
    <NumberInput label="X" value={shadow.offsetX} min={-100} max={100} step={1} unit="px"
      onChange={v => patch({ ...shadow, offsetX: v })} />
    <NumberInput label="Y" value={shadow.offsetY} min={-100} max={100} step={1} unit="px"
      onChange={v => patch({ ...shadow, offsetY: v })} />
    <NumberInput label="Blur" value={shadow.blur} min={0} max={100} step={1} unit="px"
      onChange={v => patch({ ...shadow, blur: v })} />
    <NumberInput label="Spread" value={shadow.spread} min={-100} max={100} step={1} unit="px"
      onChange={v => patch({ ...shadow, spread: v })} />
    <div className={inputStyles.field}>
      <span className={inputStyles.label}>Inset</span>
      <input
        type="checkbox"
        className={inputStyles.checkbox}
        checked={!!shadow.inset}
        onChange={e => patch({ ...shadow, inset: e.target.checked })}
      />
    </div>
  </>
)}
    </CollapsibleSection>
  )
}
