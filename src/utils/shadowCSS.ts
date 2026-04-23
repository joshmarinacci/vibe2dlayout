import type { CSSProperties } from 'react'
import type { BoxShadow } from '@model/shapes'

/**
 * Returns a CSSProperties fragment for box-shadow from a shape's boxShadow field.
 * Spread this into the outermost container div style.
 */
export function boxShadowCSS(shape: { boxShadow?: BoxShadow | null }): CSSProperties {
  if (!shape.boxShadow) return {}
  const { offsetX, offsetY, blur, spread, color, inset } = shape.boxShadow
  return {
    boxShadow: `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`,
  }
}
