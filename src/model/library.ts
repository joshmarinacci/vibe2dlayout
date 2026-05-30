import type {CustomFont, GradientDef} from './document'
import type {ImageAsset} from './imageAsset'

export interface Library {
    version: 1
    gradients: GradientDef[]
    images: ImageAsset[]
    fonts: CustomFont[]
}

export const EMPTY_LIBRARY: Library = {
    version: 1,
    gradients: [],
    images: [],
    fonts: [],
}
