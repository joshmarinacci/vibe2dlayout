import type {ColorFill, FillStyle, GradientFill, SketchFill} from '@model/shapes'
import {fillColor} from '@model/shapes'
import type {GradientDef, SketchStyleDef} from '@model/document'
import {useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {useAppDispatch, useAppState} from '@store/context'
import '../propsheet.css'
import {GradientPicker, TabbedPanel, TabbedPanelContent, TabbedPanelTab, TabbedPanelTabs} from '../TabbedPanel'

interface Props {
    fill: FillStyle
    onChange: (f: FillStyle) => void
    title?: string
}

type FillType = 'color' | 'gradient' | 'sketch'

function initialTab(fill: FillStyle): FillType {
    return fill.type
}

export function FillSection({fill, onChange, title}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const docGradients: GradientDef[] = state.document.gradients ?? []
    const docStyles: SketchStyleDef[] = state.document.sketchStyles ?? []

    const [selectedTab, setSelectedTab] = useState<FillType>(() => initialTab(fill))

    const switchToColor = () => {
        const cf: ColorFill = {type: 'color', color: fillColor(fill), opacity: fill.opacity}
        onChange(cf)
    }

    const switchToGradient = () => {
        const first = docGradients[0]
        const gf: GradientFill = {
            type: 'gradient',
            gradientType: 'linear',
            angle: 90,
            stops: first ? first.stops : [{color: fillColor(fill), position: 0}, {color: '#ffffff', position: 1}],
            opacity: fill.opacity,
            gradientId: first?.id,
        }
        onChange(gf)
    }

    const switchToSketch = () => {
        const first = docStyles[0]
        const sf: SketchFill = {
            type: 'sketch',
            color: fillColor(fill),
            fillStyle: first?.fillStyle ?? 'hatched',
            hachureAngle: first?.hachureAngle ?? 45,
            hachureGap: first?.hachureGap ?? 4,
            opacity: fill.opacity,
            sketchStyleId: first?.id,
        }
        onChange(sf)
    }

    const tabProps = {selectedTab, setSelectedTab}

    const colorFill = fill.type === 'color' ? fill : null
    const gradFill = fill.type === 'gradient' ? fill : null
    const sketchFill = fill.type === 'sketch' ? fill : null

    const handleGradientSelect = (gradientId: string) => {
        const g = docGradients.find(x => x.id === gradientId)
        if (!g || !gradFill) return
        onChange({
            ...gradFill,
            stops: g.stops,
            gradientId: g.id,
        })
    }

    const handleSketchStyleSelect = (styleId: string) => {
        const s = docStyles.find(x => x.id === styleId)
        if (!s) return
        onChange({
            type: 'sketch',
            color: fillColor(fill),
            fillStyle: s.fillStyle,
            hachureAngle: s.hachureAngle,
            hachureGap: s.hachureGap,
            opacity: fill.opacity,
            sketchStyleId: s.id,
        })
    }

    return (
        <CollapsibleSection title={title ? title : 'Fill'}>
            <TabbedPanel>
                <TabbedPanelTabs>
                    <TabbedPanelTab tab={'color'} title={'Color'}
                                    onChange={() => switchToColor()} {...tabProps} />
                    <TabbedPanelTab tab={'gradient'} title={'Gradient'} {...tabProps}
                                    onChange={() => switchToGradient()}/>
                    <TabbedPanelTab tab={'sketch'} title={'Sketch'} {...tabProps}
                                    onChange={() => switchToSketch()}/>
                </TabbedPanelTabs>
                <TabbedPanelContent tab={'color'} {...tabProps}>
                    <section className={'super'}>
                        <ColorInput
                            value={{
                                color: colorFill?.color ?? '#ffffff',
                                paletteColorId: colorFill?.paletteColorId,
                            }}
                            onChange={ref => onChange({
                                type: 'color',
                                color: ref.color,
                                opacity: fill.opacity,
                                paletteColorId: ref.paletteColorId,
                            })}
                        />
                        <div className={'full center-v'}
                             style={{display: 'grid', gridTemplateColumns: 'subgrid'}}>
                            <label className={'s'}>Opacity</label>
                            <input style={{gridColumn: 'mid1 / span 2', minWidth: '20px'}}
                                   type={'range'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({...fill, opacity: parseInt(e.target.value) / 100})}
                            />
                            <input className={'e'}
                                   type={'number'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({...fill, opacity: parseInt(e.target.value) / 100})}
                            />
                            <label className={'center-v'} style={{gridColumn: 'ge/span 1'}}>%</label>
                        </div>
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'gradient'} {...tabProps}>
                    <section className={'super'}>
                        <label className={'s'}>Stops</label>
                        <GradientPicker
                            className={'mid1span3'}
                            gradients={docGradients}
                            value={gradFill?.gradientId ?? ''}
                            onChange={handleGradientSelect}
                            showCustom={!gradFill?.gradientId}
                        />
                        <label className={'s'}>Type</label>
                        <select
                            className={'mid1span3'}
                            value={gradFill?.gradientType ?? 'linear'}
                            onChange={e => gradFill && onChange({...gradFill, gradientType: e.target.value as GradientFill['gradientType']})}
                        >
                            <option value='linear'>Linear</option>
                            <option value='radial'>Radial</option>
                            <option value='conic'>Conic</option>
                        </select>
                        {gradFill?.gradientType !== 'radial' && <>
                            <label className={'s'}>Angle</label>
                            <input
                                className={'mid1span2'}
                                type={'number'}
                                value={gradFill?.angle ?? 90}
                                min={0} max={360}
                                onChange={e => gradFill && onChange({...gradFill, angle: parseInt(e.target.value) || 0})}
                            />
                            <label className={'e'}>°</label>
                        </>}
                        <button
                            className={'mid1span3'}
                            onClick={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}
                        >Edit Gradients…
                        </button>
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'sketch'} {...tabProps}>
                    <section className={'super'}>
                        <label className={'s'}>Style</label>
                        <select
                            className={'mid1span3'}
                            value={sketchFill?.sketchStyleId ?? ''}
                            onChange={e => handleSketchStyleSelect(e.target.value)}
                        >
                            {docStyles.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <label className={'s'}>Color</label>
                        <ColorInput
                            value={{color: sketchFill?.color ?? '#000000'}}
                            onChange={ref => {
                                if (sketchFill) {
                                    onChange({...sketchFill, color: ref.color})
                                }
                            }}
                        />
                        <button
                            className={'mid1span3'}
                            onClick={() => dispatch({type: 'TOGGLE_SKETCH_STYLE_MODAL'})}
                        >Edit Sketch Styles…
                        </button>
                    </section>
                </TabbedPanelContent>
            </TabbedPanel>
        </CollapsibleSection>
    )
}
