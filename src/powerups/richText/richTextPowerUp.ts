import type {RichTextShape} from '@model/shapes'
import {shapeRegistry} from '@powerups/shapeRegistry'
import type {PowerUpDefinition, PowerUpShapeTypeDefinition, ShapeRenderProps, ShapePropertiesProps} from '@powerups/types'
import {generateId} from '@utils/idgen'
import {FileText} from 'lucide-react'
import {createElement} from 'react'
import {DEFAULT_STYLE_SET, DEFAULT_STYLE_SET_ID} from './defaultStyleSet'
import {RichTextRenderer} from './RichTextRenderer'
import {RichTextPropsRenderer} from './RichTextPropsRenderer'

function makeDefaultRichTextShape(x: number, y: number): RichTextShape {
    return {
        id: generateId(),
        name: 'Rich Text',
        type: 'rich-text',
        locked: false,
        visible: true,
        content: '# Heading\n\nAdd your **markdown** content here.\n\n- Item one\n- Item two\n\n> A blockquote',
        styleSetId: DEFAULT_STYLE_SET_ID,
        padding: 12,
        transform: {x, y, width: 320, height: 220, rotation: 0},
    }
}

const RICH_TEXT_SHAPE_TYPE: PowerUpShapeTypeDefinition = {
    type: 'rich-text',
    name: 'Rich Text',
    toolMode: 'insert-rich-text',
    icon: createElement(FileText, {size: 14}),
    category: 'shapes',
    isTextEditable: true,
    createDefault: makeDefaultRichTextShape,
    renderShape: (props: ShapeRenderProps) => createElement(RichTextRenderer, props),
    renderProperties: (props: ShapePropertiesProps) => createElement(RichTextPropsRenderer, props),
}

export const RICH_TEXT_POWER_UP: PowerUpDefinition = {
    id: 'powerup.rich-text',
    name: 'Rich Text',
    version: 1,
    createDefaultDocumentSettings: () => ({
        styleSets: [DEFAULT_STYLE_SET],
        defaultStyleSetId: DEFAULT_STYLE_SET_ID,
    }),
    lifecycle: {
        onLoad: async () => { shapeRegistry.register([RICH_TEXT_SHAPE_TYPE]) },
        onUnload: async () => { shapeRegistry.unregister(['rich-text']) },
    },
}
