import type {GradientDef} from '@model/document'

export const GRADIENT_ANGLE_MIN = -360
export const GRADIENT_ANGLE_MAX = 360

export function clampGradientAngle(angle: number): number {
    if (!Number.isFinite(angle)) return 0
    return Math.max(GRADIENT_ANGLE_MIN, Math.min(GRADIENT_ANGLE_MAX, angle))
}

export function mergeUniqueById<T extends {id: string}>(primary: T[] = [], secondary: T[] = []): T[] {
    return [
        ...primary,
        ...secondary.filter(item => !primary.some(primaryItem => primaryItem.id === item.id)),
    ]
}

export function mergedGradients(documentGradients: GradientDef[] = [], libraryGradients: GradientDef[] = []): GradientDef[] {
    return mergeUniqueById(documentGradients, libraryGradients)
}
