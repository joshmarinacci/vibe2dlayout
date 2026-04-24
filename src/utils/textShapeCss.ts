import type { TextStyle, LinearGradient } from '@model/shapes'

function gradientToCss(g: LinearGradient): string {
  const stops = g.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')
  return `linear-gradient(${g.angle}deg, ${stops})`
}

/**
 * Converts a TextStyle to a CSS rule block.
 * The selector is passed in so callers can use the shape name.
 */
export function textStyleToCss(text: TextStyle, selector: string): string {
  const rules: string[] = []

  rules.push(`font-family: ${text.fontFamily};`)
  rules.push(`font-size: ${text.fontSize}px;`)
  rules.push(`font-weight: ${text.fontWeight};`)

  if (text.fontStyle !== 'normal') {
    rules.push(`font-style: ${text.fontStyle};`)
  }

  rules.push(`text-align: ${text.align};`)

  if (text.lineHeight !== undefined) {
    rules.push(`line-height: ${text.lineHeight};`)
  }

  if (text.letterSpacing !== undefined && text.letterSpacing !== 0) {
    rules.push(`letter-spacing: ${text.letterSpacing}px;`)
  }

  if (text.textDecoration && text.textDecoration !== 'none') {
    rules.push(`text-decoration: ${text.textDecoration};`)
  }

  if (text.textTransform && text.textTransform !== 'none') {
    rules.push(`text-transform: ${text.textTransform};`)
  }

  if (text.fontVariantCaps && text.fontVariantCaps !== 'normal') {
    rules.push(`font-variant-caps: ${text.fontVariantCaps};`)
  }

  if (text.textGradient) {
    // Gradient text via background-clip trick
    rules.push(`background: ${gradientToCss(text.textGradient)};`)
    rules.push(`-webkit-background-clip: text;`)
    rules.push(`background-clip: text;`)
    rules.push(`color: transparent;`)
  } else {
    rules.push(`color: ${text.color};`)
  }

  if (text.textShadow) {
    const s = text.textShadow
    rules.push(`text-shadow: ${s.offsetX}px ${s.offsetY}px ${s.blur}px ${s.color};`)
  }

  const indent = '  '
  const body = rules.map(r => `${indent}${r}`).join('\n')
  return `${selector} {\n${body}\n}`
}
