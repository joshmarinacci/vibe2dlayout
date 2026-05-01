import type {BoxShadow} from '@model/shapes'
import type {CSSProperties} from 'react'

/**
 * Returns a CSSProperties fragment for box-shadow from a shape's boxShadow array.
 * Spread this into the outermost container div style.
 */
export function boxShadowCSS(shape: { boxShadow?: BoxShadow[] }): CSSProperties {
    if (!shape.boxShadow?.length) return {}
    return {
        boxShadow: shape.boxShadow
            .map(({offsetX, offsetY, blur, spread, color, inset}) =>
                `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${spread}px ${color}`)
            .join(', '),
    }
}
