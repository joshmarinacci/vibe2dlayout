import type {FillStyle, GradientFill, SketchFill} from '@model/shapes'

function gradientStopsCSS(fill: GradientFill): string {
    return [...fill.stops]
        .sort((a, b) => a.position - b.position)
        .map(s => `${s.color} ${Math.round(s.position * 100)}%`)
        .join(', ')
}

function gradientSvgDataUrl(fill: GradientFill, stops: string[]): string {
    const spreadMethod = fill.spreadMethod ?? 'pad'
    const span = Math.max(0.01, fill.span ?? 1)
    const spanPx = span * 100
    const stopTags = stops.join('')
    const svg = fill.gradientType === 'radial'
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50" cy="50" r="${Math.max(1, spanPx / 2)}" gradientUnits="userSpaceOnUse" spreadMethod="${spreadMethod}">${stopTags}</radialGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="50" y1="${50 + spanPx / 2}" x2="50" y2="${50 - spanPx / 2}" gradientUnits="userSpaceOnUse" spreadMethod="${spreadMethod}">${stopTags}</linearGradient></defs><rect width="100" height="100" fill="url(#g)"/></svg>`
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`
}

export function gradientCSS(fill: GradientFill): string {
    const stops = gradientStopsCSS(fill)
    const stopsSvg = [...fill.stops]
        .sort((a, b) => a.position - b.position)
        .map(s => `<stop offset="${Math.round(s.position * 100)}%" stop-color="${s.color}"/>`)
    if ((fill.spreadMethod === 'repeat' || fill.spreadMethod === 'reflect') || (fill.span ?? 1) !== 1) {
        return gradientSvgDataUrl(fill, stopsSvg)
    }
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
