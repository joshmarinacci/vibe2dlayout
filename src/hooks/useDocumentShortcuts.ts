import {useAppDispatch, useAppState} from '@store/context'
import {saveDoc} from '@utils/localStorageDB'
import {getEffectiveGridSettings} from '@utils/snapping'
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
                    } catch (err) {
                        console.error('Save failed:', err)
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
                return
            }
            if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                dispatch({type: 'REDO'})
                return
            }
            if (meta && e.key === 'a') {
                e.preventDefault()
                dispatch({type: 'SELECT_ALL'})
                return
            }
            if (meta && e.key === 'd') {
                if (state.selection.ids.length > 0) {
                    e.preventDefault()
                    dispatch({type: 'DUPLICATE_SHAPES', ids: state.selection.ids})
                }
                return
            }
            if (meta && e.key === 'g' && !e.shiftKey) {
                if (state.selection.ids.length > 1) {
                    e.preventDefault()
                    dispatch({type: 'GROUP_SHAPES', ids: state.selection.ids})
                }
                return
            }
            if (meta && e.key === 'g' && e.shiftKey) {
                if (state.selection.ids.length === 1) {
                    const shape = state.document.shapes[state.selection.ids[0]]
                    if (shape?.type === 'group') {
                        e.preventDefault()
                        dispatch({type: 'UNGROUP_SHAPES', id: state.selection.ids[0]})
                    }
                }
                return
            }
            if (meta && e.key === ']') {
                if (state.selection.ids.length === 1) {
                    e.preventDefault()
                    dispatch({type: 'REORDER_SHAPE', id: state.selection.ids[0], direction: 'up'})
                }
                return
            }
            if (meta && e.key === '[') {
                if (state.selection.ids.length === 1) {
                    e.preventDefault()
                    dispatch({type: 'REORDER_SHAPE', id: state.selection.ids[0], direction: 'down'})
                }
                return
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (state.selection.ids.length > 0) {
                    e.preventDefault()
                    dispatch({type: 'DELETE_SHAPES', ids: state.selection.ids})
                    dispatch({type: 'DESELECT_ALL'})
                }
                return
            }

            if (e.key === 'Escape') {
                if (state.selection.editingTextId) {
                    dispatch({type: 'STOP_TEXT_EDIT'})
                } else if (state.drilledInContainerStack.length > 0) {
                    dispatch({type: 'EXIT_DRILL_MODE'})
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

            // Arrow key nudge
            if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                if (state.selection.ids.length > 0) {
                    e.preventDefault()
                    const gridSettings = getEffectiveGridSettings(state.activePageId, state.document.shapes, state.document.gridSettings)
                    const dist = gridSettings.snapEnabled ? gridSettings.size : (e.shiftKey ? 10 : 1)
                    const dx = e.key === 'ArrowLeft' ? -dist : e.key === 'ArrowRight' ? dist : 0
                    const dy = e.key === 'ArrowUp' ? -dist : e.key === 'ArrowDown' ? dist : 0
                    dispatch({type: 'MOVE_SHAPES', ids: state.selection.ids, dx, dy})
                }
            }
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [state.selection, state.drilledInContainerStack, state.activePageId, state.document, state.document.gridSettings, state.documentId, state.documentName, dispatch])
}
