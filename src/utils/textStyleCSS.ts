import type { TextStyle } from '@model/shapes'
import type { CSSProperties } from 'react'
import { linearGradientCSS } from './fillCSS'

/**
 * Returns a CSSProperties fragment for all extra text styling fields.
 * Spread this into any style object that renders text.
 * NOTE: Does NOT include gradient styles — use textGradientSpanCSS for those.
 */
export function textExtraCSS(
  text: Pick<TextStyle, 'textShadow' | 'lineHeight' | 'letterSpacing' | 'textDecoration' | 'textTransform' | 'textGradient' | 'fontVariantCaps'>
): CSSProperties {
  const result: CSSProperties = {}
  if (text.textShadow) {
    const { offsetX, offsetY, blur, color } = text.textShadow
    result.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
  }
  if (text.lineHeight != null) result.lineHeight = text.lineHeight
  if (text.letterSpacing != null) result.letterSpacing = `${text.letterSpacing}px`
  if (text.textDecoration && text.textDecoration !== 'none') result.textDecoration = text.textDecoration
  if (text.textTransform && text.textTransform !== 'none') result.textTransform = text.textTransform
  if (text.fontVariantCaps === 'small-caps') result.fontVariant = 'small-caps'
  return result
}

/**
 * Returns gradient CSS to apply to an inline <span> wrapping text content.
 * Using a <span> (inline element) ensures background-clip: text clips reliably.
 * Returns null when no gradient is set.
 */
export function textGradientSpanCSS(text: Pick<TextStyle, 'textGradient'>): CSSProperties | null {
  if (!text.textGradient) return null
  return {
    display: 'inline-block',
    background: linearGradientCSS(text.textGradient),
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    // translateZ(0) forces a dedicated GPU compositing layer, which causes the
    // browser to re-apply background-clip on every repaint instead of using a
    // stale cached clip when the gradient angle/stops change.
    transform: 'translateZ(0)',
  }
}

/** @deprecated use textExtraCSS */
export function textShadowCSS(text: Pick<TextStyle, 'textShadow'>): { textShadow?: string } {
  if (!text.textShadow) return {}
  const { offsetX, offsetY, blur, color } = text.textShadow
  return { textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}` }
}
