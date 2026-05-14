import type {CustomFont, GradientDef} from '@model/document'
import type {GradientFill, TextStyle} from "@model/shapes.ts"
import {detectSmallCaps} from '@utils/fontFeatures'
import {
    ALargeSmall,
    AlignCenter,
    AlignLeft,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignVerticalJustifyEnd,
    AlignVerticalJustifyStart,
    Italic,
} from 'lucide-react'
import {useEffect, useState} from 'react'
import {ColorInput} from '../inputs/ColorInput'
import inputStyles from '../inputs/inputs.module.css'
import {NumberInput} from '../inputs/NumberInput'
import {SelectInput} from '../inputs/SelectInput'
import {useAppDispatch, useAppState} from '@store/context'
import {GradientPicker, TabbedPanel, TabbedPanelContent, TabbedPanelTab, TabbedPanelTabs} from '../TabbedPanel'
import "../propsheet.css"

// Logarithmic slider: maps slider 0–100 to font size 5–500
// Midpoint (50) ≈ 50px, which feels natural for font size picking
const FONT_SIZE_MIN = 5
const FONT_SIZE_MAX = 500

function fontSizeToSlider(size: number): number {
    return Math.round(Math.log(size / FONT_SIZE_MIN) / Math.log(FONT_SIZE_MAX / FONT_SIZE_MIN) * 100)
}

function sliderToFontSize(slider: number): number {
    return Math.round(FONT_SIZE_MIN * Math.pow(FONT_SIZE_MAX / FONT_SIZE_MIN, slider / 100))
}

const ALL_WEIGHT_OPTIONS = [
    {value: '100', label: 'Thin'},
    {value: '200', label: 'ExtraLight'},
    {value: '300', label: 'Light'},
    {value: 'normal', label: 'Normal'},
    {value: '500', label: 'Medium'},
    {value: '600', label: 'SemiBold'},
    {value: 'bold', label: 'Bold'},
    {value: '800', label: 'ExtraBold'},
    {value: '900', label: 'Black'},
]

const WEIGHT_VALUE_TO_NUM: Record<string, number> = {
    normal: 400, bold: 700,
    '100': 100, '200': 200, '300': 300, '400': 400, '500': 500,
    '600': 600, '700': 700, '800': 800, '900': 900,
}

function fontWeightToNumber(weight: TextStyle['fontWeight']): number {
    return WEIGHT_VALUE_TO_NUM[weight] ?? 400
}

function axisStep(axis: { min: number; max: number; default: number }): number {
    return [axis.min, axis.max, axis.default].every(Number.isInteger) ? 1 : 0.1
}

function axisValueForText(text: TextStyle, axis: { tag: string; default: number }): number {
    const explicit = text.fontVariationSettings?.[axis.tag]
    if (explicit !== undefined) return explicit
    if (axis.tag === 'wght') return fontWeightToNumber(text.fontWeight)
    return axis.default
}

// Returns the subset of ALL_WEIGHT_OPTIONS that the given font family supports,
// based on loaded FontFace descriptors. Falls back to all weights for system fonts.
function detectAvailableWeights(fontFamily: string): typeof ALL_WEIGHT_OPTIONS {
    if (typeof document === 'undefined') return ALL_WEIGHT_OPTIONS
    const target = fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
    const matched: number[] = []
    document.fonts.forEach(face => {
        const name = face.family.replace(/['"]/g, '').toLowerCase()
        if (name !== target) return
        const w = face.weight ?? 'normal'
        const parts = w.trim().split(/\s+/)
        if (parts.length === 2) {
            // Weight range e.g. "100 900"
            const min = Number(parts[0]), max = Number(parts[1])
            for (const opt of ALL_WEIGHT_OPTIONS) {
                const n = WEIGHT_VALUE_TO_NUM[opt.value]
                if (n >= min && n <= max) matched.push(n)
            }
        } else {
            const raw = parts[0] === 'bold' ? 700 : parts[0] === 'normal' ? 400 : Number(parts[0])
            if (!isNaN(raw)) matched.push(raw)
        }
    })
    if (matched.length === 0) return ALL_WEIGHT_OPTIONS
    const numSet = new Set(matched)
    return ALL_WEIGHT_OPTIONS.filter(opt => numSet.has(WEIGHT_VALUE_TO_NUM[opt.value]))
}

const COMMON_FONTS = [
    {value: 'Inter, system-ui, sans-serif', label: 'Inter'},
    {value: 'Georgia, serif', label: 'Georgia'},
    {value: 'Courier New, monospace', label: 'Courier New'},
    {value: 'Caveat, cursive', label: 'Caveat'},
    {value: 'Arial, sans-serif', label: 'Arial'},
    {value: 'Helvetica, sans-serif', label: 'Helvetica'},
]

interface Props {
    text: TextStyle
    onChange: (t: TextStyle) => void
    customFonts?: string[]    // document-level custom Google Font names
    activeFont?: CustomFont | null  // CustomFont object for the current fontFamily (if any)
}

export function TextSection({
                                text,
                                onChange,
                                customFonts,
                                activeFont,
                            }: Props) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const docGradients: GradientDef[] = state.document.gradients ?? []

    const applyChange = (changes: Partial<TextStyle>) => {
        onChange({...text, ...changes})
    }

    const [colorTab, setColorTab] = useState<'color' | 'gradient'>(() =>
        text.textGradient ? 'gradient' : 'color'
    )
    const [strokeTab, setStrokeTab] = useState<'color' | 'gradient'>(() =>
        text.textStrokeGradient ? 'gradient' : 'color'
    )

    const switchColorToColor = () => applyChange({textGradient: null})
    const switchColorToGradient = () => {
        const first = docGradients[0]
        const gf: GradientFill = {
            type: 'gradient',
            gradientType: 'linear',
            angle: 90,
            stops: first ? first.stops : [{color: text.color, position: 0}, {color: '#ffffff', position: 1}],
            opacity: 1,
            gradientId: first?.id,
        }
        applyChange({textGradient: gf})
    }
    const handleColorGradientSelect = (gradientId: string) => {
        const g = docGradients.find(x => x.id === gradientId)
        if (!g || !text.textGradient) return
        applyChange({textGradient: {...text.textGradient, stops: g.stops, gradientId: g.id}})
    }

    const switchStrokeToColor = () => applyChange({textStrokeGradient: null})
    const switchStrokeToGradient = () => {
        const first = docGradients[0]
        const gf: GradientFill = {
            type: 'gradient',
            gradientType: 'linear',
            angle: 90,
            stops: first ? first.stops : [{color: text.stroke?.color ?? '#000000', position: 0}, {color: '#ffffff', position: 1}],
            opacity: 1,
            gradientId: first?.id,
        }
        applyChange({textStrokeGradient: gf})
    }
    const handleStrokeGradientSelect = (gradientId: string) => {
        const g = docGradients.find(x => x.id === gradientId)
        if (!g || !text.textStrokeGradient) return
        applyChange({textStrokeGradient: {...text.textStrokeGradient, stops: g.stops, gradientId: g.id}})
    }

    const colorTabProps = {selectedTab: colorTab, setSelectedTab: setColorTab}
    const strokeTabProps = {selectedTab: strokeTab, setSelectedTab: setStrokeTab}

    const customFontEntries = (customFonts ?? []).map(name => ({value: name, label: name}))
    const fontOptions = [...COMMON_FONTS, ...customFontEntries]
    if (text.fontFamily && !fontOptions.some(f => f.value === text.fontFamily)) {
        fontOptions.push({value: text.fontFamily, label: text.fontFamily.split(',')[0].trim()})
    }

    // Detect which weights the current font actually supports
    const [weightOptions, setWeightOptions] = useState(() => detectAvailableWeights(text.fontFamily))
    useEffect(() => {
        setWeightOptions(detectAvailableWeights(text.fontFamily))
        document.fonts.ready.then(() => setWeightOptions(detectAvailableWeights(text.fontFamily)))
    }, [text.fontFamily])

    // Detect whether the current font has a true OpenType small-caps feature.
    // null = unknown (WOFF2 only / not a Google Font) — show toggle without warning.
    const [hasSmallCaps, setHasSmallCaps] = useState<boolean | null>(null)
    useEffect(() => {
        setHasSmallCaps(null)
        detectSmallCaps(text.fontFamily).then(setHasSmallCaps)
    }, [text.fontFamily])

    return (
        <details className={"collapsible-section"} open={true}>
            <summary>Text</summary>
            <article>
                {/* 1 — Font identity: family → size */}
                <SelectInput
                    label="Font"
                    value={text.fontFamily}
                    options={fontOptions}
                    onChange={v => applyChange({fontFamily: v})}
                />

                {/* size */}
                <section className={'subgrid'}>
                    <label>Size</label>
                    <NumberInput
                        value={text.fontSize}
                        min={FONT_SIZE_MIN}
                        max={FONT_SIZE_MAX}
                        step={1}
                        unit="px"
                        onChange={v => applyChange({fontSize: v})}
                    />
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={fontSizeToSlider(Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, text.fontSize)))}
                        className={'span2'}
                        onChange={e => applyChange({fontSize: sliderToFontSize(Number(e.target.value))})}
                    />
                </section>

                {/* 2 — Font style: weight + italic + small caps */}
                <SelectInput
                    label="Weight"
                    value={text.fontWeight}
                    options={weightOptions}
                    onChange={v => applyChange({fontWeight: v as TextStyle['fontWeight']})}
                />
                <section className={'subgrid'}>
                    <button
                        className={`${inputStyles.iconBtn}${text.fontStyle === 'italic' ? ` ${inputStyles.iconBtnActive}` : ''}`}
                        title="Italic"
                        onClick={() => applyChange({fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic'})}
                    >
                        <Italic size={13}/>
                    </button>
                    <button
                        className={`${inputStyles.iconBtn}${text.fontVariantCaps === 'small-caps' ? ` ${inputStyles.iconBtnActive}` : ''}`}
                        title={hasSmallCaps === false ? 'Small Caps (synthesized — font has no native smcp)' : 'Small Caps'}
                        style={{opacity: hasSmallCaps === false ? 0.45 : 1}}
                        onClick={() => applyChange({fontVariantCaps: text.fontVariantCaps === 'small-caps' ? 'normal' : 'small-caps'})}
                    >
                        <ALargeSmall size={13}/>
                    </button>
                </section>


                <details>
                    <summary>Font Axes</summary>
                    {/* 8 — Variable font axes */}
                    {activeFont?.isVariable === true && activeFont.axes.length > 0 && (
                        <>
                            {activeFont.axes.filter(axis => axis.tag !== 'ital').map(axis => {
                                const val = axisValueForText(text, axis)
                                const step = axisStep(axis)
                                const onChange = (v: number) => applyChange({
                                    fontVariationSettings: {
                                        ...(text.fontVariationSettings ?? {}),
                                        [axis.tag]: v
                                    },
                                })
                                return (
                                    <div key={axis.tag}>
                                        <NumberInput
                                            label={axis.name ? `${axis.name} (${axis.tag})` : axis.tag}
                                            value={val}
                                            min={axis.min}
                                            max={axis.max}
                                            step={step}
                                            onChange={onChange}
                                        />
                                        <input
                                            type="range"
                                            min={axis.min}
                                            max={axis.max}
                                            step={step}
                                            value={val}
                                            onChange={e => onChange(Number(e.target.value))}
                                            style={{
                                                width: '100%',
                                                marginTop: 2,
                                                accentColor: 'var(--color-accent)'
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </>
                    )}

                </details>

                <details>
                    <summary>Color</summary>
                    <article>
                        <TabbedPanel>
                            <TabbedPanelTabs>
                                <TabbedPanelTab tab={'color'} title={'Color'} onChange={switchColorToColor} {...colorTabProps}/>
                                <TabbedPanelTab tab={'gradient'} title={'Gradient'} onChange={switchColorToGradient} {...colorTabProps}/>
                            </TabbedPanelTabs>
                            <TabbedPanelContent tab={'color'} {...colorTabProps}>
                                <section className={'super'}>
                                    <ColorInput
                                        value={{color: text.color, paletteColorId: text.paletteColorId}}
                                        onChange={ref => applyChange({color: ref.color, paletteColorId: ref.paletteColorId})}
                                    />
                                </section>
                            </TabbedPanelContent>
                            <TabbedPanelContent tab={'gradient'} {...colorTabProps}>
                                <section className={'super'}>
                                    <label className={'s'}>Stops</label>
                                    <GradientPicker
                                        className={'mid1span3'}
                                        gradients={docGradients}
                                        value={text.textGradient?.gradientId ?? ''}
                                        onChange={handleColorGradientSelect}
                                        showCustom={!text.textGradient?.gradientId}
                                    />
                                    <label className={'s'}>Type</label>
                                    <select
                                        className={'mid1span3'}
                                        value={text.textGradient?.gradientType ?? 'linear'}
                                        onChange={e => text.textGradient && applyChange({textGradient: {...text.textGradient, gradientType: e.target.value as GradientFill['gradientType']}})}
                                    >
                                        <option value='linear'>Linear</option>
                                        <option value='radial'>Radial</option>
                                        <option value='conic'>Conic</option>
                                    </select>
                                    {text.textGradient?.gradientType !== 'radial' && <>
                                        <label className={'s'}>Angle</label>
                                        <input className={'mid1span2'} type={'number'}
                                               value={text.textGradient?.angle ?? 90} min={0} max={360}
                                               onChange={e => text.textGradient && applyChange({textGradient: {...text.textGradient, angle: parseInt(e.target.value) || 0}})}
                                        />
                                        <label className={'e'}>°</label>
                                    </>}
                                    <button className={'mid1span3'} onClick={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}>Edit Gradients…</button>
                                </section>
                            </TabbedPanelContent>
                        </TabbedPanel>
                    </article>
                </details>

                <details>
                    <summary>Advanced</summary>
                    <article>
                        <section className={'subgrid'}>
                            <label>Align</label>
                            <div className={'group col2span3'}>
                                {([
                                    {value: 'left', Icon: AlignLeft, title: 'Left'},
                                    {value: 'center', Icon: AlignCenter, title: 'Center'},
                                    {value: 'right', Icon: AlignRight, title: 'Right'},
                                ] as const).map(({value, Icon, title}) => (
                                    <button
                                        key={value}
                                        className={`${inputStyles.iconBtn} ${text.align === value ? inputStyles.iconBtnActive : ''}`}
                                        title={title}
                                        onClick={() => applyChange({align: value})}
                                    >
                                        <Icon size={13}/>
                                    </button>
                                ))}
                                <span style={{
                                    width: 1,
                                    background: 'var(--color-border)',
                                    alignSelf: 'stretch',
                                    margin: '2px 2px'
                                }}/>
                                {([
                                    {value: 'top', Icon: AlignVerticalJustifyStart, title: 'Top'},
                                    {
                                        value: 'middle',
                                        Icon: AlignVerticalJustifyCenter,
                                        title: 'Middle'
                                    },
                                    {
                                        value: 'bottom',
                                        Icon: AlignVerticalJustifyEnd,
                                        title: 'Bottom'
                                    },
                                ] as const).map(({value, Icon, title}) => (
                                    <button
                                        key={value}
                                        className={`${inputStyles.iconBtn} ${text.verticalAlign === value ? inputStyles.iconBtnActive : ''}`}
                                        title={title}
                                        onClick={() => applyChange({verticalAlign: value})}
                                    >
                                        <Icon size={13}/>
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section className={'subgrid'}>
                            <label>Line H</label>
                            <NumberInput
                                value={text.lineHeight ?? 1.2}
                                min={0.5}
                                max={4}
                                step={0.1}
                                onChange={v => applyChange({lineHeight: v})}
                                unit={'%'}
                            />
                        </section>
                        <section className={'subgrid'}>
                            <label>Spacing</label>
                            <NumberInput
                                value={text.letterSpacing ?? 0}
                                min={-10}
                                max={50}
                                step={0.5}
                                unit="px"
                                onChange={v => applyChange({letterSpacing: v})}
                            />
                        </section>
                        <SelectInput
                            label="Transform"
                            value={text.textTransform ?? 'none'}
                            options={[
                                {value: 'none', label: 'None'},
                                {value: 'uppercase', label: 'Uppercase'},
                                {value: 'lowercase', label: 'Lowercase'},
                                {value: 'capitalize', label: 'Capitalize'},
                            ]}
                            onChange={v => applyChange({textTransform: v as TextStyle['textTransform']})}
                        />
                    </article>
                </details>

                <details>
                    <summary>Shadow</summary>
                    {/* 7 — Effects: shadow */}
                    <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        <div style={{flex: 1}} className={inputStyles.field}>
                            <span className={inputStyles.label}>Shadow</span>
                            <input
                                type="checkbox"
                                className={inputStyles.checkbox}
                                checked={!!text.textShadow}
                                onChange={e => applyChange({
                                    textShadow: e.target.checked
                                        ? {
                                            offsetX: 2,
                                            offsetY: 2,
                                            blur: 4,
                                            color: 'rgba(0,0,0,0.5)'
                                        }
                                        : null
                                })}
                            />
                        </div>
                    </div>
                    {text.textShadow && (
                        <div style={{
                            paddingLeft: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}>
                            <ColorInput
                                label="Color"
                                value={{color: text.textShadow.color}}
                                onChange={ref => applyChange({
                                    textShadow: {
                                        ...text.textShadow!,
                                        color: ref.color
                                    }
                                })}
                            />
                            <NumberInput label="X" value={text.textShadow.offsetX} min={-100}
                                         max={100}
                                         step={1} unit="px"
                                         onChange={v => applyChange({
                                             textShadow: {
                                                 ...text.textShadow!,
                                                 offsetX: v
                                             }
                                         })}/>
                            <NumberInput label="Y" value={text.textShadow.offsetY} min={-100}
                                         max={100}
                                         step={1} unit="px"
                                         onChange={v => applyChange({
                                             textShadow: {
                                                 ...text.textShadow!,
                                                 offsetY: v
                                             }
                                         })}/>
                            <NumberInput label="Blur" value={text.textShadow.blur} min={0} max={100}
                                         step={1} unit="px"
                                         onChange={v => applyChange({
                                             textShadow: {
                                                 ...text.textShadow!,
                                                 blur: v
                                             }
                                         })}/>
                        </div>
                    )}

                </details>

                <details>
                    <summary>Stroke</summary>
                    <div style={{display: 'flex', alignItems: 'center', gap: 4}}>
                        <div style={{flex: 1}} className={inputStyles.field}>
                            <span className={inputStyles.label}>Stroke</span>
                            <input
                                type="checkbox"
                                className={inputStyles.checkbox}
                                checked={!!text.stroke}
                                onChange={e => applyChange({
                                    stroke: e.target.checked ? {width: 1, color: '#000000'} : undefined,
                                    textStrokeGradient: e.target.checked ? text.textStrokeGradient : null,
                                })}
                            />
                        </div>
                    </div>
                    {text.stroke && (
                        <>
                            <TabbedPanel>
                                <TabbedPanelTabs>
                                    <TabbedPanelTab tab={'color'} title={'Color'} onChange={switchStrokeToColor} {...strokeTabProps}/>
                                    <TabbedPanelTab tab={'gradient'} title={'Gradient'} onChange={switchStrokeToGradient} {...strokeTabProps}/>
                                </TabbedPanelTabs>
                                <TabbedPanelContent tab={'color'} {...strokeTabProps}>
                                    <section className={'super'}>
                                        <ColorInput
                                            value={{color: text.stroke.color}}
                                            onChange={ref => applyChange({stroke: {...text.stroke!, color: ref.color}})}
                                        />
                                    </section>
                                </TabbedPanelContent>
                                <TabbedPanelContent tab={'gradient'} {...strokeTabProps}>
                                    <section className={'super'}>
                                        <label className={'s'}>Stops</label>
                                        <GradientPicker
                                            className={'mid1span3'}
                                            gradients={docGradients}
                                            value={text.textStrokeGradient?.gradientId ?? ''}
                                            onChange={handleStrokeGradientSelect}
                                            showCustom={!text.textStrokeGradient?.gradientId}
                                        />
                                        <label className={'s'}>Type</label>
                                        <select
                                            className={'mid1span3'}
                                            value={text.textStrokeGradient?.gradientType ?? 'linear'}
                                            onChange={e => text.textStrokeGradient && applyChange({textStrokeGradient: {...text.textStrokeGradient, gradientType: e.target.value as GradientFill['gradientType']}})}
                                        >
                                            <option value='linear'>Linear</option>
                                            <option value='radial'>Radial</option>
                                            <option value='conic'>Conic</option>
                                        </select>
                                        {text.textStrokeGradient?.gradientType !== 'radial' && <>
                                            <label className={'s'}>Angle</label>
                                            <input className={'mid1span2'} type={'number'}
                                                   value={text.textStrokeGradient?.angle ?? 90} min={0} max={360}
                                                   onChange={e => text.textStrokeGradient && applyChange({textStrokeGradient: {...text.textStrokeGradient, angle: parseInt(e.target.value) || 0}})}
                                            />
                                            <label className={'e'}>°</label>
                                        </>}
                                        <button className={'mid1span3'} onClick={() => dispatch({type: 'TOGGLE_GRADIENT_MODAL'})}>Edit Gradients…</button>
                                    </section>
                                </TabbedPanelContent>
                            </TabbedPanel>
                            <NumberInput
                                label="Width"
                                value={text.stroke.width}
                                min={0} max={20} step={0.5} unit="px"
                                onChange={v => applyChange({stroke: {...text.stroke!, width: v}})}
                            />
                        </>
                    )}
                </details>
            </article>
        </details>
    )
}
