import type { TextStyle } from '@model/shapes'

/**
 * Returns a CSSProperties fragment for text-shadow from a TextStyle.
 * Spread this into any style object that renders text.
 */
export function textShadowCSS(text: Pick<TextStyle, 'textShadow'>): { textShadow?: string } {
  if (!text.textShadow) return {}
  const { offsetX, offsetY, blur, color } = text.textShadow
  return { textShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}` }
}
