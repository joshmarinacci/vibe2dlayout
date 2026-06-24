import type {ContextMenuItem} from '@components/tree/ContextMenu'
import type {PowerUpMenuActionDefinition, PowerUpToolbarActionDefinition} from '@powerups/types'
import type {ActionContext, ActionDefinition} from './types'

export function adaptPowerUpToolbarAction(a: PowerUpToolbarActionDefinition): ActionDefinition {
    return {
        id: `powerup.toolbar.${a.id}`,
        title: a.title,
        icon: a.icon,
        tags: ['powerup'],
        surfaces: ['palette', 'toolbar'],
        run: a.run,
        isEnabled: a.isEnabled,
    }
}

export function adaptPowerUpMenuAction(a: PowerUpMenuActionDefinition): ActionDefinition {
    return {
        id: `powerup.menu.${a.id}`,
        title: a.title,
        tags: ['powerup'],
        surfaces: ['palette'],
        run: a.run,
        isEnabled: a.isEnabled,
    }
}

export function actionToContextMenuItem(
    action: ActionDefinition,
    ctx: ActionContext,
    onClose: () => void,
): ContextMenuItem {
    return {
        label: action.title,
        icon: action.icon,
        shortcut: action.shortcut,
        danger: action.isDanger,
        disabled: action.isEnabled ? !action.isEnabled(ctx) : false,
        onClick: () => {
            action.run(ctx)
            onClose()
        },
    }
}
