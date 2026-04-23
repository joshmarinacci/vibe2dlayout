import { useState, useEffect, type Dispatch } from 'react'
import { RotateCcw } from 'lucide-react'
import type { TextStyle, LinearGradient } from '@model/shapes'
import type { TextStyleDef } from '@model/textStyle'
import type { AppAction } from '@store/types'
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, Underline, Strikethrough, Italic, ALargeSmall } from 'lucide-react'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput } from '../inputs/SelectInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'
import { CollapsibleSection } from '../CollapsibleSection'
import { detectSmallCaps } from '@utils/fontFeatures'

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
  { value: '100', label: 'Thin' },
  { value: '200', label: 'ExtraLight' },
  { value: '300', label: 'Light' },
  { value: 'normal', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'SemiBold' },
  { value: 'bold', label: 'Bold' },
  { value: '800', label: 'ExtraBold' },
  { value: '900', label: 'Black' },
]

const WEIGHT_VALUE_TO_NUM: Record<string, number> = {
  normal: 400, bold: 700,
  '100': 100, '200': 200, '300': 300, '400': 400, '500': 500,
  '600': 600, '700': 700, '800': 800, '900': 900,
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
  { value: 'Inter, system-ui, sans-serif', label: 'Inter' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Caveat, cursive', label: 'Caveat' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
]

// Style-able fields — any change to these is tracked as an override when a style is applied
const STYLE_FIELDS = new Set([
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'color', 'paletteColorId', 'align', 'verticalAlign', 'textShadow',
  'lineHeight', 'letterSpacing', 'textDecoration', 'textTransform', 'textGradient', 'fontVariantCaps',
])

const DEFAULT_TEXT_GRADIENT: LinearGradient = {
  type: 'linear', angle: 90,
  stops: [{ color: '#4f46e5', position: 0 }, { color: '#e879f9', position: 1 }],
}

interface Props {
  text: TextStyle           // resolved text (effective values for display)
  rawText: TextStyle        // original shape text (for textStyleId and textStyleOverrides)
  textStyles: TextStyleDef[]
  shapeId: string
  onChange: (t: TextStyle) => void
  dispatch: Dispatch<AppAction>
  customFonts?: string[]    // document-level custom Google Font names
}

export function TextSection({ text, rawText, textStyles, shapeId, onChange, dispatch, customFonts }: Props) {
  // Apply a partial change to the text, preserving style connection and tracking overrides.
  // Always uses rawText as the base so textStyleId is never lost.
  // Explicitly adds changed style-able fields to textStyleOverrides so that a field whose
  // raw value happens to equal the new value (but differs from the style) is still overridden.
  const applyChange = (changes: Partial<TextStyle>) => {
    if (rawText.textStyleId) {
      const overrides = new Set(rawText.textStyleOverrides ?? [])
      for (const k of Object.keys(changes)) {
        if (STYLE_FIELDS.has(k)) overrides.add(k)
      }
      onChange({ ...rawText, ...changes, textStyleOverrides: [...overrides] })
    } else {
      onChange({ ...rawText, ...changes })
    }
  }

  const activeStyleId = rawText.textStyleId ?? ''
  const overrides = new Set(rawText.textStyleOverrides ?? [])
  const hasStyle = !!rawText.textStyleId

  const styleOptions = [
    { value: '', label: 'None' },
    ...textStyles.map(s => ({ value: s.id, label: s.name })),
  ]

  const customFontEntries = (customFonts ?? []).map(name => ({ value: name, label: name }))
  const fontOptions = [...COMMON_FONTS, ...customFontEntries]
  if (text.fontFamily && !fontOptions.some(f => f.value === text.fontFamily)) {
    fontOptions.push({ value: text.fontFamily, label: text.fontFamily.split(',')[0].trim() })
  }

  const resetOverride = (field: string) =>
    dispatch({ type: 'CLEAR_TEXT_OVERRIDE', shapeId, field })

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
    <CollapsibleSection title="Text">

{/* 1 — Named style */}
<SelectInput
  label="Style"
  value={activeStyleId}
  options={styleOptions}
  onChange={v => dispatch({ type: 'APPLY_TEXT_STYLE', shapeId, textStyleId: v || null })}
/>

{/* 2 — Font identity: family → size */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }}>
    <SelectInput
      label="Font"
      value={text.fontFamily}
      options={fontOptions}
      onChange={v => applyChange({ fontFamily: v })}
    />
  </div>
  {hasStyle && overrides.has('fontFamily') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontFamily')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }}>
    <NumberInput
      label="Size"
      value={text.fontSize}
      min={FONT_SIZE_MIN}
      max={FONT_SIZE_MAX}
      step={1}
      unit="px"
      onChange={v => applyChange({ fontSize: v })}
    />
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={fontSizeToSlider(Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, text.fontSize)))}
      onChange={e => applyChange({ fontSize: sliderToFontSize(Number(e.target.value)) })}
      style={{ width: '100%', marginTop: 2, accentColor: 'var(--color-accent)' }}
    />
  </div>
  {hasStyle && overrides.has('fontSize') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontSize')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

{/* 3 — Font style: weight + italic + small caps */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }}>
    <SelectInput
      label="Weight"
      value={text.fontWeight}
      options={weightOptions}
      onChange={v => applyChange({ fontWeight: v as TextStyle['fontWeight'] })}
    />
  </div>
  <button
    className={`${inputStyles.iconBtn}${text.fontStyle === 'italic' ? ` ${inputStyles.iconBtnActive}` : ''}`}
    title="Italic"
    onClick={() => applyChange({ fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' })}
  >
    <Italic size={13} />
  </button>
  <button
    className={`${inputStyles.iconBtn}${text.fontVariantCaps === 'small-caps' ? ` ${inputStyles.iconBtnActive}` : ''}`}
    title={hasSmallCaps === false ? 'Small Caps (synthesized — font has no native smcp)' : 'Small Caps'}
    style={{ opacity: hasSmallCaps === false ? 0.45 : 1 }}
    onClick={() => applyChange({ fontVariantCaps: text.fontVariantCaps === 'small-caps' ? 'normal' : 'small-caps' })}
  >
    <ALargeSmall size={13} />
  </button>
  {hasStyle && overrides.has('fontWeight') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontWeight')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
  {hasStyle && overrides.has('fontStyle') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontStyle')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
  {hasStyle && overrides.has('fontVariantCaps') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontVariantCaps')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

{/* 4 — Alignment: H and V on one row */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }} className={inputStyles.field}>
    <span className={inputStyles.label}>Align</span>
    <div className={inputStyles.iconBtnGroup}>
      {([
        { value: 'left',   Icon: AlignLeft,   title: 'Left' },
        { value: 'center', Icon: AlignCenter, title: 'Center' },
        { value: 'right',  Icon: AlignRight,  title: 'Right' },
      ] as const).map(({ value, Icon, title }) => (
        <button
          key={value}
          className={`${inputStyles.iconBtn} ${text.align === value ? inputStyles.iconBtnActive : ''}`}
          title={title}
          onClick={() => applyChange({ align: value })}
        >
          <Icon size={13} />
        </button>
      ))}
      <span style={{ width: 1, background: 'var(--color-border)', alignSelf: 'stretch', margin: '2px 2px' }} />
      {([
        { value: 'top',    Icon: AlignVerticalJustifyStart,  title: 'Top' },
        { value: 'middle', Icon: AlignVerticalJustifyCenter, title: 'Middle' },
        { value: 'bottom', Icon: AlignVerticalJustifyEnd,    title: 'Bottom' },
      ] as const).map(({ value, Icon, title }) => (
        <button
          key={value}
          className={`${inputStyles.iconBtn} ${text.verticalAlign === value ? inputStyles.iconBtnActive : ''}`}
          title={title}
          onClick={() => applyChange({ verticalAlign: value })}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  </div>
  {hasStyle && overrides.has('align') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('align')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
  {hasStyle && overrides.has('verticalAlign') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('verticalAlign')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

{/* 5 — Spacing: line height + letter spacing on one row */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }}>
    <NumberInput
      label="Line H"
      value={text.lineHeight ?? 1.2}
      min={0.5}
      max={4}
      step={0.1}
      onChange={v => applyChange({ lineHeight: v })}
    />
  </div>
  {hasStyle && overrides.has('lineHeight') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('lineHeight')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
  <div style={{ flex: 1 }}>
    <NumberInput
      label="Spacing"
      value={text.letterSpacing ?? 0}
      min={-10}
      max={50}
      step={0.5}
      unit="px"
      onChange={v => applyChange({ letterSpacing: v })}
    />
  </div>
  {hasStyle && overrides.has('letterSpacing') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('letterSpacing')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

{/* 6 — Decoration: underline/strikethrough + text transform */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }} className={inputStyles.field}>
    <span className={inputStyles.label}>Decoration</span>
    <div className={inputStyles.iconBtnGroup}>
      {([
        { value: 'underline',     Icon: Underline,     title: 'Underline' },
        { value: 'line-through',  Icon: Strikethrough, title: 'Strikethrough' },
      ] as const).map(({ value, Icon, title }) => {
        const cur = text.textDecoration ?? 'none'
        const active = cur === value || cur === 'underline line-through'
        const toggle = () => {
          const both = cur === 'underline line-through'
          if (value === 'underline') {
            if (cur === 'underline') applyChange({ textDecoration: 'none' })
            else if (cur === 'line-through') applyChange({ textDecoration: 'underline line-through' })
            else if (both) applyChange({ textDecoration: 'line-through' })
            else applyChange({ textDecoration: 'underline' })
          } else {
            if (cur === 'line-through') applyChange({ textDecoration: 'none' })
            else if (cur === 'underline') applyChange({ textDecoration: 'underline line-through' })
            else if (both) applyChange({ textDecoration: 'underline' })
            else applyChange({ textDecoration: 'line-through' })
          }
        }
        return (
          <button
            key={value}
            className={`${inputStyles.iconBtn} ${active ? inputStyles.iconBtnActive : ''}`}
            title={title}
            onClick={toggle}
          >
            <Icon size={13} />
          </button>
        )
      })}
    </div>
  </div>
  {hasStyle && overrides.has('textDecoration') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('textDecoration')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }}>
    <SelectInput
      label="Transform"
      value={text.textTransform ?? 'none'}
      options={[
        { value: 'none',       label: 'None' },
        { value: 'uppercase',  label: 'Uppercase' },
        { value: 'lowercase',  label: 'Lowercase' },
        { value: 'capitalize', label: 'Capitalize' },
      ]}
      onChange={v => applyChange({ textTransform: v as TextStyle['textTransform'] })}
    />
  </div>
  {hasStyle && overrides.has('textTransform') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('textTransform')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>

{/* 7 — Color / gradient */}
{(() => {
  const isGradient = !!text.textGradient
  const gradient = text.textGradient ?? DEFAULT_TEXT_GRADIENT
  const patchGradient = (g: LinearGradient) => applyChange({ textGradient: g })
  const addStop = () => {
    const sorted = [...gradient.stops].sort((a, b) => a.position - b.position)
    let bestIdx = 0, bestGap = 0
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].position - sorted[i].position
      if (gap > bestGap) { bestGap = gap; bestIdx = i }
    }
    const mid = (sorted[bestIdx].position + sorted[bestIdx + 1].position) / 2
    sorted.splice(bestIdx + 1, 0, { color: sorted[bestIdx].color, position: Math.round(mid * 100) / 100 })
    patchGradient({ ...gradient, stops: sorted })
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }} className={inputStyles.field}>
          <span className={inputStyles.label}>Color</span>
          <div className={inputStyles.iconBtnGroup}>
            <button
              className={`${inputStyles.iconBtn} ${!isGradient ? inputStyles.iconBtnActive : ''}`}
              onClick={() => applyChange({ textGradient: null })}
              style={{ fontSize: 10, padding: '2px 6px', width: 'auto' }}
            >Solid</button>
            <button
              className={`${inputStyles.iconBtn} ${isGradient ? inputStyles.iconBtnActive : ''}`}
              onClick={() => applyChange({ textGradient: { ...DEFAULT_TEXT_GRADIENT, stops: [{ color: text.color, position: 0 }, { color: '#ffffff', position: 1 }] } })}
              style={{ fontSize: 10, padding: '2px 6px', width: 'auto' }}
            >Gradient</button>
          </div>
        </div>
        {hasStyle && (overrides.has('color') || overrides.has('textGradient')) && (
          <button className={styles.resetOverrideBtn} onClick={() => { resetOverride('color'); resetOverride('textGradient') }} title="Reset to style">
            <RotateCcw size={10} />
          </button>
        )}
      </div>
      {!isGradient ? (
        <ColorInput
          label=""
          value={{ color: text.color, paletteColorId: text.paletteColorId }}
          onChange={ref => applyChange({ color: ref.color, paletteColorId: ref.paletteColorId })}
        />
      ) : (
        <>
          <NumberInput label="Angle" value={gradient.angle} min={0} max={360} step={1} unit="°"
            onChange={v => patchGradient({ ...gradient, angle: v })} />
          {gradient.stops.map((stop, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ flex: 1 }}>
                <ColorInput label={`Stop ${idx + 1}`} value={{ color: stop.color }}
                  onChange={ref => {
                    const stops = gradient.stops.map((s, i) => i === idx ? { ...s, color: ref.color } : s)
                    patchGradient({ ...gradient, stops })
                  }} />
              </div>
              <div style={{ width: 48, flexShrink: 0 }}>
                <NumberInput label="" value={Math.round(stop.position * 100)} min={0} max={100} step={1} unit="%"
                  onChange={v => {
                    const stops = gradient.stops.map((s, i) => i === idx ? { ...s, position: v / 100 } : s)
                    patchGradient({ ...gradient, stops })
                  }} />
              </div>
              <button
                onClick={() => {
                  if (gradient.stops.length <= 2) return
                  patchGradient({ ...gradient, stops: gradient.stops.filter((_, i) => i !== idx) })
                }}
                disabled={gradient.stops.length <= 2}
                style={{ width: 16, height: 16, flexShrink: 0, border: 'none', background: 'transparent', color: 'var(--color-text-disabled)', cursor: gradient.stops.length <= 2 ? 'default' : 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: gradient.stops.length <= 2 ? 0.3 : 1 }}
              >×</button>
            </div>
          ))}
          <button onClick={addStop}
            style={{ width: '100%', marginTop: 2, fontSize: 11, border: '1px dashed var(--color-border)', borderRadius: 3, background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '2px 0' }}>
            + Add stop
          </button>
        </>
      )}
    </>
  )
})()}

{/* 8 — Effects: shadow */}
<div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
  <div style={{ flex: 1 }} className={inputStyles.field}>
    <span className={inputStyles.label}>Shadow</span>
    <input
      type="checkbox"
      className={inputStyles.checkbox}
      checked={!!text.textShadow}
      onChange={e => applyChange({ textShadow: e.target.checked
        ? { offsetX: 2, offsetY: 2, blur: 4, color: 'rgba(0,0,0,0.5)' }
        : null
      })}
    />
  </div>
  {hasStyle && overrides.has('textShadow') && (
    <button className={styles.resetOverrideBtn} onClick={() => resetOverride('textShadow')} title="Reset to style">
      <RotateCcw size={10} />
    </button>
  )}
</div>
{text.textShadow && (
  <div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
    <ColorInput
      label="Color"
      value={{ color: text.textShadow.color }}
      onChange={ref => applyChange({ textShadow: { ...text.textShadow!, color: ref.color } })}
    />
    <NumberInput label="X" value={text.textShadow.offsetX} min={-100} max={100} step={1} unit="px"
      onChange={v => applyChange({ textShadow: { ...text.textShadow!, offsetX: v } })} />
    <NumberInput label="Y" value={text.textShadow.offsetY} min={-100} max={100} step={1} unit="px"
      onChange={v => applyChange({ textShadow: { ...text.textShadow!, offsetY: v } })} />
    <NumberInput label="Blur" value={text.textShadow.blur} min={0} max={100} step={1} unit="px"
      onChange={v => applyChange({ textShadow: { ...text.textShadow!, blur: v } })} />
  </div>
)}

    </CollapsibleSection>
  )
}
