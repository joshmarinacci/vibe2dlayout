import {actionRegistry} from './registry'

actionRegistry.registerMany([
    {
        id: 'core.undo',
        title: 'Undo',
        description: 'Undo the last action',
        tags: ['edit', 'history'],
        shortcut: '⌘Z',
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'UNDO'}),
    },
    {
        id: 'core.redo',
        title: 'Redo',
        description: 'Redo the previously undone action',
        tags: ['edit', 'history'],
        shortcut: '⌘⇧Z',
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'REDO'}),
    },
    {
        id: 'core.select-all',
        title: 'Select All',
        description: 'Select all shapes on the current page',
        tags: ['selection', 'edit'],
        shortcut: '⌘A',
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'SELECT_ALL'}),
    },
    {
        id: 'core.deselect-all',
        title: 'Deselect All',
        description: 'Deselect all selected shapes',
        tags: ['selection'],
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'DESELECT_ALL'}),
        isEnabled: ({state}) => state.selection.ids.length > 0,
    },
    {
        id: 'core.delete',
        title: 'Delete Selected',
        description: 'Delete all selected shapes',
        tags: ['edit', 'selection', 'shape-action'],
        shortcut: '⌫',
        surfaces: ['palette', 'context-menu'],
        isDanger: true,
        run: ({state, dispatch}) => {
            if (state.selection.ids.length > 0) {
                dispatch({type: 'DELETE_SHAPES', ids: state.selection.ids})
                dispatch({type: 'DESELECT_ALL'})
            }
        },
        isEnabled: ({state}) => state.selection.ids.length > 0,
    },
    {
        id: 'core.duplicate',
        title: 'Duplicate Selected',
        description: 'Duplicate all selected shapes',
        tags: ['edit', 'selection', 'shape-action'],
        shortcut: '⌘D',
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            if (state.selection.ids.length > 0) {
                dispatch({type: 'DUPLICATE_SHAPES', ids: state.selection.ids})
            }
        },
        isEnabled: ({state}) => state.selection.ids.length > 0,
    },
    {
        id: 'core.group',
        title: 'Group Shapes',
        description: 'Group all selected shapes together',
        tags: ['edit', 'selection', 'shape-action'],
        shortcut: '⌘G',
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            if (state.selection.ids.length > 1) {
                dispatch({type: 'GROUP_SHAPES', ids: state.selection.ids})
            }
        },
        isEnabled: ({state}) => state.selection.ids.length > 1,
    },
    {
        id: 'core.ungroup',
        title: 'Ungroup',
        description: 'Ungroup the selected group',
        tags: ['edit', 'selection', 'shape-action'],
        shortcut: '⌘⇧G',
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            const id = state.selection.ids[0]
            if (id) dispatch({type: 'UNGROUP_SHAPES', id})
        },
        isEnabled: ({state}) => {
            if (state.selection.ids.length !== 1) return false
            const shape = state.document.shapes[state.selection.ids[0]]
            return shape?.type === 'group'
        },
    },
    {
        id: 'core.bring-forward',
        title: 'Bring Forward',
        description: 'Move the selected shape one step forward in the layer order',
        tags: ['shape-action', 'layers'],
        shortcut: '⌘]',
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            const id = state.selection.ids[0]
            if (id) dispatch({type: 'REORDER_SHAPE', id, direction: 'up'})
        },
        isEnabled: ({state}) => state.selection.ids.length === 1,
    },
    {
        id: 'core.send-backward',
        title: 'Send Backward',
        description: 'Move the selected shape one step back in the layer order',
        tags: ['shape-action', 'layers'],
        shortcut: '⌘[',
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            const id = state.selection.ids[0]
            if (id) dispatch({type: 'REORDER_SHAPE', id, direction: 'down'})
        },
        isEnabled: ({state}) => state.selection.ids.length === 1,
    },
    {
        id: 'core.bring-to-front',
        title: 'Bring to Front',
        description: 'Move the selected shape to the top of the layer order',
        tags: ['shape-action', 'layers'],
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            const id = state.selection.ids[0]
            if (id) dispatch({type: 'REORDER_SHAPE', id, direction: 'to-front'})
        },
        isEnabled: ({state}) => state.selection.ids.length === 1,
    },
    {
        id: 'core.send-to-back',
        title: 'Send to Back',
        description: 'Move the selected shape to the bottom of the layer order',
        tags: ['shape-action', 'layers'],
        surfaces: ['palette', 'context-menu'],
        run: ({state, dispatch}) => {
            const id = state.selection.ids[0]
            if (id) dispatch({type: 'REORDER_SHAPE', id, direction: 'to-back'})
        },
        isEnabled: ({state}) => state.selection.ids.length === 1,
    },
    {
        id: 'core.reset-view',
        title: 'Reset View',
        description: 'Reset pan and zoom to default',
        tags: ['view'],
        shortcut: '⌘0',
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'RESET_VIEW'}),
    },
    {
        id: 'core.toggle-left-panel',
        title: 'Toggle Layers Panel',
        description: 'Show or hide the layers panel',
        tags: ['view'],
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'TOGGLE_LEFT_PANEL'}),
    },
    {
        id: 'core.toggle-right-panel',
        title: 'Toggle Properties Panel',
        description: 'Show or hide the properties panel',
        tags: ['view'],
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'TOGGLE_RIGHT_PANEL'}),
    },
    {
        id: 'core.show-shortcuts',
        title: 'Show Keyboard Shortcuts',
        description: 'Open the keyboard shortcuts reference',
        tags: ['help', 'view'],
        shortcut: '?',
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'TOGGLE_SHORTCUTS_MODAL'}),
    },
    {
        id: 'core.settings',
        title: 'Open Settings',
        description: 'Open the application settings',
        tags: ['settings', 'view'],
        surfaces: ['palette'],
        run: ({dispatch}) => dispatch({type: 'TOGGLE_SETTINGS_MODAL'}),
    },
])
