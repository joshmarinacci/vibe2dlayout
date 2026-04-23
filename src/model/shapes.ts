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

export interface StrokeStyle {
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
  handDrawn?: boolean  // undefined = inherit from active theme
  // Variable bindings: propPath → variableId. Resolved at render time.
  variableBindings?: Record<string, string>
  boxShadow?: BoxShadow | null
}

// ─── Concrete shape types ─────────────────────────────────────────────────

export interface RectShape extends ShapeBase {
  type: 'rect'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  cornerRadii?: CornerRadii
  clipChildren: boolean
}

export interface CircleShape extends ShapeBase {
  type: 'circle'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  clipChildren: boolean
}

export interface LineShape extends ShapeBase {
  type: 'line'
  start: ConnectorEndpoint
  end: ConnectorEndpoint
  route: ConnectorRoute
  stroke: StrokeStyle
  startArrow: ArrowType
  endArrow: ArrowType
}

export interface TextShape extends ShapeBase {
  type: 'text'
  transform: BoundingBox
  text: TextStyle
  fill: FillStyle  // background fill (can be transparent)
}

export interface ImageShape extends ShapeBase {
  type: 'image'
  transform: BoundingBox
  src: string      // base64 data URI or http(s) URL
  mimeType: MimeType
  preserveAspectRatio: boolean
  opacity: number
  assetId?: string  // references ImageAsset.id in document.images
}

export interface PageShape extends ShapeBase {
  type: 'page'
  transform: BoundingBox
  fixedSize: { width: number; height: number } | null  // null = infinite
  background: string  // CSS color
  backgroundPaletteColorId?: string
  clipChildren: boolean
  gridSettings?: Partial<GridSettings>  // overrides document-level grid settings
  guides?: CanvasGuide[]               // persistent user-placed guide lines
}

// ─── Composite UI shapes ──────────────────────────────────────────────────

export interface ButtonShape extends ShapeBase {
  type: 'button'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  cornerRadii?: CornerRadii
  text: TextStyle
  icon: { name: string; side: 'left' | 'right' } | null
}

export interface IconShape extends ShapeBase {
  type: 'icon'
  transform: BoundingBox
  icon: { name: string }
  fill: FillStyle
  stroke: StrokeStyle
}

export interface PanelShape extends ShapeBase {
  type: 'panel'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  cornerRadii?: CornerRadii
  title: TextStyle | null
  clipChildren: boolean
}

export interface SliderShape extends ShapeBase {
  type: 'slider'
  transform: BoundingBox
  value: number       // 0–1 normalized
  ticks: number       // 0 = none, n = number of tick marks
  trackFill: FillStyle
  thumbFill: FillStyle
  stroke: StrokeStyle
}

export interface LabelShape extends ShapeBase {
  type: 'label'
  transform: BoundingBox
  text: TextStyle
}

export interface TextFieldShape extends ShapeBase {
  type: 'textfield'
  transform: BoundingBox
  placeholder: string
  text: TextStyle     // content = displayed value; empty = show placeholder
  fill: FillStyle
  stroke: StrokeStyle
}

export interface CheckboxShape extends ShapeBase {
  type: 'checkbox'
  transform: BoundingBox
  checked: boolean
  text: TextStyle
  fill: FillStyle
  stroke: StrokeStyle
}

export interface ToggleShape extends ShapeBase {
  type: 'toggle'
  transform: BoundingBox
  checked: boolean
  text: TextStyle
  trackFill: FillStyle
  thumbFill: FillStyle
  stroke: StrokeStyle
}

export interface FrameShape extends ShapeBase {
  type: 'frame'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  cornerRadii?: CornerRadii
  clipChildren: boolean
}

export interface DialogShape extends ShapeBase {
  type: 'dialog'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  title: string
  titleFontSize: number
  titleFontFamily: string
  titleColor: string
  okLabel: string
  cancelLabel: string
}

export interface RadioShape extends ShapeBase {
  type: 'radio'
  transform: BoundingBox
  checked: boolean
  text: TextStyle
  fill: FillStyle
  stroke: StrokeStyle
}

export interface SelectShape extends ShapeBase {
  type: 'select'
  transform: BoundingBox
  value: string
  placeholder: string
  text: TextStyle
  fill: FillStyle
  stroke: StrokeStyle
}

export interface ProgressShape extends ShapeBase {
  type: 'progress'
  transform: BoundingBox
  value: number       // 0–100
  ticks: number       // 0 = none, n = number of tick marks
  fill: FillStyle     // bar fill
  trackFill: FillStyle
  stroke: StrokeStyle
}

export interface StepperShape extends ShapeBase {
  type: 'stepper'
  transform: BoundingBox
  value: number
  text: TextStyle
  fill: FillStyle
  stroke: StrokeStyle
}

export interface StickyNoteShape extends ShapeBase {
  type: 'stickynote'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  text: TextStyle
}

export interface ListShape extends ShapeBase {
  type: 'list'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  text: TextStyle        // newline-separated items
  selectedIndex: number  // -1 = none highlighted
}

export interface ScrollPanelShape extends ShapeBase {
  type: 'scrollpanel'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  cornerRadii?: CornerRadii
  scrollPosition: number  // 0–1, controls thumb position
  clipChildren: boolean
}

export interface TableShape extends ShapeBase {
  type: 'table'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  text: TextStyle  // newline-separated rows; columns separated by commas; first row = header
}

export interface GroupShape extends ShapeBase {
  type: 'group'
  transform: BoundingBox  // auto-computed as union of children's bounding boxes
}

export interface ImageMockShape extends ShapeBase {
  type: 'imagemock'
  transform: BoundingBox
  fill: FillStyle    // background fill
  stroke: StrokeStyle
}

export interface ChartMockShape extends ShapeBase {
  type: 'chartmock'
  transform: BoundingBox
  fill: FillStyle    // bar/line color
  stroke: StrokeStyle
  chartType: 'bar' | 'line'
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

export type ShapeType = Shape['type']

// ─── Default style factories ──────────────────────────────────────────────

export const defaultFill = (): FillStyle => ({ color: '#ffffff', opacity: 1 })
export const defaultStroke = (): StrokeStyle => ({ color: '#333333', width: 1, dash: [], opacity: 1 })
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
