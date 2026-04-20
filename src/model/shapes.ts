import type { BoundingBox } from './transform'
import type { ConnectorEndpoint, ConnectorRoute } from './connector'

// ─── Shared style types ───────────────────────────────────────────────────

export interface FillStyle {
  color: string    // CSS color string
  opacity: number  // 0–1
  paletteColorId?: string
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
}

// ─── Concrete shape types ─────────────────────────────────────────────────

export interface RectShape extends ShapeBase {
  type: 'rect'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
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
  src: string      // base64 data URI
  mimeType: MimeType
  preserveAspectRatio: boolean
  opacity: number
}

export interface PageShape extends ShapeBase {
  type: 'page'
  transform: BoundingBox
  fixedSize: { width: number; height: number } | null  // null = infinite
  background: string  // CSS color
  backgroundPaletteColorId?: string
  clipChildren: boolean
}

// ─── Composite UI shapes ──────────────────────────────────────────────────

export interface ButtonShape extends ShapeBase {
  type: 'button'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  text: TextStyle
  icon: { name: string; side: 'left' | 'right' } | null
}

export interface PanelShape extends ShapeBase {
  type: 'panel'
  transform: BoundingBox
  fill: FillStyle
  stroke: StrokeStyle
  cornerRadius: number
  title: TextStyle | null
  clipChildren: boolean
}

export interface SliderShape extends ShapeBase {
  type: 'slider'
  transform: BoundingBox
  value: number       // 0–1 normalized
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

// ─── Union ────────────────────────────────────────────────────────────────

export type Shape =
  | RectShape | CircleShape | LineShape
  | TextShape | ImageShape  | PageShape
  | ButtonShape | PanelShape | SliderShape
  | LabelShape | TextFieldShape | CheckboxShape | ToggleShape
  | FrameShape | DialogShape | RadioShape | SelectShape | ProgressShape | StepperShape
  | StickyNoteShape | ListShape | ScrollPanelShape | TableShape

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
