import {ColorInput} from '@components/properties/inputs/ColorInput'
import {NumberInput} from '@components/properties/inputs/NumberInput'
import {SelectInput} from '@components/properties/inputs/SelectInput'
import {ToggleInput} from '@components/properties/inputs/ToggleInput'
import type {RichTextStyleEntry} from './types'

interface Props {
    entry: RichTextStyleEntry
    customFonts?: string[]
    onChange: (patch: Partial<RichTextStyleEntry>) => void
}

const WEIGHT_OPTIONS = [
    {value: '100', label: 'Thin (100)'},
    {value: '200', label: 'ExtraLight (200)'},
    {value: '300', label: 'Light (300)'},
    {value: '400', label: 'Normal (400)'},
    {value: '500', label: 'Medium (500)'},
    {value: '600', label: 'SemiBold (600)'},
    {value: '700', label: 'Bold (700)'},
    {value: '800', label: 'ExtraBold (800)'},
    {value: '900', label: 'Black (900)'},
]

const COMMON_FONTS = ['system-ui, sans-serif', 'Inter, sans-serif', 'Georgia, serif', 'ui-monospace, monospace', 'Arial, sans-serif', 'Helvetica Neue, sans-serif', 'Times New Roman, serif', 'Courier New, monospace']

export function StyleElementEditor({entry, customFonts = [], onChange}: Props) {
    const allFonts = [...customFonts, ...COMMON_FONTS.filter(f => !customFonts.includes(f))]
    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                <label style={{fontSize: 11, color: 'var(--color-text-muted)'}}>Font Family</label>
                <input
                    type="text"
                    list="rt-font-families"
                    value={entry.fontFamily}
                    onChange={e => onChange({fontFamily: e.target.value})}
                    style={{
                        fontSize: 12,
                        padding: '4px 8px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 4,
                        background: 'var(--color-bg-surface)',
                        color: 'var(--color-text-primary)',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}
                />
                <datalist id="rt-font-families">
                    {allFonts.map(f => <option key={f} value={f} />)}
                </datalist>
            </div>

            <NumberInput
                label="Font Size"
                value={entry.fontSize}
                min={8}
                max={96}
                step={1}
                unit="px"
                onChange={v => onChange({fontSize: v})}
            />

            <SelectInput
                label="Font Weight"
                value={String(entry.fontWeight)}
                options={WEIGHT_OPTIONS}
                onChange={v => onChange({fontWeight: Number(v)})}
            />

            <ToggleInput
                label="Italic"
                value={entry.italic}
                onChange={v => onChange({italic: v})}
            />

            <ColorInput
                label="Color"
                value={{color: entry.color}}
                onChange={ref => onChange({color: ref.color})}
            />

            <NumberInput
                label="Line Height"
                value={entry.lineHeight}
                min={0.8}
                max={4}
                step={0.05}
                onChange={v => onChange({lineHeight: v})}
            />

            <NumberInput
                label="Letter Spacing"
                value={entry.letterSpacing}
                min={-5}
                max={20}
                step={0.5}
                unit="px"
                onChange={v => onChange({letterSpacing: v})}
            />
        </div>
    )
}
