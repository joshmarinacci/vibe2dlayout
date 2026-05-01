export type Anchor =
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface Point {
    x: number
    y: number
}

export interface BoundingBox {
    x: number       // top-left x in parent-local coords
    y: number       // top-left y in parent-local coords
    width: number
    height: number
    rotation: number  // degrees, around bbox center
    scaleX?: number   // multiplicative, 1 = 100%
    scaleY?: number   // multiplicative, 1 = 100%
    skewX?: number    // degrees
    skewY?: number    // degrees
}

/** Build a CSS transform string from all active 2D transform fields. */
export function buildCSSTransform(t: BoundingBox): string | undefined {
    const parts: string[] = []
    if (t.rotation) parts.push(`rotate(${t.rotation}deg)`)
    if (t.scaleX !== undefined && t.scaleX !== 1) parts.push(`scaleX(${t.scaleX})`)
    if (t.scaleY !== undefined && t.scaleY !== 1) parts.push(`scaleY(${t.scaleY})`)
    if (t.skewX) parts.push(`skewX(${t.skewX}deg)`)
    if (t.skewY) parts.push(`skewY(${t.skewY}deg)`)
    return parts.length > 0 ? parts.join(' ') : undefined
}
