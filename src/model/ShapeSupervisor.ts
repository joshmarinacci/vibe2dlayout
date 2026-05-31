import type {Shape} from "src/model/shapes.ts";
import type {AppState} from "src/store/types.ts";

class ShapeSupervisorImpl {
    constructor() {
    }

    constraintedResizeAspectRatio(shape: Shape, state: AppState):number {
        if (shape?.type === 'image') {
            const asset = state.document.images.find(a => a.id === shape.assetId)
            if (asset?.width && asset?.height) {
                const crop = shape.crop
                const cropW = crop ? asset.width  * crop.width  : asset.width
                const cropH = crop ? asset.height * crop.height : asset.height
                return cropW / cropH
            }
        }
        return 1
    }

    hasFill(shape: Shape): boolean {
        return 'fill' in shape;
    }
    hasStroke(shape: Shape): boolean {
        return 'stroke' in shape;
    }

    hasTransform(shape: Shape): boolean {
        return 'transform' in shape;
    }

    hasText(shape: Shape): boolean {
        return 'text' in shape
    }
    hasCornerRadius(shape:Shape):boolean {
        return 'cornerRadius' in shape
    }

}

export const ShapeSupervisor = new ShapeSupervisorImpl()