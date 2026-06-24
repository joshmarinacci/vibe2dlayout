import type {AppAction, AppState} from '@store/types'
import type {Dispatch, ReactNode} from 'react'

export interface ActionContext {
    state: AppState
    dispatch: Dispatch<AppAction>
}

export interface ActionDefinition {
    id: string
    title: string
    description?: string
    icon?: ReactNode
    // Used for command palette search. Suggested values: 'edit', 'shape-action', 'view', 'file', 'powerup', 'history', 'selection'
    tags: string[]
    shortcut?: string  // display string, e.g. '⌘Z'
    surfaces?: Array<'palette' | 'context-menu' | 'toolbar'>
    run: (ctx: ActionContext) => void | Promise<void>
    isEnabled?: (ctx: ActionContext) => boolean
    isDanger?: boolean
}

export type ActionManager = (ctx: ActionContext) => ActionDefinition[]
