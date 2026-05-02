import type {FillStyle, LinearGradient} from '@model/shapes'
import type {Variable} from '@model/variable'
import React, {useState} from "react";
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {NumberInput} from '../inputs/NumberInput'
import "../propsheet.css"

interface VarProps {
    variableId?: string | null
    variables?: Variable[]
    onVariableChange?: (id: string | null) => void
}

interface Props {
    fill: FillStyle
    onChange: (f: FillStyle) => void
}

const DEFAULT_GRADIENT: LinearGradient = {
    type: 'linear',
    angle: 90,
    stops: [
        {color: '#4f46e5', position: 0},
        {color: '#e879f9', position: 1},
    ],
}

type FillType = 'color' | 'gradient' | 'sketch'

function TabbedPanelTab<T>(props: {
    title: string,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void,
    onChange?: () => void
}) {
    return <div
        className={'tabbed-panel-tab ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}
        onClick={() => {
            props.setSelectedTab(props.tab)
            if (props.onChange) {
                props.onChange()
            }
        }}
    >
        {props.title}
    </div>
}

function TabbedPanelContent<T>(props: {
    children: React.ReactNode,
    tab: T,
    selectedTab: T,
    setSelectedTab: (value: (((prevState: T) => T) | T)) => void
}) {
    return <div
        className={'tabbed-panel-content ' + ((props.tab === props.selectedTab) ? 'selected' : 'hidden')}>
        {props.children}
    </div>
}

function TabbedPanel(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-panel'}>
        {props.children}
    </div>
}

function TabbedPanelTabs(props: { children: React.ReactNode }) {
    return <div className={'tabbed-panel-tabs'}>{props.children}</div>
}

export function FillSection({fill, onChange}: Props) {
    const gradient = fill.gradient ?? DEFAULT_GRADIENT

    const switchToGradient = () => {
        const stops = [
            {color: fill.color, position: 0},
            {color: '#ffffff', position: 1},
        ]
        onChange({...fill, gradient: {type: 'linear', angle: 90, stops}})
    }

    const switchToSolid = () => onChange({...fill, gradient: null})

    const patchGradient = (g: LinearGradient) => onChange({...fill, gradient: g})

    const addStop = () => {
        // Insert a new stop between the last two stops, or at position 0.5 if only 2 stops
        const stops = [...gradient.stops].sort((a, b) => a.position - b.position)
        // Find the largest gap
        let bestIdx = 0
        let bestGap = 0
        for (let i = 0; i < stops.length - 1; i++) {
            const gap = stops[i + 1].position - stops[i].position
            if (gap > bestGap) {
                bestGap = gap;
                bestIdx = i
            }
        }
        const mid = (stops[bestIdx].position + stops[bestIdx + 1].position) / 2
        // Interpolate color simply (use start color of the gap)
        const newStop = {color: stops[bestIdx].color, position: Math.round(mid * 100) / 100}
        stops.splice(bestIdx + 1, 0, newStop)
        patchGradient({...gradient, stops})
    }

    const removeStop = (idx: number) => {
        if (gradient.stops.length <= 2) return
        const stops = gradient.stops.filter((_, i) => i !== idx)
        patchGradient({...gradient, stops})
    }

    const updateStop = (idx: number, patch: Partial<{ color: string; position: number }>) => {
        const stops = gradient.stops.map((s, i) => i === idx ? {...s, ...patch} : s)
        patchGradient({...gradient, stops})
    }

    const [selectedTab, setSelectedTab] = useState<FillType>("color")

    const tabProps = {
        selectedTab: selectedTab,
        setSelectedTab: setSelectedTab
    }
    return (
        <CollapsibleSection title="Fill">
            <TabbedPanel>
                <TabbedPanelTabs>
                    <TabbedPanelTab tab={'color'} title={'Color'}
                                    onChange={() => switchToSolid()} {...tabProps} />
                    <TabbedPanelTab tab={'gradient'} title={'Gradient'} {...tabProps}
                                    onChange={() => switchToGradient()}/>
                    <TabbedPanelTab tab={'sketch'} title={'Sketch'} {...tabProps} onChange={() => {
                        console.log("switch to sketch  mode");
                    }}/>
                </TabbedPanelTabs>
                <TabbedPanelContent tab={'color'} {...tabProps}>
                    <section>
                        <ColorInput
                            value={{color: fill.color, paletteColorId: fill.paletteColorId}}
                            onChange={ref => onChange({
                                ...fill,
                                color: ref.color,
                                paletteColorId: ref.paletteColorId
                            })}
                        />
                        <div style={{gridColumn:'1/span 4', display:'grid', gridTemplateColumns:'subgrid'}}>
                            <label>Opacity</label>
                            <input type={'range'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({...fill, opacity: parseInt(e.target.value) / 100})}
                                   style={{
                                       minWidth:'20px',
                                   }}
                               />
                            <input type={'number'}
                                   value={Math.round(fill.opacity * 100)}
                                   min={0} max={100}
                                   onChange={e => onChange({...fill, opacity: parseInt(e.target.value) / 100})}
                            />
                            <label style={{gridColumn:'4'}}>%</label>
                        </div>
                        <button style={{gridColumn:'1/span 1',justifySelf:'center'}}>RGB/HSV</button>
                        <button style={{gridColumn:'3/span 1',justifySelf:'center'}}>Palettes</button>
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'gradient'} {...tabProps}>
                    <NumberInput
                        label="Angle"
                        value={gradient.angle}
                        min={0} max={360} step={1} unit="°"
                        onChange={v => patchGradient({...gradient, angle: v})}
                    />

                    {/* Stop list */}
                    {gradient.stops.map((stop, idx) => (
                        <div key={idx} style={{display: 'flex', alignItems: 'center', gap: 2}}>
                            <div style={{flex: 1}}>
                                <ColorInput
                                    label={`Stop ${idx + 1}`}
                                    value={{color: stop.color}}
                                    onChange={ref => updateStop(idx, {color: ref.color})}
                                />
                            </div>
                            <div style={{width: 48, flexShrink: 0}}>
                                <NumberInput
                                    label=""
                                    value={Math.round(stop.position * 100)}
                                    min={0} max={100} step={1} unit="%"
                                    onChange={v => updateStop(idx, {position: v / 100})}
                                />
                            </div>
                            <button
                                onClick={() => removeStop(idx)}
                                disabled={gradient.stops.length <= 2}
                                title="Remove stop"
                                style={{
                                    width: 16, height: 16, flexShrink: 0, border: 'none',
                                    background: 'transparent', color: 'var(--color-text-disabled)',
                                    cursor: gradient.stops.length <= 2 ? 'default' : 'pointer',
                                    fontSize: 14, lineHeight: 1, padding: 0,
                                    opacity: gradient.stops.length <= 2 ? 0.3 : 1,
                                }}
                            >×
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addStop}
                        style={{
                            width: '100%', marginTop: 2, fontSize: 11,
                            border: '1px dashed var(--color-border)', borderRadius: 3,
                            background: 'transparent', color: 'var(--color-text-muted)',
                            cursor: 'pointer', padding: '2px 0',
                        }}
                    >
                        + Add stop
                    </button>

                    <section>
                        <NumberInput
                            label="Opacity"
                            value={Math.round(fill.opacity * 100)}
                            min={0} max={100}
                            onChange={v => onChange({...fill, opacity: v / 100})}
                            unit="%"
                        />
                    </section>
                </TabbedPanelContent>
                <TabbedPanelContent tab={'sketch'} {...tabProps}>
                    <div>some content 3</div>
                </TabbedPanelContent>
            </TabbedPanel>
        </CollapsibleSection>
    )
}
