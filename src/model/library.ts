import type {CustomFont, GradientDef} from './document'
import type {DimensionAsset} from './dimensionAsset'
import type {ImageAsset} from './imageAsset'

export interface Library {
    version: 2
    gradients: GradientDef[]
    images: ImageAsset[]
    dimensions: DimensionAsset[]
    fonts: CustomFont[]
}

export const EMPTY_LIBRARY: Library = {
    version: 2,
    gradients: [],
    images: [],
    dimensions: [],
    fonts: [],
}
