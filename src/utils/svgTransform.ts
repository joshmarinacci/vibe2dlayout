import type {BoundingBox} from '@model/transform'

/**
 * Converts rotation/scale/skew from BoundingBox to an SVG transform attribute string.
 * The element is already positioned via style left/top, so only rotation/scale/skew go here.
 * Rotation uses rotate(deg, cx, cy) so it pivots around the element center.
 */
export function buildSvgTransform(t: BoundingBox): string | undefined {
    const cx = t.width / 2
    const cy = t.height / 2
    const parts: string[] = []
    if (t.rotation) parts.push(`rotate(${t.rotation}, ${cx}, ${cy})`)
    if (t.scaleX !== undefined && t.scaleX !== 1) {
        // Scale around center: translate to center, scale, translate back
        parts.push(`translate(${cx}, ${cy}) scale(${t.scaleX}, 1) translate(${-cx}, ${-cy})`)
    }
    if (t.scaleY !== undefined && t.scaleY !== 1) {
        parts.push(`translate(${cx}, ${cy}) scale(1, ${t.scaleY}) translate(${-cx}, ${-cy})`)
    }
    if (t.skewX) parts.push(`skewX(${t.skewX})`)
    if (t.skewY) parts.push(`skewY(${t.skewY})`)
    return parts.length > 0 ? parts.join(' ') : undefined
}
