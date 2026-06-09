import type {PowerUpShapeTypeDefinition} from './types'
import {useEffect, useState} from 'react'

type Listener = () => void
const registry = new Map<string, PowerUpShapeTypeDefinition>()
const toolModeIndex = new Map<string, string>() // toolMode -> shape type
const listeners = new Set<Listener>()

function notify() {
    listeners.forEach(l => l())
}

export const shapeRegistry = {
    register(types: PowerUpShapeTypeDefinition[]): void {
        for (const t of types) {
            registry.set(t.type, t)
            toolModeIndex.set(t.toolMode, t.type)
        }
        notify()
    },

    unregister(typeIds: string[]): void {
        for (const id of typeIds) {
            const def = registry.get(id)
            if (def) toolModeIndex.delete(def.toolMode)
            registry.delete(id)
        }
        notify()
    },

    get(type: string): PowerUpShapeTypeDefinition | undefined {
        return registry.get(type)
    },

    getByToolMode(toolMode: string): PowerUpShapeTypeDefinition | undefined {
        const type = toolModeIndex.get(toolMode)
        return type ? registry.get(type) : undefined
    },

    all(): PowerUpShapeTypeDefinition[] {
        return [...registry.values()]
    },

    byCategory(cat: string): PowerUpShapeTypeDefinition[] {
        return [...registry.values()].filter(t => t.category === cat)
    },

    subscribe(listener: Listener): () => void {
        listeners.add(listener)
        return () => listeners.delete(listener)
    },
}

export function useShapeRegistry(): PowerUpShapeTypeDefinition[] {
    const [types, setTypes] = useState(() => shapeRegistry.all())
    useEffect(() => shapeRegistry.subscribe(() => setTypes(shapeRegistry.all())), [])
    return types
}
