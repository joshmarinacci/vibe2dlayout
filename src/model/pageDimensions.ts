import type {DimensionAsset} from './dimensionAsset'

export interface BuiltInPageDimension {
    id: string
    name: string
    width: number
    height: number
}

export type PageSizeSpec =
    | { kind: 'preset'; presetId: string }
    | { kind: 'custom'; width: number; height: number }
    | { kind: 'asset'; scope: 'document' | 'library'; assetId: string }

export const BUILTIN_PAGE_DIMENSIONS: BuiltInPageDimension[] = [
    {id: 'presentation-4-3', name: 'Presentation 4:3', width: 800, height: 600},
    {id: 'presentation-16-9', name: 'Presentation 16:9', width: 1280, height: 720},
    {id: 'letter', name: 'Letter', width: 816, height: 1056},
    {id: 'a4', name: 'A4', width: 794, height: 1123},
    {id: 'square', name: 'Square', width: 1000, height: 1000},
]

export const DEFAULT_PAGE_DIMENSION_ID = BUILTIN_PAGE_DIMENSIONS[0].id

export function findBuiltInPageDimension(id: string): BuiltInPageDimension | null {
    return BUILTIN_PAGE_DIMENSIONS.find(d => d.id === id) ?? null
}

export function resolvePageSize(
    pageSize: PageSizeSpec | null | undefined,
    documentDimensions: DimensionAsset[],
    libraryDimensions: DimensionAsset[],
): { width: number; height: number } | null {
    if (!pageSize) return null
    if (pageSize.kind === 'preset') {
        const preset = findBuiltInPageDimension(pageSize.presetId)
        return preset ? {width: preset.width, height: preset.height} : null
    }
    if (pageSize.kind === 'custom') {
        return {width: pageSize.width, height: pageSize.height}
    }
    const assets = pageSize.scope === 'document' ? documentDimensions : libraryDimensions
    const asset = assets.find(a => a.id === pageSize.assetId)
    return asset ? {width: asset.width, height: asset.height} : null
}

export function pageSizeLabel(pageSize: PageSizeSpec | null | undefined): string {
    if (!pageSize) return 'Infinite'
    if (pageSize.kind === 'preset') {
        return findBuiltInPageDimension(pageSize.presetId)?.name ?? 'Preset'
    }
    if (pageSize.kind === 'custom') {
        return `Custom ${pageSize.width}×${pageSize.height}`
    }
    return pageSize.scope === 'document' ? 'Document Dimension' : 'Library Dimension'
}
