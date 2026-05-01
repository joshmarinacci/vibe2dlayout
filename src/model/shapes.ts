import type { BoundingBox } from './transform'
import type { ConnectorEndpoint, ConnectorRoute } from './connector'
import type { GridSettings } from './grid'
import type { CanvasGuide } from './guide'

// ─── Shared style types ───────────────────────────────────────────────────

export interface LinearGradient {
  type: 'linear'
  angle: number   // degrees
  stops: Array<{ color: string; position: number; paletteColorId?: string }>
}

export interface FillStyle {
  color: string    // CSS color string
  opacity: number  // 0–1
  paletteColorId?: string
  gradient?: LinearGradient | null  // when set, overrides color for rendering
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

export type StrokeType ='solid' | 'sketch' | 'dashed' | 'none'
export interface StrokeStyle {
  type: StrokeType
  color: string
  width: number
  dash: number[]   // [] = solid, [5,3] = dashed
  opacity: number
  paletteColorId?: string
}

export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'

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
  textGradient?: LinearGradient | null  // when set, renders text with gradient fill instead of color
  lineHeight?: number        // CSS multiplier, e.g. 1.5 (undefined = browser default)
  letterSpacing?: number     // pixels
  textDecoration?: 'none' | 'underline' | 'line-through' | 'underline line-through'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  fontVariantCaps?: 'normal' | 'small-caps'
  fontVariationSettings?: Record<string, number>  // e.g. { wght: 600, wdth: 75 }
  // Named style reference — see src/model/textStyle.ts
  textStyleId?: string
  // Fields explicitly overridden from the style (not inherited)
  textStyleOverrides?: string[]
}

export type ArrowType = 'none' | 'arrow' | 'circle' | 'diamond'
export type MimeType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | 'image/svg+xml'

// ─── Shape base ───────────────────────────────────────────────────────────

interface ShapeBase {
  id: string
  name: string
  locked: boolean
  visible: boolean
  // Variable bindings: propPath → variableId. Resolved at render time.
  variableBindings?: Record<string, string>
  boxShadow?: BoxShadow[]
}

export interface FilledShape {
  fill: FillStyle
}
export interface StrokedShape {
  stroke:StrokeStyle
}
export interface TransformedShape {
  transform: BoundingBox
}
export interface ShapeWithText {
  text:TextStyle
}

// ─── Concrete shape types ─────────────────────────────────────────────────

export interface RectShape extends ShapeBase, FilledShape, StrokedShape, TransformedShape {
  type: 'rect'
  cornerRadius: number
  cornerRadii?: CornerRadii
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

export interface TextShape extends ShapeBase, TransformedShape, FilledShape, ShapeWithText {
  type: 'text'
}

export interface ImageShape extends ShapeBase, TransformedShape {
  type: 'image'
  src: string      // base64 data URI or http(s) URL
  mimeType: MimeType
  preserveAspectRatio: boolean
  opacity: number
  assetId?: string  // references ImageAsset.id in document.images
}

export interface PageShape extends ShapeBase, TransformedShape {
  type: 'page'
  fixedSize: { width: number; height: number } | null  // null = infinite
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
  trackFill: FillStyle
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
  trackFill: FillStyle
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
  titleFontSize: number
  titleFontFamily: string
  titleColor: string
  okLabel: string
  cancelLabel: string
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
  trackFill: FillStyle
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
  | TextShape | ImageShape  | PageShape
  | ButtonShape | IconShape | PanelShape | SliderShape
  | LabelShape | TextFieldShape | CheckboxShape | ToggleShape
  | FrameShape | DialogShape | RadioShape | SelectShape | ProgressShape | StepperShape
  | StickyNoteShape | ListShape | ScrollPanelShape | TableShape
  | GroupShape | ImageMockShape | ChartMockShape
  | PixelImageShape | TabbedPanelShape

export type ShapeType = Shape['type']

// ─── Default style factories ──────────────────────────────────────────────

export const defaultFill = (): FillStyle => ({ color: '#ffffff', opacity: 1 })
export const defaultStroke = (): StrokeStyle => ({ type:'solid', color: '#333333', width: 1, dash: [5,3], opacity: 1 })
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

export function hasFill(shape:Shape):boolean {
  return 'fill' in shape;
}
export function hasStroke(shape:Shape):boolean {
  return 'stroke' in shape;
}
export function hasTransform(shape:Shape):boolean {
  return 'transform' in shape;
}
export function hasText(shape:Shape):boolean {
  return 'text' in shape
}