import type {FillStyle, GradientFill, SketchFill} from '@model/shapes'
import type {ReactElement} from 'react'

export interface SvgFill {
    fillAttr: string
    opacity: number
    defs?: ReactElement
}

function linearGradientEl(id: string, fill: GradientFill, width: number, height: number): ReactElement {
    const stops = [...fill.stops].sort((a, b) => a.position - b.position)
    const span = Math.max(0.01, fill.span ?? 1)
    const spanPx = span * 100
    const halfSpan = spanPx / 2
    // Base gradient: x1=0.5,y1=1,x2=0.5,y2=0 = pointing upward (CSS 0deg = up)
    // gradientTransform rotates it to match CSS angle convention
    return (
        <linearGradient
            key={id}
            id={id}
            x1={width / 2}
            y1={height / 2 + halfSpan}
            x2={width / 2}
            y2={height / 2 - halfSpan}
            gradientUnits="userSpaceOnUse"
            gradientTransform={fill.angle ? `rotate(${fill.angle}, ${width / 2}, ${height / 2})` : undefined}
            spreadMethod={fill.spreadMethod ?? 'pad'}
        >
            {stops.map((s, i) => (
                <stop key={i} offset={`${Math.round(s.position * 100)}%`} stopColor={s.color}/>
            ))}
        </linearGradient>
    )
}

function radialGradientEl(id: string, fill: GradientFill, width: number, height: number): ReactElement {
    const stops = [...fill.stops].sort((a, b) => a.position - b.position)
    const span = Math.max(0.01, fill.span ?? 1)
    const radius = Math.max(1, span * 50)
    return (
        <radialGradient
            key={id}
            id={id}
            cx={width / 2}
            cy={height / 2}
            r={radius}
            gradientUnits="userSpaceOnUse"
            spreadMethod={fill.spreadMethod ?? 'pad'}
        >
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

export function svgFill(fill: FillStyle, shapeId: string, width: number, height: number): SvgFill {
    switch (fill.type) {
        case 'color':
            return {fillAttr: fill.color, opacity: fill.opacity}

        case 'gradient': {
            const id = `fill-${shapeId}`
            if (fill.gradientType === 'radial') {
                return {fillAttr: `url(#${id})`, opacity: fill.opacity, defs: radialGradientEl(id, fill, width, height)}
            }
            // linear and conic — conic approximated as linear
            return {fillAttr: `url(#${id})`, opacity: fill.opacity, defs: linearGradientEl(id, fill, width, height)}
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
