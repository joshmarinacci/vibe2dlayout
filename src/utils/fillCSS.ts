import type {FillStyle, GradientFill, SketchFill} from '@model/shapes'

export function gradientCSS(fill: GradientFill): string {
    const stops = fill.stops
        .map(s => `${s.color} ${Math.round(s.position * 100)}%`)
        .join(', ')
    switch (fill.gradientType) {
        case 'linear': return `linear-gradient(${fill.angle}deg, ${stops})`
        case 'radial':  return `radial-gradient(circle, ${stops})`
        case 'conic':   return `conic-gradient(from ${fill.angle}deg, ${stops})`
    }
}

export function sketchFillCSS(fill: SketchFill): string {
    if (fill.fillStyle === 'none') return 'transparent'
    if (fill.fillStyle === 'hatched') {
        const gap = Math.max(2, fill.hachureGap)
        return `repeating-linear-gradient(${fill.hachureAngle}deg, ${fill.color}, ${fill.color} 1px, transparent 1px, transparent ${gap}px)`
    }
    return fill.color
}

export function fillBackground(fill: FillStyle): string {
    switch (fill.type) {
        case 'color':    return fill.color
        case 'gradient': return gradientCSS(fill)
        case 'sketch':   return sketchFillCSS(fill)
    }
}
