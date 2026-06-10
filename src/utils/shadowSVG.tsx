import type {BoxShadow} from '@model/shapes'
import type {ReactElement} from 'react'

export interface SvgShadow {
    filterId: string
    filterEl: ReactElement
}

/**
 * Converts BoxShadow array to an SVG <filter> element.
 * Returns null when there are no shadows.
 * Apply as filter="url(#filterId)" on the shape element.
 */
export function svgDropShadow(shadows: BoxShadow[] | undefined, shapeId: string): SvgShadow | null {
    if (!shadows?.length) return null

    const filterId = `shadow-${shapeId}`
    const outset = shadows.filter(s => !s.inset)
    const inset = shadows.filter(s => s.inset)

    const filterChildren: ReactElement[] = []

    // Build outset shadows
    outset.forEach((s, i) => {
        const resultName = `outset${i}`
        if (s.spread > 0) {
            filterChildren.push(
                <feMorphology key={`morph${i}`} in="SourceAlpha" operator="dilate" radius={s.spread} result={`morphed${i}`}/>,
                <feGaussianBlur key={`blur${i}`} in={`morphed${i}`} stdDeviation={s.blur / 2} result={`blurred${i}`}/>,
                <feFlood key={`flood${i}`} floodColor={s.color} result={`color${i}`}/>,
                <feComposite key={`comp${i}`} in={`color${i}`} in2={`blurred${i}`} operator="in" result={`shadow${i}`}/>,
                <feOffset key={`off${i}`} in={`shadow${i}`} dx={s.offsetX} dy={s.offsetY} result={resultName}/>,
            )
        } else {
            filterChildren.push(
                <feGaussianBlur key={`blur${i}`} in="SourceAlpha" stdDeviation={s.blur / 2} result={`blurred${i}`}/>,
                <feFlood key={`flood${i}`} floodColor={s.color} result={`color${i}`}/>,
                <feComposite key={`comp${i}`} in={`color${i}`} in2={`blurred${i}`} operator="in" result={`shadow${i}`}/>,
                <feOffset key={`off${i}`} in={`shadow${i}`} dx={s.offsetX} dy={s.offsetY} result={resultName}/>,
            )
        }
    })

    // Build inset shadows
    inset.forEach((s, i) => {
        const idx = outset.length + i
        const resultName = `inset${i}`
        // Inset: blur inside the shape boundary
        filterChildren.push(
            <feFlood key={`iflood${idx}`} floodColor={s.color} result={`icolor${idx}`}/>,
            <feComposite key={`icomp1${idx}`} in={`icolor${idx}`} in2="SourceAlpha" operator="in" result={`iclipped${idx}`}/>,
            <feGaussianBlur key={`iblur${idx}`} in={`iclipped${idx}`} stdDeviation={s.blur / 2} result={`iblurred${idx}`}/>,
            <feOffset key={`ioff${idx}`} in={`iblurred${idx}`} dx={s.offsetX} dy={s.offsetY} result={`ioffset${idx}`}/>,
            <feComposite key={`icomp2${idx}`} in={`ioffset${idx}`} in2="SourceAlpha" operator="in" result={resultName}/>,
        )
    })

    // Merge all shadows + SourceGraphic on top
    const mergeNodes: ReactElement[] = [
        ...outset.map((_, i) => <feMergeNode key={`mo${i}`} in={`outset${i}`}/>),
        ...inset.map((_, i) => <feMergeNode key={`mi${i}`} in={`inset${i}`}/>),
        <feMergeNode key="src" in="SourceGraphic"/>,
    ]

    const filterEl = (
        <filter
            key={filterId}
            id={filterId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
        >
            {filterChildren}
            <feMerge>{mergeNodes}</feMerge>
        </filter>
    )

    return {filterId, filterEl}
}
