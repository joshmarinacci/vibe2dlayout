import type {ConnectorEndpoint, ConnectorRoute} from './connector'
import type {GridSettings} from './grid'
import type {CanvasGuide} from './guide'
import type {ShapePowerUpEntry} from './powerUps'
import type {PageSizeSpec} from './pageDimensions'
import type {BoundingBox} from './transform'

// ─── Shared style types ───────────────────────────────────────────────────

export interface GradientStop {
    color: string
    position: number         // 0–1
    paletteColorId?: string
}

export type GradientSpreadMethod = 'pad' | 'repeat' | 'reflect'

export interface ColorFill {
    type: 'color'
    color: string
    opacity: number          // 0–1
    paletteColorId?: string
}

export interface GradientFill {
    type: 'gradient'
    gradientType: 'linear' | 'radial' | 'conic'
    angle: number            // degrees; radial ignores it
    stops: GradientStop[]
    opacity: number          // 0–1
    gradientId?: string      // links to VibeDocument.gradients[]
    spreadMethod?: GradientSpreadMethod
    span?: number            // fraction of the object covered by one gradient cycle, default 1
}

export interface SketchFill {
    type: 'sketch'
    color: string
    fillStyle: 'solid' | 'hatched' | 'none'
    hachureAngle: number     // degrees, default 45
    hachureGap: number       // px, default 4
    opacity: number          // 0–1
    sketchStyleId?: string   // links to VibeDocument.sketchStyles[]
}

export type FillStyle = ColorFill | GradientFill | SketchFill

/** Extract a single representative color from any fill type (used by rough.js). */
export function fillColor(fill: FillStyle): string {
    if (fill.type === 'gradient') return fill.stops[0]?.color ?? 'transparent'
    return fill.color
}

export interface CornerRadii {
    topLeft: number
    topRight: number
    bottomRight: number
    bottomLeft: number
}

export interface BoxShadow {
    offsetX: number
    offsetY: number
    blur: number
    spread: number
    color: string
    inset?: boolean
}

export interface ColorStroke {
    type: 'solid' | 'dashed' | 'none'
    color: string
    width: number
    dash: number[]   // [] = solid, [5,3] = dashed
    opacity: number
    paletteColorId?: string
}

export interface GradientStroke {
    type: 'gradient'
    gradientType: 'linear' | 'radial' | 'conic'
    angle: number            // degrees; radial ignores it
    stops: GradientStop[]
    width: number
    opacity: number
    gradientId?: string      // links to VibeDocument.gradients[]
    spreadMethod?: GradientSpreadMethod
    span?: number            // fraction of the object covered by one gradient cycle, default 1
}

export interface SketchStroke {
    type: 'sketch'
    color: string
    width: number
    opacity: number
}

export type StrokeStyle = ColorStroke | GradientStroke | SketchStroke

/** Extract a single representative color from any stroke type. */
export function strokeColor(stroke: StrokeStyle): string {
    if (stroke.type === 'gradient') return stroke.stops[0]?.color ?? '#000000'
    return stroke.color
}

export type FontWeight =
    'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'

export type TextStrokeStyle = {
    width: number
    color: string
}

export interface TextStyle {
    content: string
    fontFamily: string
    fontSize: number
    fontWeight: FontWeight
    fontStyle: 'normal' | 'italic'
    color: string
    paletteColorId?: string
    align: 'left' | 'center' | 'right'
    verticalAlign: 'top' | 'middle' | 'bottom'
    textShadow?: { offsetX: number; offsetY: number; blur: number; color: string } | null
    textGradient?: GradientFill | null        // gradient fill for text characters
    textStrokeGradient?: GradientFill | null  // gradient for text outline stroke
    lineHeight?: number        // CSS multiplier, e.g. 1.5 (undefined = browser default)
    letterSpacing?: number     // pixels
    textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through'
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
    fontVariantCaps?: 'normal' | 'small-caps'
    fontVariationSettings?: Record<string, number>  // e.g. { wght: 600, wdth: 75 }
    stroke?: TextStrokeStyle,
}

export type ArrowType = 'none' | 'arrow' | 'circle' | 'diamond'
export type MimeType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | 'image/svg+xml'

// ─── Shape base ───────────────────────────────────────────────────────────

interface ShapeBase {
    id: string
    name: string
    locked: boolean
    visible: boolean
    boxShadow?: BoxShadow[]
    powerUps?: ShapePowerUpEntry[]
}

export interface FilledShape {
    fill: FillStyle
}

export interface StrokedShape {
    stroke: StrokeStyle
}

export interface TransformedShape {
    transform: BoundingBox
}

export interface ShapeWithText {
    text: TextStyle
}

export interface ShapeWithCorners {
    cornerRadius: number
    cornerRadii?: CornerRadii
}

// ─── Concrete shape types ─────────────────────────────────────────────────

export interface RectShape extends ShapeBase, FilledShape, StrokedShape, TransformedShape, ShapeWithCorners {
    type: 'rect'
}

export interface CircleShape extends ShapeBase, FilledShape, StrokedShape, TransformedShape {
    type: 'circle'
}

export interface LineShape extends ShapeBase, StrokedShape {
    type: 'line'
    start: ConnectorEndpoint
    end: ConnectorEndpoint
    route: ConnectorRoute
    stroke: StrokeStyle
    startArrow: ArrowType
    endArrow: ArrowType
}

export interface BoxShape extends ShapeBase, StrokedShape, TransformedShape, FilledShape {

}


export interface TextShape extends ShapeBase, TransformedShape, FilledShape, ShapeWithText {
    type: 'text'
}

export interface ImageCrop {
    x: number       // 0–1 fraction of image width, left edge of visible region
    y: number       // 0–1 fraction of image height, top edge of visible region
    width: number   // 0–1 fraction of image width, size of visible region
    height: number  // 0–1 fraction of image height, size of visible region
}

export interface ImageShape extends ShapeBase, TransformedShape {
    type: 'image'
    src: string      // base64 data URI or http(s) URL
    mimeType: MimeType
    preserveAspectRatio: boolean
    opacity: number
    assetId?: string  // references ImageAsset.id in document.images
    crop?: ImageCrop
}

export interface PageShape extends ShapeBase, TransformedShape {
    type: 'page'
    fixedSize: { width: number; height: number } | null  // null = infinite
    pageSize: PageSizeSpec | null
    background: string  // CSS color
    backgroundPaletteColorId?: string
    clipChildren: boolean
    gridSettings?: Partial<GridSettings>  // overrides document-level grid settings
    guides?: CanvasGuide[]               // persistent user-placed guide lines
}

// ─── Composite UI shapes ──────────────────────────────────────────────────

export interface FormShape extends ShapeBase, TransformedShape, FilledShape, StrokedShape {
}

export interface ButtonShape extends FormShape, ShapeWithText {
    type: 'button'
    cornerRadius: number
    cornerRadii?: CornerRadii
    icon: { name: string; side: 'left' | 'right' } | null
}

export interface IconShape extends FormShape {
    type: 'icon'
    icon: { name: string }
}

export interface PanelShape extends FormShape, ShapeWithText {
    type: 'panel'
    cornerRadius: number
    cornerRadii?: CornerRadii
    clipChildren: boolean
}

export interface TabbedPanelShape extends FormShape, ShapeWithText {
    type: 'tabbed-panel'
    cornerRadius: number
    cornerRadii?: CornerRadii
    activeTab: number // 0-indexed
    clipChildren: boolean
}

export interface SliderShape extends FormShape {
    type: 'slider'
    value: number       // 0–1 normalized
    ticks: number       // 0 = none, n = number of tick marks
    thumbFill: FillStyle
}

export interface LabelShape extends FormShape {
    type: 'label'
    transform: BoundingBox
    text: TextStyle
}

export interface TextFieldShape extends FormShape {
    type: 'textfield'
    placeholder: string
    text: TextStyle     // content = displayed value; empty = show placeholder
}

export interface CheckboxShape extends FormShape {
    type: 'checkbox'
    checked: boolean
    text: TextStyle
}

export interface ToggleShape extends FormShape {
    type: 'toggle'
    checked: boolean
    text: TextStyle
    thumbFill: FillStyle
}

export interface FrameShape extends FormShape {
    type: 'frame'
    cornerRadius: number
    cornerRadii?: CornerRadii
    clipChildren: boolean
}

export interface DialogShape extends FormShape {
    type: 'dialog'
    title: string
    okLabel: string
    cancelLabel: string
    text: TextStyle
}

export interface RadioShape extends FormShape {
    type: 'radio'
    checked: boolean
    text: TextStyle
}

export interface SelectShape extends FormShape {
    type: 'select'
    value: string
    placeholder: string
    text: TextStyle
}

export interface ProgressShape extends FormShape {
    type: 'progress'
    value: number       // 0–100
    ticks: number       // 0 = none, n = number of tick marks
    progressFill: FillStyle
}

export interface StepperShape extends FormShape {
    type: 'stepper'
    value: number
    text: TextStyle
}

export interface StickyNoteShape extends FormShape {
    type: 'stickynote'
    text: TextStyle
}

export interface ListShape extends FormShape {
    type: 'list'
    text: TextStyle        // newline-separated items
    selectedIndex: number  // -1 = none highlighted
}

export interface ScrollPanelShape extends FormShape {
    type: 'scrollpanel'
    cornerRadius: number
    cornerRadii?: CornerRadii
    scrollPosition: number  // 0–1, controls thumb position
    clipChildren: boolean
}

export interface TableShape extends FormShape {
    type: 'table'
    text: TextStyle  // newline-separated rows; columns separated by commas; first row = header
}

export interface GroupShape extends ShapeBase {
    type: 'group'
    transform: BoundingBox  // auto-computed as union of children's bounding boxes
}

export interface ImageMockShape extends FormShape {
    type: 'imagemock'
}

export interface ChartMockShape extends FormShape {
    type: 'chartmock'
    chartType: 'bar' | 'line'
}

export interface PixelImageShape extends ShapeBase {
    type: 'pixelimage'
    transform: BoundingBox
    assetId: string   // references PixelAsset.id in document.pixelAssets
}

// ─── Union ────────────────────────────────────────────────────────────────

export type Shape =
    | RectShape | CircleShape | LineShape
    | TextShape | ImageShape | PageShape
    | ButtonShape | IconShape | PanelShape | SliderShape
    | LabelShape | TextFieldShape | CheckboxShape | ToggleShape
    | FrameShape | DialogShape | RadioShape | SelectShape | ProgressShape | StepperShape
    | StickyNoteShape | ListShape | ScrollPanelShape | TableShape
    | GroupShape | ImageMockShape | ChartMockShape
    | PixelImageShape | TabbedPanelShape

export type ShapeType = Shape['type']

// ─── Default style factories ──────────────────────────────────────────────

export const defaultFill = (): ColorFill => ({type: 'color', color: '#ffffff', opacity: 1})
export const defaultStroke = (): StrokeStyle => ({
    type: 'solid',
    color: '#333333',
    width: 1,
    dash: [5, 3],
    opacity: 1
})
export const defaultText = (content = ''): TextStyle => ({
    content,
    fontFamily: 'sans-serif',
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    align: 'center',
    verticalAlign: 'middle',
})
export const defaultTransform = (x = 0, y = 0, w = 100, h = 60): BoundingBox => ({
    x, y, width: w, height: h, rotation: 0,
})
