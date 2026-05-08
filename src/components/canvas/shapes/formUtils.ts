import {fillColor} from '@model/shapes'
import type {FormShape} from "@model/shapes.ts";
import {roughRect, seedFromId} from "@utils/roughPaths.ts";

export function makeRoughRect(shape: FormShape) {
    const pad = 2
    const seed = seedFromId(shape.id)
    const transform = shape.transform
    const {width, height} = transform
    const {fill, stroke} = shape
    const color = fillColor(fill)
    const isSketch = fill.type === 'sketch'
    return roughRect(pad, pad, width - pad * 2, height - pad * 2, {
        seed,
        roughness: 1.4,
        bowing: 1,
        fill: color === 'transparent' ? undefined : color,
        fillStyle: isSketch && fill.fillStyle === 'hatched' ? 'hachure' : 'solid',
        fillWeight: 1,
        hachureAngle: isSketch ? fill.hachureAngle : 45,
        hachureGap: isSketch ? fill.hachureGap : 4,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    })
}
