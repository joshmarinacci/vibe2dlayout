import type { Shape } from '@model/shapes'
import type { VibeDocument } from '@model/document'
import type { ConnectorEndpoint } from '@model/connector'
import type { Point, BoundingBox } from '@model/transform'
import type { SelectionState } from '@model/selection'

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
  | 'insert-panel'
  | 'insert-slider'
  | 'insert-page'

// ─── App State ─────────────────────────────────────────────────────────────

export interface AppState {
  document: VibeDocument
  selection: SelectionState
  viewTransform: ViewTransform
  toolMode: ToolMode
  // current page being viewed/edited
  activePageId: string | null
}

// ─── Actions ───────────────────────────────────────────────────────────────

// Document mutations — all pushed to undo history
export type DocumentAction =
  | { type: 'ADD_SHAPE'; parentId: string | null; shape: Shape; index?: number }
  | { type: 'DELETE_SHAPES'; ids: string[] }
  | { type: 'MOVE_SHAPES'; ids: string[]; dx: number; dy: number }
  | { type: 'SET_TRANSFORM'; id: string; transform: BoundingBox }
  | { type: 'SET_CONNECTOR_START'; id: string; endpoint: ConnectorEndpoint }
  | { type: 'SET_CONNECTOR_END'; id: string; endpoint: ConnectorEndpoint }
  | { type: 'PATCH_SHAPE'; id: string; patch: Partial<Shape> }
  | { type: 'REPARENT_SHAPE'; id: string; newParentId: string | null; index: number }
  | { type: 'REORDER_SHAPE'; id: string; direction: 'up' | 'down' | 'to-front' | 'to-back' }
  | { type: 'COMMIT_TEXT_EDIT'; id: string; content: string }
  | { type: 'LOAD_DOCUMENT'; document: VibeDocument }

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

// Undo/redo
export type HistoryAction =
  | { type: 'UNDO' }
  | { type: 'REDO' }

export type AppAction = DocumentAction | SelectionAction | ViewAction | HistoryAction
