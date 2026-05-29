import type {PageShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {NumberInput} from '../inputs/NumberInput'
import {ToggleInput} from '../inputs/ToggleInput'

interface Props {
    shape: PageShape
    dispatch: Dispatch<AppAction>
}

export function PageSection({shape, dispatch}: Props) {
    const patch = (p: Partial<PageShape>) =>
        dispatch({type: 'PATCH_SHAPE', id: shape.id, patch: p})

    const isFixed = shape.fixedSize !== null

    return (
        <CollapsibleSection title="Page">
            <ColorInput
                label="Background"
                value={{color: shape.background, paletteColorId: shape.backgroundPaletteColorId}}
                onChange={ref => patch({
                    background: ref.color,
                    backgroundPaletteColorId: ref.paletteColorId
                })}
            />
            <ToggleInput
                label="Fixed Size"
                value={isFixed}
                onChange={v => patch({fixedSize: v ? {width: 800, height: 600} : null})}
                className={'left'}
            />
            {isFixed && shape.fixedSize && (
                <>
                    <NumberInput
                        label="Width"
                        value={shape.fixedSize.width}
                        min={1}
                        onChange={v => patch({fixedSize: {...shape.fixedSize!, width: v}})}
                        unit="px"
                        className={'left'}
                    />
                    <NumberInput
                        label="Height"
                        value={shape.fixedSize.height}
                        min={1}
                        onChange={v => patch({fixedSize: {...shape.fixedSize!, height: v}})}
                        unit="px"
                        className={'right'}
                    />
                </>
            )}
            <ToggleInput
                className={'left'}
                label="Clip"
                value={shape.clipChildren}
                onChange={v => patch({clipChildren: v})}
            />
        </CollapsibleSection>
    )
}
