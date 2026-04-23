import type { Dispatch } from 'react'
import { RotateCcw } from 'lucide-react'
import type { TextStyle } from '@model/shapes'
import type { TextStyleDef } from '@model/textStyle'
import type { AppAction } from '@store/types'
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput } from '../inputs/SelectInput'
import { NumberInput } from '../inputs/NumberInput'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'

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
])

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

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Text</div>

      {/* Style selector */}
      <SelectInput
        label="Style"
        value={activeStyleId}
        options={styleOptions}
        onChange={v => dispatch({ type: 'APPLY_TEXT_STYLE', shapeId, textStyleId: v || null })}
      />

      {/* Color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <ColorInput
            label="Color"
            value={{ color: text.color, paletteColorId: text.paletteColorId }}
            onChange={ref => applyChange({ color: ref.color, paletteColorId: ref.paletteColorId })}
          />
        </div>
        {hasStyle && overrides.has('color') && (
          <button className={styles.resetOverrideBtn} onClick={() => resetOverride('color')} title="Reset to style">
            <RotateCcw size={10} />
          </button>
        )}
      </div>

      {/* Font size */}
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

      {/* Horizontal alignment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }} className={inputStyles.field}>
          <span className={inputStyles.label}>Align</span>
          <div className={inputStyles.iconBtnGroup}>
            {([
              { value: 'left',   Icon: AlignLeft },
              { value: 'center', Icon: AlignCenter },
              { value: 'right',  Icon: AlignRight },
            ] as const).map(({ value, Icon }) => (
              <button
                key={value}
                className={`${inputStyles.iconBtn} ${text.align === value ? inputStyles.iconBtnActive : ''}`}
                title={value.charAt(0).toUpperCase() + value.slice(1)}
                onClick={() => applyChange({ align: value })}
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
      </div>

      {/* Vertical alignment */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }} className={inputStyles.field}>
          <span className={inputStyles.label}>V-Align</span>
          <div className={inputStyles.iconBtnGroup}>
            {([
              { value: 'top',    Icon: AlignVerticalJustifyStart },
              { value: 'middle', Icon: AlignVerticalJustifyCenter },
              { value: 'bottom', Icon: AlignVerticalJustifyEnd },
            ] as const).map(({ value, Icon }) => (
              <button
                key={value}
                className={`${inputStyles.iconBtn} ${text.verticalAlign === value ? inputStyles.iconBtnActive : ''}`}
                title={value.charAt(0).toUpperCase() + value.slice(1)}
                onClick={() => applyChange({ verticalAlign: value })}
              >
                <Icon size={13} />
              </button>
            ))}
          </div>
        </div>
        {hasStyle && overrides.has('verticalAlign') && (
          <button className={styles.resetOverrideBtn} onClick={() => resetOverride('verticalAlign')} title="Reset to style">
            <RotateCcw size={10} />
          </button>
        )}
      </div>

      {/* Font weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ flex: 1 }}>
          <SelectInput
            label="Weight"
            value={text.fontWeight}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'bold', label: 'Bold' },
            ]}
            onChange={v => applyChange({ fontWeight: v as TextStyle['fontWeight'] })}
          />
        </div>
        {hasStyle && overrides.has('fontWeight') && (
          <button className={styles.resetOverrideBtn} onClick={() => resetOverride('fontWeight')} title="Reset to style">
            <RotateCcw size={10} />
          </button>
        )}
      </div>

      {/* Font family */}
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

      {/* Text shadow */}
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
    </div>
  )
}
