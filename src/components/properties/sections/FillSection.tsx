import type {ColorFill, FillStyle, GradientFill, SketchFill} from '@model/shapes'
import {fillColor} from '@model/shapes'
import type {GradientDef, SketchStyleDef} from '@model/document'
import React, {useEffect, useRef, useState} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import {ColorInput} from '../inputs/ColorInput'
import {useAppDispatch, useAppState} from '@store/context'
import '../propsheet.css'

function gradientSwatchCSS(g: GradientDef): string {
    const stops = g.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')
    return `linear-gradient(90deg, ${stops})`
}

interface GradientPickerProps {
    gradients: GradientDef[]
    value: string
    onChange: (id: string) => void
    showCustom: boolean
    className?: string
}

function GradientPicker({gradients, value, onChange, showCustom, className}: GradientPickerProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler, true)
        return () => document.removeEventListener('mousedown', handler, true)
    }, [open])

    const selected = gradients.find(g => g.id === value)

    return (
        <div ref={ref} className={className} style={{position: 'relative', gridColumn: 'inherit'}}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    width: '100%', height: 24,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4, padding: '0 6px',
                    cursor: 'pointer', fontSize: 12,
                    color: 'var(--color-text-primary)',
                }}
            >
                {selected ? (
                    <>
                        <span style={{
                            display: 'inline-block', width: 36, height: 12, borderRadius: 2,
                            background: gradientSwatchCSS(selected),
                            border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0,
                        }}/>
                        <span style={{flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{selected.name}</span>
                    </>
                ) : (
                    <span style={{flex: 1, textAlign: 'left', color: 'var(--color-text-muted)'}}>Custom…</span>
                )}
                <span style={{color: 'var(--color-text-muted)', fontSize: 9}}>▾</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    marginTop: 2, overflow: 'hidden',
                }}>
                    {gradients.map(g => (
                        <div
                            key={g.id}
                            onMouseDown={() => { onChange(g.id); setOpen(false) }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '5px 8px', cursor: 'pointer', fontSize: 12,
                                color: 'var(--color-text-primary)',
                                background: g.id === value ? 'var(--color-accent-bg)' : undefined,
                            }}
                            onMouseEnter={e => { if (g.id !== value) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-panel)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = g.id === value ? 'var(--color-accent-bg)' : '' }}
                        >
                            <span style={{
                                display: 'inline-block', width: 40, height: 14, borderRadius: 2, flexShrink: 0,
                                background: gradientSwatchCSS(g),
                                border: '1px solid rgba(0,0,0,0.1)',
                            }}/>
                            <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{g.name}</span>
                        </div>
                    ))}
                    {showCustom && (
                        <div
                            onMouseDown={() => { onChange(''); setOpen(false) }}
                            style={{
                                padding: '5px 8px', cursor: 'pointer', fontSize: 12,
                                color: 'var(--color-text-muted)',
                                borderTop: gradients.length > 0 ? '1px solid var(--color-border-subtle)' : undefined,
                            }}
                        >Custom…</div>
                    )}
                </div>
            )}
        </div>
    )
}

interface Props {
    fill: FillStyle
    onChange: (f: FillStyle) => void
    title?: string
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
