import type { AppState, AppAction, DocumentAction } from './types'
import type { VibeDocument } from '@model/document'
import { appReducer } from './reducer'

const MAX_HISTORY = 100

export interface HistoryState {
  past: VibeDocument[]
  present: AppState
  future: VibeDocument[]
}

const DOCUMENT_ACTION_TYPES = new Set<string>([
  'ADD_SHAPE', 'DELETE_SHAPES', 'MOVE_SHAPES', 'SET_TRANSFORM',
  'SET_CONNECTOR_START', 'SET_CONNECTOR_END', 'PATCH_SHAPE',
  'REPARENT_SHAPE', 'REORDER_SHAPE', 'COMMIT_TEXT_EDIT',
])

function isDocumentAction(action: AppAction): action is DocumentAction {
  return DOCUMENT_ACTION_TYPES.has(action.type)
}

export function historyReducer(state: HistoryState, action: AppAction): HistoryState {
  if (action.type === 'UNDO') {
    if (state.past.length === 0) return state
    const previous = state.past[state.past.length - 1]
    const newPast = state.past.slice(0, -1)
    return {
      past: newPast,
      present: { ...state.present, document: previous },
      future: [state.present.document, ...state.future],
    }
  }

  if (action.type === 'REDO') {
    if (state.future.length === 0) return state
    const next = state.future[0]
    const newFuture = state.future.slice(1)
    return {
      past: [...state.past, state.present.document].slice(-MAX_HISTORY),
      present: { ...state.present, document: next },
      future: newFuture,
    }
  }

  if (action.type === 'LOAD_DOCUMENT') {
    const nextPresent = appReducer(state.present, action)
    return {
      past: [],
      present: nextPresent,
      future: [],
    }
  }

  if (isDocumentAction(action)) {
    const nextPresent = appReducer(state.present, action)
    return {
      past: [...state.past, state.present.document].slice(-MAX_HISTORY),
      present: nextPresent,
      future: [],
    }
  }

  // Non-document actions: just update present, don't touch history
  return {
    ...state,
    present: appReducer(state.present, action),
  }
}

export function createInitialHistory(state: AppState): HistoryState {
  return { past: [], present: state, future: [] }
}

export function canUndo(h: HistoryState): boolean {
  return h.past.length > 0
}

export function canRedo(h: HistoryState): boolean {
  return h.future.length > 0
}
