import type {BoundingBox} from '@model/transform'

export interface GuideLines {
    x: number | null  // canvas-space X of a vertical guide line
    y: number | null  // canvas-space Y of a horizontal guide line
}

export interface AlignSnapResult {
    snappedDx: number
    snappedDy: number
    guides: GuideLines
}

function snapEdges(b: BoundingBox) {
    return {
        left: b.x,
        centerX: b.x + b.width / 2,
        right: b.x + b.width,
        top: b.y,
        centerY: b.y + b.height / 2,
        bottom: b.y + b.height,
    }
}

/**
 * Compute the union bounding box of an array of boxes.
 */
export function unionOfBoxes(boxes: BoundingBox[]): BoundingBox {
    if (boxes.length === 0) return {x: 0, y: 0, width: 0, height: 0, rotation: 0}
    const left = Math.min(...boxes.map(b => b.x))
    const top = Math.min(...boxes.map(b => b.y))
    const right = Math.max(...boxes.map(b => b.x + b.width))
    const bottom = Math.max(...boxes.map(b => b.y + b.height))
    return {x: left, y: top, width: right - left, height: bottom - top, rotation: 0}
}

/**
 * Given the candidate (would-be) bounding box of the dragged shape(s) after rawDelta is applied,
 * find the closest alignment snap with any reference shape or user guide line.
 *
 * Returns adjusted deltas so that the shape snaps to the aligned position, plus guide line positions.
 * X and Y axes are snapped independently.
 *
 * @param candidateBox  Union of dragged shapes' absolute bounds AFTER rawDelta applied
 * @param referenceBoxes  Absolute bounds of non-dragged reference shapes
 * @param rawDx  Raw drag delta X (canvas space)
 * @param rawDy  Raw drag delta Y (canvas space)
 * @param threshold  Snap zone in canvas pixels (e.g. 8 / zoom)
 * @param xGuides  Extra vertical snap lines (user guides / page bounds) — canvas-space x positions
 * @param yGuides  Extra horizontal snap lines (user guides / page bounds) — canvas-space y positions
 */
export function computeAlignmentSnap(
    candidateBox: BoundingBox,
    referenceBoxes: BoundingBox[],
    rawDx: number,
    rawDy: number,
    threshold: number,
    xGuides: number[] = [],
    yGuides: number[] = [],
): AlignSnapResult {
    const ce = snapEdges(candidateBox)
    const candidateXs = [ce.left, ce.centerX, ce.right]
    const candidateYs = [ce.top, ce.centerY, ce.bottom]

    let bestXDelta = 0
    let bestXGuide: number | null = null
    let bestXDist = threshold

    let bestYDelta = 0
    let bestYGuide: number | null = null
    let bestYDist = threshold

    for (const ref of referenceBoxes) {
        const re = snapEdges(ref)
        const refXs = [re.left, re.centerX, re.right]
        const refYs = [re.top, re.centerY, re.bottom]

        for (const cx of candidateXs) {
            for (const rx of refXs) {
                const diff = rx - cx
                const dist = Math.abs(diff)
                if (dist <= bestXDist) {
                    bestXDist = dist
                    bestXDelta = diff
                    bestXGuide = rx
                }
            }
        }

        for (const cy of candidateYs) {
            for (const ry of refYs) {
                const diff = ry - cy
                const dist = Math.abs(diff)
                if (dist <= bestYDist) {
                    bestYDist = dist
                    bestYDelta = diff
                    bestYGuide = ry
                }
            }
        }
    }

    // Also snap against user guide lines and page boundaries
    for (const gx of xGuides) {
        for (const cx of candidateXs) {
            const diff = gx - cx
            const dist = Math.abs(diff)
            if (dist <= bestXDist) {
                bestXDist = dist
                bestXDelta = diff
                bestXGuide = gx
            }
        }
    }

    for (const gy of yGuides) {
        for (const cy of candidateYs) {
            const diff = gy - cy
            const dist = Math.abs(diff)
            if (dist <= bestYDist) {
                bestYDist = dist
                bestYDelta = diff
                bestYGuide = gy
            }
        }
    }

    return {
        snappedDx: rawDx + bestXDelta,
        snappedDy: rawDy + bestYDelta,
        guides: {
            x: bestXGuide,
            y: bestYGuide,
        },
    }
}
