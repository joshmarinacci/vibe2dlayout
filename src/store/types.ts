import type { Shape } from '@model/shapes'
import type { VibeDocument, PageFolder } from '@model/document'
import type { TextStyleDef } from '@model/textStyle'
import type { Variable } from '@model/variable'
import type { ImageAsset } from '@model/imageAsset'
import type { ConnectorEndpoint } from '@model/connector'
import type { Point, BoundingBox } from '@model/transform'
import type { SelectionState } from '@model/selection'
import type { ColorPalette, PaletteColor } from '@model/palette'
import type { Theme } from '@model/theme'
import type { GridSettings } from '@model/grid'
import type { CanvasGuide } from '@model/guide'

// ─── View ──────────────────────────────────────────────────────────────────

export interface ViewTransform {
  panX: number
  panY: number
  zoom: number
}

export type ToolMode =
  | 'select'
  | 'pan'
  | 'insert-rect'
  | 'insert-circle'
  | 'insert-text'
  | 'insert-image'
  | 'insert-line'
  | 'insert-button'
  | 'insert-icon'
  | 'insert-panel'
  | 'insert-slider'
  | 'insert-label'
  | 'insert-textfield'
  | 'insert-checkbox'
  | 'insert-toggle'
  | 'insert-frame'
  | 'insert-dialog'
  | 'insert-radio'
  | 'insert-select'
  | 'insert-progress'
  | 'insert-stepper'
  | 'insert-page'
  | 'insert-stickynote'
  | 'insert-list'
  | 'insert-scrollpanel'
  | 'insert-table'
  | 'insert-group'

// ─── Settings ──────────────────────────────────────────────────────────────

export interface UserSettings {
  pinchZoomSpeed: number   // multiplier applied to deltaY for pinch gesture, default 0.005
  wheelZoomStep: number    // fractional zoom step per mouse-wheel click, default 0.1 (= 10%)
}

export const DEFAULT_SETTINGS: UserSettings = {
  pinchZoomSpeed: 0.005,
  wheelZoomStep: 0.1,
}

// ─── App State ─────────────────────────────────────────────────────────────

export interface AppState {
  document: VibeDocument
  selection: SelectionState
  viewTransform: ViewTransform
  toolMode: ToolMode
  // current page being viewed/edited
  activePageId: string | null
  showShortcutsModal: boolean
  showPaletteModal: boolean
  showSettingsModal: boolean
  showThemeModal: boolean
  showDocumentSettingsModal: boolean
  settings: UserSettings
  drilledInContainerStack: string[]  // innermost (current) is last element
  // current document identity (localStorage)
  documentId: string | null
  documentName: string
  isDirty: boolean  // true when document has unsaved changes
  // true when user clicked the Document row in the tree (shows document properties)
  documentSelected: boolean
  // ID of the text style selected in the tree (shows style editor in props panel)
  selectedStyleId: string | null
  // ID of the variable selected in the tree (shows variable editor in props panel)
  selectedVariableId: string | null
  // ID of the image asset selected in the tree (shows asset editor in props panel)
  selectedAssetId: string | null
}

// ─── Actions ───────────────────────────────────────────────────────────────

// Document mutations — all pushed to undo history
export type DocumentAction =
  | { type: 'ADD_SHAPE'; parentId: string | null; shape: Shape; index?: number }
  | { type: 'DELETE_SHAPES'; ids: string[] }
  | { type: 'MOVE_SHAPES'; ids: string[]; dx: number; dy: number }
  | { type: 'MOVE_SHAPES_START' }
  | { type: 'SET_TRANSFORM'; id: string; transform: BoundingBox }
  | { type: 'SET_CONNECTOR_START'; id: string; endpoint: ConnectorEndpoint }
  | { type: 'SET_CONNECTOR_END'; id: string; endpoint: ConnectorEndpoint }
  | { type: 'PATCH_SHAPE'; id: string; patch: Partial<Shape> }
  | { type: 'REPARENT_SHAPE'; id: string; newParentId: string | null; index: number; x?: number; y?: number }
  | { type: 'REORDER_SHAPE'; id: string; direction: 'up' | 'down' | 'to-front' | 'to-back' }
  | { type: 'COMMIT_TEXT_EDIT'; id: string; content: string }
  | { type: 'DUPLICATE_SHAPES'; ids: string[]; rootIds?: string[] }
  | { type: 'ALIGN_SHAPES'; ids: string[]; alignment: AlignType }
  | { type: 'LOAD_DOCUMENT'; document: VibeDocument }
  | { type: 'ADD_PALETTE'; palette: ColorPalette }
  | { type: 'DELETE_PALETTE'; paletteId: string }
  | { type: 'RENAME_PALETTE'; paletteId: string; name: string }
  | { type: 'ADD_PALETTE_COLOR'; paletteId: string; color: PaletteColor }
  | { type: 'DELETE_PALETTE_COLOR'; paletteId: string; colorId: string }
  | { type: 'UPDATE_PALETTE_COLOR'; paletteId: string; colorId: string; color?: string; name?: string }
  | { type: 'ADD_THEME'; theme: Theme }
  | { type: 'UPDATE_THEME'; theme: Theme }
  | { type: 'DELETE_THEME'; themeId: string }
  | { type: 'SET_ACTIVE_THEME'; themeId: string }
  | { type: 'APPLY_THEME_TO_ALL_SHAPES' }
  | { type: 'RESET_SHAPES_TO_THEME'; ids: string[] }
  | { type: 'GROUP_SHAPES'; ids: string[] }
  | { type: 'UNGROUP_SHAPES'; id: string }
  | { type: 'UPDATE_GRID_SETTINGS'; patch: Partial<GridSettings> }
  | { type: 'ADD_PAGE_FOLDER'; folder: PageFolder }
  | { type: 'DELETE_PAGE_FOLDER'; folderId: string; deletionMode: 'unfolder' | 'delete-pages' }
  | { type: 'RENAME_PAGE_FOLDER'; folderId: string; name: string }
  | { type: 'ASSIGN_PAGES_TO_FOLDER'; folderId: string; pageIds: string[] }
  | { type: 'REMOVE_PAGES_FROM_FOLDER'; folderId: string; pageIds: string[] }
  | { type: 'REORDER_PAGE_FOLDER'; folderId: string; direction: 'up' | 'down' }
  | { type: 'ADD_TEXT_STYLE'; style: TextStyleDef }
  | { type: 'UPDATE_TEXT_STYLE'; style: TextStyleDef }
  | { type: 'DELETE_TEXT_STYLE'; styleId: string }
  | { type: 'REORDER_TEXT_STYLE'; styleId: string; direction: 'up' | 'down' }
  | { type: 'APPLY_TEXT_STYLE'; shapeId: string; textStyleId: string | null }
  | { type: 'CLEAR_TEXT_OVERRIDE'; shapeId: string; field: string }
  | { type: 'ADD_VARIABLE';     variable: Variable }
  | { type: 'UPDATE_VARIABLE';  variable: Variable }
  | { type: 'DELETE_VARIABLE';  variableId: string }
  | { type: 'REORDER_VARIABLE'; variableId: string; direction: 'up' | 'down' }
  | { type: 'BIND_VARIABLE';    shapeId: string; propPath: string; variableId: string | null }
  | { type: 'ADD_IMAGE_ASSET';    asset: ImageAsset }
  | { type: 'UPDATE_IMAGE_ASSET'; asset: ImageAsset }
  | { type: 'DELETE_IMAGE_ASSET'; assetId: string }
  | { type: 'ADD_GUIDE';    pageId: string; guide: CanvasGuide }
  | { type: 'DELETE_GUIDE'; pageId: string; guideId: string }
  | { type: 'MOVE_GUIDE';   pageId: string; guideId: string; position: number }
  | { type: 'ADD_CUSTOM_FONT';    fontName: string }
  | { type: 'DELETE_CUSTOM_FONT'; fontName: string }

export type AlignType =
  | 'left' | 'center-h' | 'right'
  | 'top'  | 'middle-v' | 'bottom'
  | 'match-width' | 'match-height'

// Selection mutations — NOT pushed to undo history
export type SelectionAction =
  | { type: 'SELECT_SHAPES'; ids: string[]; additive: boolean }
  | { type: 'DESELECT_ALL' }
  | { type: 'SELECT_ALL' }
  | { type: 'START_TEXT_EDIT'; id: string }
  | { type: 'STOP_TEXT_EDIT' }

// View mutations — NOT pushed to undo history
export type ViewAction =
  | { type: 'SET_TOOL_MODE'; mode: ToolMode }
  | { type: 'PAN_BY'; dx: number; dy: number }
  | { type: 'ZOOM_TO'; zoom: number; origin: Point }
  | { type: 'RESET_VIEW' }
  | { type: 'SET_ACTIVE_PAGE'; pageId: string | null }
  | { type: 'TOGGLE_SHORTCUTS_MODAL' }
  | { type: 'TOGGLE_PALETTE_MODAL' }
  | { type: 'TOGGLE_SETTINGS_MODAL' }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<UserSettings> }
  | { type: 'SET_DOCUMENT_META'; id: string | null; name: string }
  | { type: 'ENTER_DRILL_MODE'; containerId: string }
  | { type: 'EXIT_DRILL_MODE' }
  | { type: 'TOGGLE_THEME_MODAL' }
  | { type: 'TOGGLE_DOCUMENT_SETTINGS_MODAL' }
  | { type: 'SELECT_DOCUMENT' }
  | { type: 'SET_FOLDER_COLLAPSED'; folderId: string; collapsed: boolean }
  | { type: 'SELECT_STYLE'; styleId: string | null }
  | { type: 'SELECT_VARIABLE'; variableId: string | null }
  | { type: 'SELECT_IMAGE_ASSET'; assetId: string | null }

// Drag moves — same semantics as MOVE_SHAPES but NOT recorded in undo history.
// A MOVE_SHAPES_START (DocumentAction) fires once at drag start to record the undo point.
export type DragAction =
  | { type: 'DRAG_SHAPES'; ids: string[]; dx: number; dy: number }

// Undo/redo
export type HistoryAction =
  | { type: 'UNDO' }
  | { type: 'REDO' }

export type AppAction = DocumentAction | SelectionAction | ViewAction | DragAction | HistoryAction
