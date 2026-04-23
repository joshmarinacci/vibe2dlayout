import type { PageShape } from '@model/shapes'
import type { AppAction } from '@store/types'
import type { Dispatch } from 'react'
import { ColorInput } from '../inputs/ColorInput'
import { ToggleInput } from '../inputs/ToggleInput'
import { NumberInput } from '../inputs/NumberInput'
import { CollapsibleSection } from '../CollapsibleSection'

interface Props {
  shape: PageShape
  dispatch: Dispatch<AppAction>
}

export function PageSection({ shape, dispatch }: Props) {
  const patch = (p: Partial<PageShape>) =>
    dispatch({ type: 'PATCH_SHAPE', id: shape.id, patch: p })

  const isFixed = shape.fixedSize !== null

  return (
    <CollapsibleSection title="Page">
<ColorInput
  label="Background"
  value={{ color: shape.background, paletteColorId: shape.backgroundPaletteColorId }}
  onChange={ref => patch({ background: ref.color, backgroundPaletteColorId: ref.paletteColorId })}
/>
<ToggleInput
  label="Fixed Size"
  value={isFixed}
  onChange={v => patch({ fixedSize: v ? { width: 800, height: 600 } : null })}
/>
{isFixed && shape.fixedSize && (
  <>
    <NumberInput
      label="Width"
      value={shape.fixedSize.width}
      min={1}
      onChange={v => patch({ fixedSize: { ...shape.fixedSize!, width: v } })}
      unit="px"
    />
    <NumberInput
      label="Height"
      value={shape.fixedSize.height}
      min={1}
      onChange={v => patch({ fixedSize: { ...shape.fixedSize!, height: v } })}
      unit="px"
    />
  </>
)}
<ToggleInput
  label="Clip"
  value={shape.clipChildren}
  onChange={v => patch({ clipChildren: v })}
/>
    </CollapsibleSection>
  )
}
