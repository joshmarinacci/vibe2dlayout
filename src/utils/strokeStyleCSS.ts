import type {ColorStroke, CornerRadii, StrokeStyle} from '@model/shapes'
import type {CSSProperties} from 'react'

export function cornerRadiiCSS(uniform: number, radii?: CornerRadii | null): string | number {
    if (!radii) return uniform
    return `${radii.topLeft}px ${radii.topRight}px ${radii.bottomRight}px ${radii.bottomLeft}px`
}

function dashToBorderStyle(dash: number[]): 'solid' | 'dashed' | 'dotted' {
    if (!dash || dash.length === 0) return 'solid'
    if (dash[0] <= 3) return 'dotted'
    return 'dashed'
}

export function strokeBorderCSS(stroke: StrokeStyle): CSSProperties {
    if (stroke.type === 'none') return {borderStyle: 'none', borderWidth: 0}
    if (stroke.type === 'gradient') {
        // CSS mask technique renders the visible stroke; no CSS border needed
        return {borderWidth: 0}
    }
    if (stroke.type === 'sketch') {
        return {borderWidth: stroke.width, borderStyle: 'solid', borderColor: stroke.color}
    }
    const cs = stroke as ColorStroke
    return {
        borderWidth: cs.width,
        borderStyle: cs.type === 'dashed' ? dashToBorderStyle(cs.dash) : 'solid',
        borderColor: cs.color,
    }
}
