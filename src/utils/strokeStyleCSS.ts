import type { CSSProperties } from 'react'
import type { StrokeStyle, CornerRadii } from '@model/shapes'

/**
 * Returns a CSS borderRadius value from a uniform cornerRadius and optional per-corner overrides.
 */
export function cornerRadiiCSS(uniform: number, radii?: CornerRadii | null): string | number {
  if (!radii) return uniform
  return `${radii.topLeft}px ${radii.topRight}px ${radii.bottomRight}px ${radii.bottomLeft}px`
}

export function dashToBorderStyle(dash: number[]): 'solid' | 'dashed' | 'dotted' {
  if (!dash || dash.length === 0) return 'solid'
  if (dash[0] <= 3) return 'dotted'
  return 'dashed'
}

/**
 * Returns CSS border properties derived from a StrokeStyle.
 * Use instead of the `border` shorthand so that dash arrays are reflected.
 */
export function strokeBorderCSS(stroke: StrokeStyle): CSSProperties {
  return {
    borderWidth: stroke.width,
    borderStyle: dashToBorderStyle(stroke.dash),
    borderColor: stroke.color,
  }
}
