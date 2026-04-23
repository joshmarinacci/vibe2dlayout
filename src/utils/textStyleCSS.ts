import type { TextStyle } from '@model/shapes'
import type { CSSProperties } from 'react'
import { linearGradientCSS } from './fillCSS'

/**
 * Returns a CSSProperties fragment for all extra text styling fields.
 * Spread this into any style object that renders text.
 */
export function textExtraCSS(
  text: Pick<TextStyle, 'textShadow' | 'lineHeight' | 'letterSpacing' | 'textDecoration' | 'textTransform' | 'textGradient'>
): CSSProperties {
  const result: CSSProperties = {}
  if (text.textShadow) {
    const { offsetX, offsetY, blur, color } = text.textShadow
    result.textShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}`
  }
  if (text.textGradient) {
    result.background = linearGradientCSS(text.textGradient)
    result.WebkitBackgroundClip = 'text'
    result.backgroundClip = 'text'
    result.WebkitTextFillColor = 'transparent'
    result.color = 'transparent'
  }
  if (text.lineHeight != null) result.lineHeight = text.lineHeight
  if (text.letterSpacing != null) result.letterSpacing = `${text.letterSpacing}px`
  if (text.textDecoration && text.textDecoration !== 'none') result.textDecoration = text.textDecoration
  if (text.textTransform && text.textTransform !== 'none') result.textTransform = text.textTransform
  return result
}

/** @deprecated use textExtraCSS */
export function textShadowCSS(text: Pick<TextStyle, 'textShadow'>): { textShadow?: string } {
  if (!text.textShadow) return {}
  const { offsetX, offsetY, blur, color } = text.textShadow
  return { textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}` }
}
