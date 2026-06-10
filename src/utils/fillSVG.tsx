import type {FillStyle, GradientFill, SketchFill} from '@model/shapes'
import type {ReactElement} from 'react'

export interface SvgFill {
    fillAttr: string
    opacity: number
    defs?: ReactElement
}

function linearGradientEl(id: string, fill: GradientFill): ReactElement {
    const stops = [...fill.stops].sort((a, b) => a.position - b.position)
    // Base gradient: x1=0.5,y1=1,x2=0.5,y2=0 = pointing upward (CSS 0deg = up)
    // gradientTransform rotates it to match CSS angle convention
    return (
        <linearGradient
            key={id}
            id={id}
            x1="0.5" y1="1" x2="0.5" y2="0"
            gradientUnits="objectBoundingBox"
            gradientTransform={fill.angle ? `rotate(${fill.angle}, 0.5, 0.5)` : undefined}
        >
            {stops.map((s, i) => (
                <stop key={i} offset={`${Math.round(s.position * 100)}%`} stopColor={s.color}/>
            ))}
        </linearGradient>
    )
}

function radialGradientEl(id: string, fill: GradientFill): ReactElement {
    const stops = [...fill.stops].sort((a, b) => a.position - b.position)
    return (
        <radialGradient key={id} id={id} cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
            {stops.map((s, i) => (
                <stop key={i} offset={`${Math.round(s.position * 100)}%`} stopColor={s.color}/>
            ))}
        </radialGradient>
    )
}

function hatchPatternEl(id: string, fill: SketchFill): ReactElement {
    const gap = Math.max(2, fill.hachureGap)
    return (
        <pattern
            key={id}
            id={id}
            width={gap}
            height={gap}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${fill.hachureAngle})`}
        >
            <line x1="0" y1="0" x2="0" y2={gap} stroke={fill.color} strokeWidth="1"/>
        </pattern>
    )
}

export function svgFill(fill: FillStyle, shapeId: string): SvgFill {
    switch (fill.type) {
        case 'color':
            return {fillAttr: fill.color, opacity: fill.opacity}

        case 'gradient': {
            const id = `fill-${shapeId}`
            if (fill.gradientType === 'radial') {
                return {fillAttr: `url(#${id})`, opacity: fill.opacity, defs: radialGradientEl(id, fill)}
            }
            // linear and conic — conic approximated as linear
            return {fillAttr: `url(#${id})`, opacity: fill.opacity, defs: linearGradientEl(id, fill)}
        }

        case 'sketch': {
            if (fill.fillStyle === 'none') return {fillAttr: 'none', opacity: fill.opacity}
            if (fill.fillStyle === 'hatched') {
                const id = `hatch-${shapeId}`
                return {fillAttr: `url(#${id})`, opacity: fill.opacity, defs: hatchPatternEl(id, fill)}
            }
            // solid sketch fill
            return {fillAttr: fill.color, opacity: fill.opacity}
        }
    }
}
