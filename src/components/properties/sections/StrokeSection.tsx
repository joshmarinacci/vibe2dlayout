import type {ColorStroke, GradientFill, GradientStroke, SketchStroke, StrokeStyle} from '@model/shapes'
import {strokeColor} from '@model/shapes'
import type {GradientDef} from '@model/document'
import {useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {NumberInput} from '../inputs/NumberInput'
import {useAppDispatch, useAppState} from '@store/context'
import '../propsheet.css'
import {clampGradientAngle, GRADIENT_ANGLE_MAX, GRADIENT_ANGLE_MIN, mergedGradients} from '../gradientUtils'
import {GradientPicker, TabbedPanel, TabbedPanelContent, TabbedPanelTab, TabbedPanelTabs} from '../TabbedPanel'

interface Props {
    stroke: StrokeStyle
    onChange: (s: StrokeStyle) => void
}

type StrokeTab = 'color' | 'gradient' | 'sketch'

function initialTab(stroke: StrokeStyle): StrokeTab {
    if (stroke.type === 'gradient') return 'gradient'
    if (stroke.type === 'sketch') return 'sketch'
    return 'color'
}

type DashOption = 'none' | 'solid' | 'dashed' | 'dotted'

function dashOptionFromStroke(stroke: ColorStroke): DashOption {
    if (stroke.type === 'none') return 'none'
    if (stroke.type === 'dashed') {
        if (!stroke.dash || stroke.dash.length === 0) return 'solid'
        return stroke.dash[0] <= 3 ? 'dotted' : 'dashed'
    }
    return 'solid'
}

function applyDashOption(stroke: ColorStroke, opt: DashOption): ColorStroke {
    if (opt === 'none') return {...stroke, type: 'none', dash: []}
    if (opt === 'solid') return {...stroke, type: 'solid', dash: []}
    if (opt === 'dotted') return {...stroke, type: 'dashed', dash: [2, 2]}
    return {...stroke, type: 'dashed', dash: [8, 4]}
}

export function StrokeSection({stroke, onChange}: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const docGradients: GradientDef[] = state.document.gradients ?? []
    const libraryGradients: GradientDef[] = state.library.gradients ?? []
    const gradients = mergedGradients(docGradients, libraryGradients)

    const [selectedTab, setSelectedTab] = useState<StrokeTab>(() => initialTab(stroke))

    const switchToColor = () => {
        const cs: ColorStroke = {
            type: 'solid',
            color: strokeColor(stroke),
            width: stroke.width,
            dash: [],
            opacity: stroke.opacity,
        }
        onChange(cs)
    }

    const switchToGradient = () => {
        const first = gradients[0]
        const gs: GradientStroke = {
            type: 'gradient',
            gradientType: 'linear',
            angle: 90,
            stops: first ? first.stops : [{color: strokeColor(stroke), position: 0}, {color: '#ffffff', position: 1}],
            width: stroke.width,
            opacity: stroke.opacity,
            gradientId: first?.id,
            spreadMethod: 'pad',
            span: 1,
        }
        onChange(gs)
    }

    const switchToSketch = () => {
        const ss: SketchStroke = {
            type: 'sketch',
            color: strokeColor(stroke),
            width: stroke.width,
            opacity: stroke.opacity,
        }
        onChange(ss)
    }

    const tabProps = {selectedTab, setSelectedTab}

    const colorStroke = (stroke.type === 'solid' || stroke.type === 'dashed' || stroke.type === 'none') ? stroke as ColorStroke : null
    const gradStroke = stroke.type === 'gradient' ? stroke as GradientStroke : null
    const sketchStroke = stroke.type === 'sketch' ? stroke as SketchStroke : null
    const gradientTypeValue = gradStroke?.gradientType === 'radial' ? 'radial' : 'linear'
    const gradientSpanValue = Math.round((gradStroke?.span ?? 1) * 100)

    const handleGradientSelect = (gradientId: string) => {
        const g = gradients.find(x => x.id === gradientId)
        if (!g || !gradStroke) return
        onChange({...gradStroke, stops: g.stops, gradientId: g.id})
    }

    return (
        <CollapsibleSection title="Stroke">
            <TabbedPanel>
                <TabbedPanelTabs>
                    <TabbedPanelTab tab={'color'} title={'Color'} onChange={() => switchToColor()} {...tabProps}/>
                    <TabbedPanelTab tab={'gradient'} title={'Gradient'}
                                    onChange={() => switchToGradient()} {...tabProps}/>
                    <TabbedPanelTab tab={'sketch'} title={'Sketch'} onChange={() => switchToSketch()} {...tabProps}/>
                </TabbedPanelTabs>

                <TabbedPanelContent tab={'color'} {...tabProps}>
                    <section>
                        <ColorInput
                            value={{
                                color: colorStroke?.color ?? '#000000',
                                paletteColorId: colorStroke?.paletteColorId,
                            }}
                            onChange={ref => {
                                const base = colorStroke ?? {
                                    type: 'solid' as const,
                                    color: '#000000',
                                    width: stroke.width,
                                    dash: [],
                                    opacity: stroke.opacity
                                }
                                onChange({...base, color: ref.color, paletteColorId: ref.paletteColorId})
                            }}
                        />
                        <label className={'left align-right'}>Opacity</label>
                        <NumberInput className={'right'}
                                     value={Math.round(stroke.opacity * 100)}
                                     min={0} max={100}
                                     onChange={v => onChange({...stroke, opacity: v / 100})}
                        />
                        <label className={'gutter'}>%</label>
                        <label className={'left align-right'}>Style</label>
                        <select
                            className={'right'}
                            value={colorStroke ? dashOptionFromStroke(colorStroke) : 'solid'}
                            onChange={e => {
                                const base = colorStroke ?? {
                                    type: 'solid' as const,
                                    color: '#000000',
                                    width: stroke.width,
                                    dash: [],
                                    opacity: stroke.opacity
                                }
                                onChange(applyDashOption(base, e.target.value as DashOption))
                            }}
                        >
                            <option value='none'>None</option>
                            <option value='solid'>Solid</option>
                            <option value='dashed'>Dashed</option>
                            <option value='dotted'>Dotted</option>
                        </select>
                    </section>
                </TabbedPanelContent>

                <TabbedPanelContent tab={'gradient'} {...tabProps}>
                    <section>
                        <label className={'left align-right'}>Stops</label>
                        <GradientPicker
                            className={'right'}
                            gradients={gradients}
                            value={gradStroke?.gradientId ?? ''}
                            onChange={handleGradientSelect}
                            showCustom={!gradStroke?.gradientId}
                        />
                        <label className={'left align-right'}>Type</label>
                        <select
                            className={'right'}
                            value={gradientTypeValue}
                            onChange={e => gradStroke && onChange({
                                ...gradStroke,
                                gradientType: e.target.value as GradientFill['gradientType']
                            })}
                        >
                            <option value='linear'>Linear</option>
                            <option value='radial'>Radial</option>
                        </select>
                        {gradStroke?.gradientType !== 'radial' && <>
                            <label className={'left align-right'}>Angle</label>
                            <NumberInput
                                className={'right'}
                                value={gradStroke?.angle ?? 90}
                                min={GRADIENT_ANGLE_MIN} max={GRADIENT_ANGLE_MAX}
                                onChange={v => gradStroke && onChange({
                                    ...gradStroke,
                                    angle: clampGradientAngle(v)
                                })}
                                unit={'°'}
                            />
                        </>}
                        <label className={'left align-right'}>Span</label>
                        <NumberInput
                            className={'right'}
                            value={gradientSpanValue}
                            min={1}
                            max={100}
                            step={1}
                            unit={'%'}
                            onChange={v => gradStroke && onChange({
                                ...gradStroke,
                                span: Math.max(0.01, v / 100),
                            })}
                        />
                        <label className={'left align-right'}>Spread</label>
                        <select
                            className={'right'}
                            value={gradStroke?.spreadMethod ?? 'pad'}
                            onChange={e => gradStroke && onChange({
                                ...gradStroke,
                                spreadMethod: e.target.value as NonNullable<GradientStroke['spreadMethod']>
                            })}
                        >
                            <option value='pad'>Pad</option>
                            <option value='repeat'>Repeat</option>
                            <option value='reflect'>Mirror</option>
                        </select>
                        <NumberInput className={'right'}
                                     label={'Opacity'}
                                     value={Math.round(stroke.opacity * 100)}
                                     min={0} max={100}
                                     onChange={v => onChange({...stroke, opacity: v / 100})}
                                     unit={'%'}
                        />
                        <button
                            className={'center'}
                            onClick={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}
                        >Edit Gradients
                        </button>
                    </section>
                </TabbedPanelContent>

                <TabbedPanelContent tab={'sketch'} {...tabProps}>
                    <section>
                        <label className={'left align-right'}>Color</label>
                        <ColorInput
                            value={{color: sketchStroke?.color ?? '#000000'}}
                            onChange={ref => {
                                if (sketchStroke) onChange({...sketchStroke, color: ref.color})
                            }}
                        />
                        <NumberInput
                            className={'right'}
                            label={'Opacity'}
                            value={Math.round(stroke.opacity * 100)}
                            min={0} max={100}
                            onChange={v => onChange({...stroke, opacity: v / 100})}
                            unit={'%'}
                        />
                    </section>
                </TabbedPanelContent>
            </TabbedPanel>

            <NumberInput
                label="Width"
                value={stroke.width}
                min={0} step={0.5}
                onChange={v => onChange({...stroke, width: v})}
                unit="px"
                className={'left'}
            />
        </CollapsibleSection>
    )
}
