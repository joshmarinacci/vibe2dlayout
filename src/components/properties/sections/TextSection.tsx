import type { Dispatch } from 'react'
import { RotateCcw } from 'lucide-react'
import type { TextStyle } from '@model/shapes'
import type { TextStyleDef } from '@model/textStyle'
import type { AppAction } from '@store/types'
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react'
import { ColorInput } from '../inputs/ColorInput'
import { SelectInput } from '../inputs/SelectInput'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'

const FONT_SIZES: { value: number; label: string }[] = [
  { value: 10, label: 'XS' },
  { value: 14, label: 'Small' },
  { value: 20, label: 'Medium' },
  { value: 32, label: 'Large' },
  { value: 56, label: 'XL' },
]

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
  'color', 'paletteColorId', 'align', 'verticalAlign',
])

interface Props {
  text: TextStyle           // resolved text (effective values for display)
  rawText: TextStyle        // original shape text (for textStyleId and textStyleOverrides)
  textStyles: TextStyleDef[]
  shapeId: string
  onChange: (t: TextStyle) => void
  dispatch: Dispatch<AppAction>
}

export function TextSection({ text, rawText, textStyles, shapeId, onChange, dispatch }: Props) {
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

  const isPreset = FONT_SIZES.some(s => s.value === text.fontSize)
  const sizeOptions = [
    ...FONT_SIZES.map(s => ({ value: String(s.value), label: s.label })),
    ...(!isPreset ? [{ value: String(text.fontSize), label: `${text.fontSize}px` }] : []),
  ]

  const activeStyleId = rawText.textStyleId ?? ''
  const overrides = new Set(rawText.textStyleOverrides ?? [])
  const hasStyle = !!rawText.textStyleId

  const styleOptions = [
    { value: '', label: 'None' },
    ...textStyles.map(s => ({ value: s.id, label: s.name })),
  ]

  const fontOptions = [...COMMON_FONTS]
  if (text.fontFamily && !COMMON_FONTS.some(f => f.value === text.fontFamily)) {
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
          <SelectInput
            label="Size"
            value={String(text.fontSize)}
            options={sizeOptions}
            onChange={v => applyChange({ fontSize: Number(v) })}
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
    </div>
  )
}
