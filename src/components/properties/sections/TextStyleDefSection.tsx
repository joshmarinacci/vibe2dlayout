import type { Dispatch } from 'react'
import type { TextStyleDef, TextStyleField } from '@model/textStyle'
import type { AppAction } from '@store/types'
import type { FontWeight } from '@model/shapes'
import { NumberInput } from '../inputs/NumberInput'
import { SelectInput } from '../inputs/SelectInput'
import { ColorInput } from '../inputs/ColorInput'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import styles from '../PropertiesPanel.module.css'
import inputStyles from '../inputs/inputs.module.css'

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
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Text Style</div>
        <div className={styles.nameRow}>
          <input
            className={styles.nameInput}
            value={style.name}
            onChange={e => update({ name: e.target.value })}
            placeholder="Style name"
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Properties</div>
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
      </div>
    </>
  )
}
