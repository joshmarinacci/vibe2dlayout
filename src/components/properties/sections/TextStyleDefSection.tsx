import type { Dispatch } from 'react'
import type { TextStyleDef, TextStyleField } from '@model/textStyle'
import type { AppAction } from '@store/types'
import type { FontWeight } from '@model/shapes'
import { NumberInput } from '../inputs/NumberInput'
import { SelectInput } from '../inputs/SelectInput'
import { ColorInput } from '../inputs/ColorInput'
import { AlignLeft, AlignCenter, AlignRight, Underline, Strikethrough } from 'lucide-react'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'
import { CollapsibleSection } from '../CollapsibleSection'

const COMMON_FONTS = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Caveat, cursive',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
]

interface Props {
  style: TextStyleDef
  dispatch: Dispatch<AppAction>
  customFonts?: string[]
}

export function TextStyleDefSection({ style, dispatch, customFonts }: Props) {
  const update = (patch: Partial<TextStyleDef>) =>
    dispatch({ type: 'UPDATE_TEXT_STYLE', style: { ...style, ...patch } })

  const toggle = (field: TextStyleField, defaultValue: unknown) => {
    if (style[field] !== undefined) {
      // unset the field
      const { [field]: _, ...rest } = style as unknown as Record<string, unknown>
      dispatch({ type: 'UPDATE_TEXT_STYLE', style: rest as unknown as TextStyleDef })
    } else {
      update({ [field]: defaultValue } as Partial<TextStyleDef>)
    }
  }

  const fontFamilyOptions = [
    ...COMMON_FONTS.map(f => ({ value: f, label: f.split(',')[0].trim() })),
    ...(customFonts ?? []).map(name => ({ value: name, label: name })),
  ]
  if (style.fontFamily && !fontFamilyOptions.some(f => f.value === style.fontFamily)) {
    fontFamilyOptions.push({ value: style.fontFamily, label: style.fontFamily.split(',')[0].trim() })
  }

  return (
    <>
      <CollapsibleSection title="Text Style">
<div className={styles.nameRow}>
  <input
    className={styles.nameInput}
    value={style.name}
    onChange={e => update({ name: e.target.value })}
    placeholder="Style name"
  />
</div>
      </CollapsibleSection>

      <CollapsibleSection title="Properties">
<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.fontSize !== undefined}
      onChange={() => toggle('fontSize', 16)}
    />
    Font Size
  </label>
  {style.fontSize !== undefined && (
    <NumberInput
      label=""
      value={style.fontSize}
      min={1}
      onChange={v => update({ fontSize: v })}
      unit="px"
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.fontWeight !== undefined}
      onChange={() => toggle('fontWeight', 'normal')}
    />
    Weight
  </label>
  {style.fontWeight !== undefined && (
    <SelectInput
      label=""
      value={style.fontWeight}
      options={[
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: '300', label: 'Light' },
        { value: '500', label: 'Medium' },
        { value: '600', label: 'SemiBold' },
      ]}
      onChange={v => update({ fontWeight: v as FontWeight })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.fontStyle !== undefined}
      onChange={() => toggle('fontStyle', 'normal')}
    />
    Style
  </label>
  {style.fontStyle !== undefined && (
    <SelectInput
      label=""
      value={style.fontStyle}
      options={[
        { value: 'normal', label: 'Normal' },
        { value: 'italic', label: 'Italic' },
      ]}
      onChange={v => update({ fontStyle: v as 'normal' | 'italic' })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.fontFamily !== undefined}
      onChange={() => toggle('fontFamily', COMMON_FONTS[0])}
    />
    Font Family
  </label>
  {style.fontFamily !== undefined && (
    <SelectInput
      label=""
      value={style.fontFamily}
      options={fontFamilyOptions}
      onChange={v => update({ fontFamily: v })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.color !== undefined}
      onChange={() => toggle('color', '#333333')}
    />
    Color
  </label>
  {style.color !== undefined && (
    <ColorInput
      label=""
      value={{ color: style.color, paletteColorId: style.paletteColorId }}
      onChange={ref => update({ color: ref.color, paletteColorId: ref.paletteColorId })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.align !== undefined}
      onChange={() => toggle('align', 'left')}
    />
    Align
  </label>
  {style.align !== undefined && (
    <div className={inputStyles.iconBtnGroup}>
      {([
        { value: 'left',   Icon: AlignLeft },
        { value: 'center', Icon: AlignCenter },
        { value: 'right',  Icon: AlignRight },
      ] as const).map(({ value, Icon }) => (
        <button
          key={value}
          className={`${inputStyles.iconBtn} ${style.align === value ? inputStyles.iconBtnActive : ''}`}
          title={value}
          onClick={() => update({ align: value })}
        >
          <Icon size={13} />
        </button>
      ))}
    </div>
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.lineHeight !== undefined}
      onChange={() => toggle('lineHeight', 1.2)}
    />
    Line Height
  </label>
  {style.lineHeight !== undefined && (
    <NumberInput
      label=""
      value={style.lineHeight}
      min={0.5}
      max={4}
      step={0.1}
      onChange={v => update({ lineHeight: v })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.letterSpacing !== undefined}
      onChange={() => toggle('letterSpacing', 0)}
    />
    Letter Spacing
  </label>
  {style.letterSpacing !== undefined && (
    <NumberInput
      label=""
      value={style.letterSpacing}
      min={-10}
      max={50}
      step={0.5}
      unit="px"
      onChange={v => update({ letterSpacing: v })}
    />
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.textDecoration !== undefined}
      onChange={() => toggle('textDecoration', 'none')}
    />
    Decoration
  </label>
  {style.textDecoration !== undefined && (
    <div className={inputStyles.iconBtnGroup}>
      {([
        { value: 'underline',    Icon: Underline,     title: 'Underline' },
        { value: 'line-through', Icon: Strikethrough, title: 'Strikethrough' },
      ] as const).map(({ value, Icon, title }) => {
        const cur = style.textDecoration ?? 'none'
        const active = cur === value || cur === 'underline line-through'
        const toggle2 = () => {
          const both = cur === 'underline line-through'
          if (value === 'underline') {
            if (cur === 'underline') update({ textDecoration: 'none' })
            else if (cur === 'line-through') update({ textDecoration: 'underline line-through' })
            else if (both) update({ textDecoration: 'line-through' })
            else update({ textDecoration: 'underline' })
          } else {
            if (cur === 'line-through') update({ textDecoration: 'none' })
            else if (cur === 'underline') update({ textDecoration: 'underline line-through' })
            else if (both) update({ textDecoration: 'underline' })
            else update({ textDecoration: 'line-through' })
          }
        }
        return (
          <button
            key={value}
            className={`${inputStyles.iconBtn} ${active ? inputStyles.iconBtnActive : ''}`}
            title={title}
            onClick={toggle2}
          >
            <Icon size={13} />
          </button>
        )
      })}
    </div>
  )}
</div>

<div className={styles.row}>
  <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <input
      type="checkbox"
      checked={style.textTransform !== undefined}
      onChange={() => toggle('textTransform', 'none')}
    />
    Transform
  </label>
  {style.textTransform !== undefined && (
    <SelectInput
      label=""
      value={style.textTransform}
      options={[
        { value: 'none',       label: 'None' },
        { value: 'uppercase',  label: 'Uppercase' },
        { value: 'lowercase',  label: 'Lowercase' },
        { value: 'capitalize', label: 'Capitalize' },
      ]}
      onChange={v => update({ textTransform: v as TextStyleDef['textTransform'] })}
    />
  )}
</div>
      </CollapsibleSection>
    </>
  )
}
