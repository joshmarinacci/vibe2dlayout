import type {GradientDef} from '@model/document'

export function mergeUniqueById<T extends {id: string}>(primary: T[] = [], secondary: T[] = []): T[] {
    return [
        ...primary,
        ...secondary.filter(item => !primary.some(primaryItem => primaryItem.id === item.id)),
    ]
}

export function mergedGradients(documentGradients: GradientDef[] = [], libraryGradients: GradientDef[] = []): GradientDef[] {
    return mergeUniqueById(documentGradients, libraryGradients)
}
