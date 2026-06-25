import type {ConnectorEndpoint} from '@model/connector'
import type {CustomFont, GradientDef, PageFolder, SketchStyleDef, VibeDocument} from '@model/document'
import type {DimensionAsset} from '@model/dimensionAsset'
import type {GridSettings} from '@model/grid'
import type {CanvasGuide} from '@model/guide'
import type {ImageAsset} from '@model/imageAsset'
import type {Library, PageTemplate, ShapeTemplate} from '@model/library'
import type {RichTextStyleSet} from '../powerups/richText/types'
import type {ColorPalette, PaletteColor} from '@model/palette'
import type {PixelAsset} from '@model/pixelAsset'
import type {SelectionState} from '@model/selection'
import type {Shape} from '@model/shapes'
import type {Theme} from '@model/theme'
import type {BoundingBox, Point} from '@model/transform'

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
    | 'insert-page'
    | 'insert-group'
    | 'insert-pixelimage'
    | (string & {}) // allows powerup-registered tool modes while preserving autocomplete for core modes

// ─── Settings ──────────────────────────────────────────────────────────────

export interface UserSettings {
    pinchZoomSpeed: number   // multiplier applied to deltaY for pinch gesture, default 0.005
    wheelZoomStep: number    // fractional zoom step per mouse-wheel click, default 0.1 (= 10%)
    showShortcutIndicator: boolean
    panelOpacity: number     // 0.0–1.0 opacity for overlay side panels, default 0.92
}

export const DEFAULT_SETTINGS: UserSettings = {
    pinchZoomSpeed: 0.005,
    wheelZoomStep: 0.1,
    showShortcutIndicator: true,
    panelOpacity: 0.92,
}

// ─── Panel selection ───────────────────────────────────────────────────────

export type LibraryItemType = 'gradient' | 'image' | 'font' | 'dimension' | 'shape-template' | 'page-template'

export type PanelSelection =
    | { kind: 'document' }
    | { kind: 'image-asset'; id: string }
    | { kind: 'dimension-asset'; id: string }
    | { kind: 'pixel-asset'; id: string }
    | { kind: 'font'; name: string }
    | { kind: 'gradient'; id: string }
    | { kind: 'library-item'; id: string; itemType: LibraryItemType }
    | { kind: 'rich-text-style-set'; id: string; source: 'document' | 'library' }
    | null

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
    showLogConsole: boolean
    settings: UserSettings
    drilledInContainerStack: string[]  // innermost (current) is last element
    // current document identity (localStorage / display name)
    documentId: string | null
    documentName: string
    currentFilePath: string | null  // Tauri mode only: absolute path of the open file
    isDirty: boolean  // true when document has unsaved changes
    // What is currently shown in the properties panel (non-shape selections)
    panelSelection: PanelSelection
    // ID of the pixel asset currently being edited in the overlay
    editingPixelAssetId: string | null
    // One-shot signal from useTauriMenu to open the documents modal
    pendingDocumentsModalMode: 'open' | 'save-as' | null
    showGradientModal: boolean
    showSketchStyleModal: boolean
    croppingShapeId: string | null
    library: Library
    physicsSimulationRunning: boolean
    leftPanelVisible: boolean
    rightPanelVisible: boolean
    presentationMode: boolean
    presentationSlideIndex: number
    notesVisible: boolean
    showCommandPalette: boolean
}

export interface ShapeTransformUpdate {
    id: string
    x: number
    y: number
    rotation: number
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
    | {
    type: 'REPARENT_SHAPE';
    id: string;
    newParentId: string | null;
    index: number;
    x?: number;
    y?: number
}
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
    | {
    type: 'UPDATE_PALETTE_COLOR';
    paletteId: string;
    colorId: string;
    color?: string;
    name?: string
}
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
    | { type: 'ADD_IMAGE_ASSET'; asset: ImageAsset }
    | { type: 'UPDATE_IMAGE_ASSET'; asset: ImageAsset }
    | { type: 'DELETE_IMAGE_ASSET'; assetId: string }
    | { type: 'ADD_DIMENSION_ASSET'; asset: DimensionAsset }
    | { type: 'UPDATE_DIMENSION_ASSET'; asset: DimensionAsset }
    | { type: 'DELETE_DIMENSION_ASSET'; assetId: string }
    | { type: 'ADD_PIXEL_ASSET'; asset: PixelAsset }
    | { type: 'UPDATE_PIXEL_ASSET'; asset: PixelAsset }
    | { type: 'DELETE_PIXEL_ASSET'; assetId: string }
    | { type: 'ADD_GUIDE'; pageId: string; guide: CanvasGuide }
    | { type: 'DELETE_GUIDE'; pageId: string; guideId: string }
    | { type: 'MOVE_GUIDE'; pageId: string; guideId: string; position: number }
    | { type: 'ADD_CUSTOM_FONT'; font: CustomFont }
    | { type: 'DELETE_CUSTOM_FONT'; fontName: string }
    | { type: 'UPDATE_CUSTOM_FONT_META'; fontName: string; patch: Partial<CustomFont> }
    | { type: 'ADD_GRADIENT'; gradient: GradientDef }
    | { type: 'UPDATE_GRADIENT'; gradient: GradientDef }
    | { type: 'DELETE_GRADIENT'; gradientId: string }
    | { type: 'ADD_SKETCH_STYLE'; style: SketchStyleDef }
    | { type: 'UPDATE_SKETCH_STYLE'; style: SketchStyleDef }
    | { type: 'DELETE_SKETCH_STYLE'; styleId: string }
    | { type: 'ADD_DOCUMENT_POWER_UP'; powerUpId: string }
    | { type: 'REMOVE_DOCUMENT_POWER_UP'; powerUpId: string }
    | { type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS'; powerUpId: string; patch: Record<string, unknown> }
    | { type: 'ADD_SHAPE_POWER_UP_FEATURE'; shapeId: string; powerUpId: string; featureId: string }
    | { type: 'REMOVE_SHAPE_POWER_UP_FEATURE'; shapeId: string; powerUpId: string; featureId: string }
    | {
    type: 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS';
    shapeId: string;
    powerUpId: string;
    featureId: string;
    patch: Record<string, unknown>
}
    | { type: 'PLACE_SHAPE_TEMPLATE'; template: ShapeTemplate; parentId: string | null; x: number; y: number }
    | { type: 'PLACE_PAGE_TEMPLATE'; template: PageTemplate; newPageId: string }

export type AlignType =
    | 'left' | 'center-h' | 'right'
    | 'top' | 'middle-v' | 'bottom'
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
    | { type: 'TOGGLE_LOG_CONSOLE' }
    | { type: 'SELECT_DOCUMENT' }
    | { type: 'SET_FOLDER_COLLAPSED'; folderId: string; collapsed: boolean }
    | { type: 'SELECT_IMAGE_ASSET'; assetId: string | null }
    | { type: 'SELECT_DIMENSION_ASSET'; assetId: string | null }
    | { type: 'SELECT_PIXEL_ASSET'; assetId: string | null }
    | { type: 'START_PIXEL_EDIT'; assetId: string }
    | { type: 'STOP_PIXEL_EDIT' }
    | { type: 'SELECT_FONT'; fontName: string | null }
    | { type: 'REQUEST_DOCUMENTS_MODAL'; mode: 'open' | 'save-as' }
    | { type: 'CLEAR_DOCUMENTS_MODAL_REQUEST' }
    | { type: 'TOGGLE_GRADIENT_MODAL' }
    | { type: 'TOGGLE_SKETCH_STYLE_MODAL' }
    | { type: 'SELECT_GRADIENT'; gradientId: string | null }
    | { type: 'SELECT_RICH_TEXT_STYLE_SET'; id: string; source: 'document' | 'library' }
    | { type: 'DESELECT_RICH_TEXT_STYLE_SET' }
    | { type: 'SET_FILE_PATH'; path: string | null }
    | { type: 'ENTER_CROP_MODE'; shapeId: string }
    | { type: 'EXIT_CROP_MODE' }
    | { type: 'SET_PHYSICS_SIMULATION_RUNNING'; running: boolean }
    | { type: 'APPLY_PHYSICS_TRANSFORMS'; updates: ShapeTransformUpdate[] }
    | { type: 'TOGGLE_LEFT_PANEL' }
    | { type: 'TOGGLE_RIGHT_PANEL' }
    | { type: 'SET_PRESENTATION_MODE'; active: boolean; slideIndex?: number }
    | { type: 'NEXT_SLIDE'; totalSlides: number }
    | { type: 'PREV_SLIDE' }
    | { type: 'TOGGLE_NOTES_PANEL' }
    | { type: 'OPEN_COMMAND_PALETTE' }
    | { type: 'CLOSE_COMMAND_PALETTE' }
    | { type: 'TOGGLE_COMMAND_PALETTE' }

// Drag moves — same semantics as MOVE_SHAPES but NOT recorded in undo history.
// A MOVE_SHAPES_START (DocumentAction) fires once at drag start to record the undo point.
export type DragAction =
    | { type: 'DRAG_SHAPES'; ids: string[]; dx: number; dy: number }

// Undo/redo
export type HistoryAction =
    | { type: 'UNDO' }
    | { type: 'REDO' }

// Library mutations — NOT in undo history, auto-saved to localStorage/disk
export type LibraryAction =
    | { type: 'LOAD_LIBRARY'; library: Library }
    | { type: 'ADD_LIBRARY_GRADIENT'; gradient: GradientDef }
    | { type: 'UPDATE_LIBRARY_GRADIENT'; gradient: GradientDef }
    | { type: 'DELETE_LIBRARY_GRADIENT'; id: string }
    | { type: 'ADD_LIBRARY_IMAGE'; image: ImageAsset }
    | { type: 'UPDATE_LIBRARY_IMAGE'; image: ImageAsset }
    | { type: 'DELETE_LIBRARY_IMAGE'; id: string }
    | { type: 'ADD_LIBRARY_DIMENSION'; dimension: DimensionAsset }
    | { type: 'UPDATE_LIBRARY_DIMENSION'; dimension: DimensionAsset }
    | { type: 'DELETE_LIBRARY_DIMENSION'; id: string }
    | { type: 'ADD_LIBRARY_FONT'; font: CustomFont }
    | { type: 'UPDATE_LIBRARY_FONT'; font: CustomFont }
    | { type: 'DELETE_LIBRARY_FONT'; id: string }
    | { type: 'RENAME_LIBRARY_ITEM'; id: string; name: string; itemType: LibraryItemType }
    | { type: 'SELECT_LIBRARY_ITEM'; id: string; itemType: LibraryItemType }
    | { type: 'DESELECT_LIBRARY_ITEM' }
    | { type: 'ADD_LIBRARY_SHAPE_TEMPLATE'; template: ShapeTemplate }
    | { type: 'DELETE_LIBRARY_SHAPE_TEMPLATE'; id: string }
    | { type: 'ADD_LIBRARY_PAGE_TEMPLATE'; template: PageTemplate }
    | { type: 'DELETE_LIBRARY_PAGE_TEMPLATE'; id: string }
    | { type: 'ADD_RICH_TEXT_STYLE_SET_TO_LIBRARY'; styleSet: RichTextStyleSet }
    | { type: 'REMOVE_RICH_TEXT_STYLE_SET_FROM_LIBRARY'; id: string }
    | { type: 'ADD_RICH_TEXT_STYLE_SET_TO_DOCUMENT'; styleSet: RichTextStyleSet }

export type AppAction = DocumentAction | SelectionAction | ViewAction | DragAction | HistoryAction | LibraryAction
