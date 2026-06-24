import {actionRegistry} from '../registry'
import type {ActionContext, ActionDefinition} from '../types'

// Returns registry actions tagged 'shape-action' that are enabled for the current context.
// Right-click always selects the target shape first, so state.selection.ids[0] is the
// right-clicked shape by the time the menu renders.
export function canvasContextMenuManager(ctx: ActionContext): ActionDefinition[] {
    return actionRegistry
        .getAll()
        .filter(a => a.tags.includes('shape-action') && a.surfaces?.includes('context-menu'))
        .filter(a => !a.isEnabled || a.isEnabled(ctx))
}
