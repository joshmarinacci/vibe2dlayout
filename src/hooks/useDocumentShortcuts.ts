import { useEffect } from 'react'
import { useAppDispatch, useAppState } from '@store/context'
import { getEffectiveGridSettings } from '@utils/snapping'

export function useDocumentShortcuts() {
  const { state } = useAppState()
  const dispatch = useAppDispatch()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      // Don't fire shortcuts when typing in inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      const meta = e.metaKey || e.ctrlKey

      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        dispatch({ type: 'REDO' })
        return
      }
      if (meta && e.key === 'a') {
        e.preventDefault()
        dispatch({ type: 'SELECT_ALL' })
        return
      }
      if (meta && e.key === 'd') {
        if (state.selection.ids.length > 0) {
          e.preventDefault()
          dispatch({ type: 'DUPLICATE_SHAPES', ids: state.selection.ids })
        }
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selection.ids.length > 0) {
          e.preventDefault()
          dispatch({ type: 'DELETE_SHAPES', ids: state.selection.ids })
          dispatch({ type: 'DESELECT_ALL' })
        }
        return
      }

      if (e.key === 'Escape') {
        if (state.selection.editingTextId) {
          dispatch({ type: 'STOP_TEXT_EDIT' })
        } else if (state.drilledInContainerStack.length > 0) {
          dispatch({ type: 'EXIT_DRILL_MODE' })
        } else {
          dispatch({ type: 'DESELECT_ALL' })
          dispatch({ type: 'SET_TOOL_MODE', mode: 'select' })
        }
        return
      }

      if (e.key === '?' && !meta && !state.selection.editingTextId) {
        dispatch({ type: 'TOGGLE_SHORTCUTS_MODAL' })
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
          dispatch({ type: 'MOVE_SHAPES', ids: state.selection.ids, dx, dy })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.selection, state.drilledInContainerStack, state.activePageId, state.document.shapes, state.document.gridSettings, dispatch])
}
