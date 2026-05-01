import type {FillStyle, LinearGradient} from '@model/shapes'

export function linearGradientCSS(gradient: LinearGradient): string {
    const stops = gradient.stops
        .map(s => `${s.color} ${Math.round(s.position * 100)}%`)
        .join(', ')
    return `linear-gradient(${gradient.angle}deg, ${stops})`
}

/**
 * Returns the CSS background value for a fill.
 * When a gradient is set it returns a linear-gradient(); otherwise returns the solid color.
 */
export function fillBackground(fill: FillStyle): string {
    if (fill.gradient) return linearGradientCSS(fill.gradient)
    return fill.color
}
