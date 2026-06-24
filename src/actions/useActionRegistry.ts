import {useSyncExternalStore} from 'react'
import {actionRegistry} from './registry'
import type {ActionDefinition} from './types'

export function useActionRegistry(): ActionDefinition[] {
    return useSyncExternalStore(
        actionRegistry.subscribe,
        actionRegistry.getAll,
        actionRegistry.getAll,
    )
}
