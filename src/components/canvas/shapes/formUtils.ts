import type {FormShape} from "@model/shapes.ts";
import {roughRect, seedFromId} from "@utils/roughPaths.ts";

export function makeRoughRect(shape: FormShape) {
    const pad = 2
    const seed = seedFromId(shape.id)
    const transform = shape.transform
    const {width, height} = transform
    const {fill, stroke} = shape
    return roughRect(pad, pad, width - pad * 2, height - pad * 2, {
        seed,
        roughness: 1.4,
        bowing: 1,
        fill: fill.color === 'transparent' ? undefined : fill.color,
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    })
}