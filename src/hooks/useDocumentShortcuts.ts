import {notifyPowerUpsDocumentSaved} from '@hooks/usePowerUpsRuntime'
import {useAppDispatch, useAppState} from '@store/context'
import {saveDoc} from '@utils/localStorageDB'
import {shortcutEvents} from '@utils/shortcutEvents'
import {getEffectiveGridSettings} from '@utils/snapping'
import {appLogger} from '@logging'
import {useEffect} from 'react'

const IS_TAURI = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export function useDocumentShortcuts() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const meta = e.metaKey || e.ctrlKey

            // Cmd+S: save document — intercept before input guard to prevent browser save dialog
            if (meta && e.key === 's' && !e.shiftKey) {
                if (!IS_TAURI) {
                    // preventDefault only in web mode — in Tauri, calling it blocks the native
                    // menu accelerator (WKWebView swallows the event before AppKit sees it)
                    e.preventDefault()
                    try {
                        const entry = saveDoc(state.documentId, state.documentName, state.document)
                        dispatch({type: 'SET_DOCUMENT_META', id: entry.id, name: entry.name})
                        notifyPowerUpsDocumentSaved(state, dispatch).catch(err => {
                            appLogger.error('Failed to notify power-ups after save shortcut', err)
                        })
                    } catch (err) {
                        appLogger.error('Save failed from shortcut', err)
                    }
                }
                return
            }

            const target = e.target as HTMLElement
            // Don't fire shortcuts when typing in inputs
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return
            }

            if (meta && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                dispatch({type: 'UNDO'})
                shortcutEvents.emit('⌘Z', 'Undo')
                return
            }
            if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                dispatch({type: 'REDO'})
                shortcutEvents.emit('⌘⇧Z', 'Redo')
                return
            }
            if (meta && e.key === 'a') {
                e.preventDefault()
                dispatch({type: 'SELECT_ALL'})
                shortcutEvents.emit('⌘A', 'Select all')
                return
            }
            if (meta && e.key === 'd') {
                // In Tauri, the native menu accelerator handles this; JS would double-fire
                if (!IS_TAURI && state.selection.ids.length > 0) {
                    e.preventDefault()
                    dispatch({type: 'DUPLICATE_SHAPES', ids: state.selection.ids})
                    shortcutEvents.emit('⌘D', 'Duplicate selected')
                }
                return
            }
            if (meta && e.key === 'g' && !e.shiftKey) {
                if (!IS_TAURI && state.selection.ids.length > 1) {
                    e.preventDefault()
                    dispatch({type: 'GROUP_SHAPES', ids: state.selection.ids})
                    shortcutEvents.emit('⌘G', 'Group selected')
                }
                return
            }
            if (meta && e.key === 'g' && e.shiftKey) {
                if (!IS_TAURI && state.selection.ids.length === 1) {
                    const shape = state.document.shapes[state.selection.ids[0]]
                    if (shape?.type === 'group') {
                        e.preventDefault()
                        dispatch({type: 'UNGROUP_SHAPES', id: state.selection.ids[0]})
                        shortcutEvents.emit('⌘⇧G', 'Ungroup')
                    }
                }
                return
            }
            if (meta && e.key === ']') {
                if (!IS_TAURI && state.selection.ids.length === 1) {
                    e.preventDefault()
                    dispatch({type: 'REORDER_SHAPE', id: state.selection.ids[0], direction: 'up'})
                    shortcutEvents.emit('⌘]', 'Bring forward')
                }
                return
            }
            if (meta && e.key === '[') {
                if (!IS_TAURI && state.selection.ids.length === 1) {
                    e.preventDefault()
                    dispatch({type: 'REORDER_SHAPE', id: state.selection.ids[0], direction: 'down'})
                    shortcutEvents.emit('⌘[', 'Send backward')
                }
                return
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (state.selection.ids.length > 0) {
                    e.preventDefault()
                    dispatch({type: 'DELETE_SHAPES', ids: state.selection.ids})
                    dispatch({type: 'DESELECT_ALL'})
                    shortcutEvents.emit('⌫', 'Delete selected')
                }
                return
            }

            if (e.key === 'Escape') {
                if (state.selection.editingTextId) {
                    dispatch({type: 'STOP_TEXT_EDIT'})
                    shortcutEvents.emit('Esc', 'Cancel text edit')
                } else if (state.drilledInContainerStack.length > 0) {
                    dispatch({type: 'EXIT_DRILL_MODE'})
                    shortcutEvents.emit('Esc', 'Exit container')
                } else {
                    dispatch({type: 'DESELECT_ALL'})
                    dispatch({type: 'SET_TOOL_MODE', mode: 'select'})
                }
                return
            }

            if (e.key === '?' && !meta && !state.selection.editingTextId) {
                dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'})
                return
            }

            if (meta && e.key === '0') {
                e.preventDefault()
                dispatch({type: 'RESET_VIEW'})
                shortcutEvents.emit('⌘0', 'Reset view')
                return
            }

            // Arrow key nudge
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                if (state.selection.ids.length > 0) {
                    e.preventDefault()
                    const gridSettings = getEffectiveGridSettings(state.activePageId, state.document.shapes, state.document.gridSettings)
                    const dist = gridSettings.snapEnabled ? gridSettings.size : (e.shiftKey ? 10 : 1)
                    const dx = e.key === 'ArrowLeft' ? -dist : e.key === 'ArrowRight' ? dist : 0
                    const dy = e.key === 'ArrowUp' ? -dist : e.key === 'ArrowDown' ? dist : 0
                    dispatch({type: 'MOVE_SHAPES', ids: state.selection.ids, dx, dy})
                    const arrow = e.key === 'ArrowLeft' ? '←' : e.key === 'ArrowRight' ? '→' : e.key === 'ArrowUp' ? '↑' : '↓'
                    shortcutEvents.emit(e.shiftKey ? `⇧${arrow}` : arrow, `Nudge ${dist}px`)
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [state.selection, state.drilledInContainerStack, state.activePageId, state.document, state.document.gridSettings, state.documentId, state.documentName, dispatch])
}
