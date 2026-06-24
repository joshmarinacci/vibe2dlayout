import type {ActionDefinition} from './types'

type Listener = () => void

const _actions = new Map<string, ActionDefinition>()
const _listeners = new Set<Listener>()
// Cached snapshot — same reference until the registry mutates.
// useSyncExternalStore requires getSnapshot() to return a stable reference
// between mutations; a new array on every call causes an infinite loop.
let _snapshot: ActionDefinition[] = []

function notify() {
    _snapshot = [..._actions.values()]
    _listeners.forEach(fn => fn())
}

export const actionRegistry = {
    register(action: ActionDefinition): () => void {
        _actions.set(action.id, action)
        notify()
        return () => {
            _actions.delete(action.id)
            notify()
        }
    },

    registerMany(actions: ActionDefinition[]): () => void {
        // Register all at once then notify once, not once per action
        for (const a of actions) _actions.set(a.id, a)
        notify()
        return () => {
            for (const a of actions) _actions.delete(a.id)
            notify()
        }
    },

    getAll(): ActionDefinition[] {
        return _snapshot
    },

    getById(id: string): ActionDefinition | undefined {
        return _actions.get(id)
    },

    subscribe(listener: Listener): () => void {
        _listeners.add(listener)
        return () => _listeners.delete(listener)
    },
}
