import type {VibeDocument} from '@model/document'
import {appReducer} from './reducer'
import type {AppAction, AppState, DocumentAction} from './types'

const MAX_HISTORY = 100

export interface HistoryState {
    past: VibeDocument[]
    present: AppState
    future: VibeDocument[]
}

const DOCUMENT_ACTION_TYPES = new Set<string>([
    'ADD_SHAPE', 'DELETE_SHAPES', 'MOVE_SHAPES', 'MOVE_SHAPES_START', 'SET_TRANSFORM',
    'SET_CONNECTOR_START', 'SET_CONNECTOR_END', 'PATCH_SHAPE',
    'REPARENT_SHAPE', 'REORDER_SHAPE', 'COMMIT_TEXT_EDIT',
    'DUPLICATE_SHAPES', 'ALIGN_SHAPES',
    'ADD_PALETTE', 'DELETE_PALETTE', 'RENAME_PALETTE',
    'ADD_PALETTE_COLOR', 'DELETE_PALETTE_COLOR', 'UPDATE_PALETTE_COLOR',
    'ADD_PAGE_FOLDER', 'DELETE_PAGE_FOLDER', 'RENAME_PAGE_FOLDER',
    'ASSIGN_PAGES_TO_FOLDER', 'REMOVE_PAGES_FROM_FOLDER', 'REORDER_PAGE_FOLDER',
    'ADD_VARIABLE', 'UPDATE_VARIABLE', 'DELETE_VARIABLE', 'REORDER_VARIABLE', 'BIND_VARIABLE',
    'ADD_IMAGE_ASSET', 'UPDATE_IMAGE_ASSET', 'DELETE_IMAGE_ASSET',
    'ADD_DIMENSION_ASSET', 'UPDATE_DIMENSION_ASSET', 'DELETE_DIMENSION_ASSET',
    'ADD_GUIDE', 'DELETE_GUIDE', 'MOVE_GUIDE',
    'ADD_CUSTOM_FONT', 'DELETE_CUSTOM_FONT', 'UPDATE_CUSTOM_FONT_META',
    'ADD_PIXEL_ASSET', 'UPDATE_PIXEL_ASSET', 'DELETE_PIXEL_ASSET',
    'ADD_DOCUMENT_POWER_UP', 'REMOVE_DOCUMENT_POWER_UP', 'UPDATE_DOCUMENT_POWER_UP_SETTINGS',
    'ADD_SHAPE_POWER_UP_FEATURE', 'REMOVE_SHAPE_POWER_UP_FEATURE', 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS',
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
            present: {...state.present, document: previous, isDirty: true},
            future: [state.present.document, ...state.future],
        }
    }

    if (action.type === 'REDO') {
        if (state.future.length === 0) return state
        const next = state.future[0]
        const newFuture = state.future.slice(1)
        return {
            past: [...state.past, state.present.document].slice(-MAX_HISTORY),
            present: {...state.present, document: next, isDirty: true},
            future: newFuture,
        }
    }

    if (action.type === 'LOAD_DOCUMENT') {
        const nextPresent = appReducer(state.present, action)
        return {
            past: [],
            present: {...nextPresent, isDirty: false, physicsSimulationRunning: false},
            future: [],
        }
    }

    if (isDocumentAction(action)) {
        const nextPresent = appReducer(state.present, action)
        return {
            past: [...state.past, state.present.document].slice(-MAX_HISTORY),
            present: {...nextPresent, isDirty: true},
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
    return {past: [], present: state, future: []}
}

export function canUndo(h: HistoryState): boolean {
    return h.past.length > 0
}

export function canRedo(h: HistoryState): boolean {
    return h.future.length > 0
}
