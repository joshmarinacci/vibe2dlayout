import type { TextStyle, FontWeight } from './shapes'

export type TextStyleField =
  | 'fontFamily' | 'fontSize' | 'fontWeight' | 'fontStyle'
  | 'color' | 'paletteColorId' | 'align' | 'verticalAlign'
  | 'lineHeight' | 'letterSpacing' | 'textDecoration' | 'textTransform'
  | 'textGradient'

export const TEXT_STYLE_FIELDS: TextStyleField[] = [
  'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
  'color', 'paletteColorId', 'align', 'verticalAlign',
  'lineHeight', 'letterSpacing', 'textDecoration', 'textTransform',
  'textGradient',
]

export interface TextStyleDef {
  id: string
  name: string
  // All optional — unset means "don't constrain this field"
  fontFamily?: string
  fontSize?: number
  fontWeight?: FontWeight
  fontStyle?: 'normal' | 'italic'
  color?: string
  paletteColorId?: string
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  letterSpacing?: number
  textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  textGradient?: import('./shapes').LinearGradient | null
}

export const BUILT_IN_TEXT_STYLES: TextStyleDef[] = [
  { id: 'style-title',     name: 'Title',     fontSize: 32, fontWeight: 'bold',   align: 'left' },
  { id: 'style-subtitle',  name: 'Subtitle',  fontSize: 20, fontWeight: '600',    align: 'left' },
  { id: 'style-paragraph', name: 'Paragraph', fontSize: 14, fontWeight: 'normal', align: 'left' },
]

/**
 * Returns a resolved TextStyle where style fields take precedence over shape values
 * for any field NOT listed in text.textStyleOverrides.
 */
export function resolveTextStyle(text: TextStyle, styles: TextStyleDef[]): TextStyle {
  if (!text.textStyleId) return text
  const style = styles.find(s => s.id === text.textStyleId)
  if (!style) return text
  const overrides = new Set(text.textStyleOverrides ?? [])
  const result = { ...text } as unknown as Record<string, unknown>
  for (const field of TEXT_STYLE_FIELDS) {
    if (!overrides.has(field) && style[field] !== undefined) {
      result[field] = style[field]
    }
  }
  return result as unknown as TextStyle
}

/**
 * Returns a shape with its text/title fields resolved against the style list.
 * Returns the same shape object (identity) if no textStyleId is set — no allocation.
 */
import type { Shape } from './shapes'

export function resolveShapeText(shape: Shape, styles: TextStyleDef[]): Shape {
  const s = shape as unknown as Record<string, unknown>
  let changed = false
  const resolved: Record<string, unknown> = { ...s }

  const text = s['text'] as TextStyle | undefined
  if (text && text.textStyleId) {
    const resolvedText = resolveTextStyle(text, styles)
    if (resolvedText !== text) { resolved['text'] = resolvedText; changed = true }
  }

  const title = s['title']
  if (title && typeof title === 'object' && (title as TextStyle).textStyleId) {
    const resolvedTitle = resolveTextStyle(title as TextStyle, styles)
    if (resolvedTitle !== title) { resolved['title'] = resolvedTitle; changed = true }
  }

  return changed ? resolved as unknown as Shape : shape
}
