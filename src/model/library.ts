import type {CustomFont, GradientDef, TreeNode} from './document'
import type {DimensionAsset} from './dimensionAsset'
import type {ImageAsset} from './imageAsset'
import type {Shape} from './shapes'

export interface ShapeTemplate {
    id: string
    name: string
    rootNode: TreeNode
    shapes: Record<string, Shape>
}

export interface PageTemplate {
    id: string
    name: string
    rootNode: TreeNode
    shapes: Record<string, Shape>
}

export interface Library {
    version: 3
    gradients: GradientDef[]
    images: ImageAsset[]
    dimensions: DimensionAsset[]
    fonts: CustomFont[]
    shapeTemplates: ShapeTemplate[]
    pageTemplates: PageTemplate[]
}

export const EMPTY_LIBRARY: Library = {
    version: 3,
    gradients: [],
    images: [],
    dimensions: [],
    fonts: [],
    shapeTemplates: [],
    pageTemplates: [],
}
