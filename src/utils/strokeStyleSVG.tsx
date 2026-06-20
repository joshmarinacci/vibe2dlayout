import type {CornerRadii, GradientStroke, StrokeStyle} from '@model/shapes'
import type {ReactElement} from 'react'

export interface SvgStroke {
    stroke: string
    strokeWidth: number
    strokeDasharray?: string
    strokeOpacity: number
    defs?: ReactElement
}

function gradientStrokeEl(id: string, gs: GradientStroke, width: number, height: number): ReactElement {
    const stops = [...gs.stops].sort((a, b) => a.position - b.position)
    const span = Math.max(0.01, gs.span ?? 1)
    const spanPx = span * 100
    const halfSpan = spanPx / 2
    if (gs.gradientType === 'radial') {
        return (
            <radialGradient
                key={id}
                id={id}
                cx={width / 2}
                cy={height / 2}
                r={Math.max(1, spanPx / 2)}
                gradientUnits="userSpaceOnUse"
                spreadMethod={gs.spreadMethod ?? 'pad'}
            >
                {stops.map((s, i) => (
                    <stop key={i} offset={`${Math.round(s.position * 100)}%`} stopColor={s.color}/>
                ))}
            </radialGradient>
        )
    }
    return (
        <linearGradient
            key={id}
            id={id}
            x1={width / 2}
            y1={height / 2 + halfSpan}
            x2={width / 2}
            y2={height / 2 - halfSpan}
            gradientUnits="userSpaceOnUse"
            gradientTransform={gs.angle ? `rotate(${gs.angle}, ${width / 2}, ${height / 2})` : undefined}
            spreadMethod={gs.spreadMethod ?? 'pad'}
        >
            {stops.map((s, i) => (
                <stop key={i} offset={`${Math.round(s.position * 100)}%`} stopColor={s.color}/>
            ))}
        </linearGradient>
    )
}

export function svgStroke(stroke: StrokeStyle, shapeId: string, width: number, height: number): SvgStroke {
    if (stroke.type === 'none') {
        return {stroke: 'none', strokeWidth: 0, strokeOpacity: 0}
    }

    if (stroke.type === 'gradient') {
        const id = `stroke-${shapeId}`
        return {
            stroke: `url(#${id})`,
            strokeWidth: stroke.width,
            strokeOpacity: stroke.opacity,
            defs: gradientStrokeEl(id, stroke, width, height),
        }
    }

    if (stroke.type === 'sketch') {
        return {stroke: stroke.color, strokeWidth: stroke.width, strokeOpacity: stroke.opacity}
    }

    // Only apply dasharray when type is explicitly 'dashed' — type:'solid' strokes with
    // non-empty dash arrays (e.g. the app default) must render as solid lines.
    const dasharray = stroke.type === 'dashed' && stroke.dash?.length > 0 ? stroke.dash.join(' ') : undefined
    return {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        strokeDasharray: dasharray,
        strokeOpacity: stroke.opacity,
    }
}

/**
 * Builds an SVG path `d` string for a rectangle with per-corner border radii.
 * All radii are clamped so they don't overlap each other.
 */
export function cornerRadiiPath(x: number, y: number, w: number, h: number, radii: CornerRadii): string {
    const maxR = Math.min(w, h) / 2
    const tl = Math.min(radii.topLeft, maxR)
    const tr = Math.min(radii.topRight, maxR)
    const br = Math.min(radii.bottomRight, maxR)
    const bl = Math.min(radii.bottomLeft, maxR)
    return [
        `M ${x + tl},${y}`,
        `H ${x + w - tr}`,
        tr > 0 ? `A ${tr},${tr} 0 0 1 ${x + w},${y + tr}` : '',
        `V ${y + h - br}`,
        br > 0 ? `A ${br},${br} 0 0 1 ${x + w - br},${y + h}` : '',
        `H ${x + bl}`,
        bl > 0 ? `A ${bl},${bl} 0 0 1 ${x},${y + h - bl}` : '',
        `V ${y + tl}`,
        tl > 0 ? `A ${tl},${tl} 0 0 1 ${x + tl},${y}` : '',
        'Z',
    ].filter(Boolean).join(' ')
}
