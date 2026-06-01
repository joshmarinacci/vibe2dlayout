import type {VibeDocument} from '@model/document'
import type {DocumentPowerUpEntry, ShapePowerUpEntry} from '@model/powerUps'
import type {Shape} from '@model/shapes'
import {BUILT_IN_POWER_UPS} from './builtIns'
import type {
    PowerUpActionContext,
    PowerUpDefinition,
    PowerUpMenuActionDefinition,
    PowerUpNodeFeatureDefinition,
    PowerUpToolbarActionDefinition,
    RegisteredPowerUp
} from './types'

const POWER_UP_BY_ID = new Map<string, PowerUpDefinition>(
    BUILT_IN_POWER_UPS.map(def => [def.id, def])
)

export function listAvailablePowerUps(): PowerUpDefinition[] {
    return [...BUILT_IN_POWER_UPS]
}

export function getPowerUpDefinition(id: string): PowerUpDefinition | null {
    return POWER_UP_BY_ID.get(id) ?? null
}

export function getPowerUpDisplayName(id: string): string {
    return getPowerUpDefinition(id)?.name ?? `Unknown (${id})`
}

export function getPowerUpNodeFeature(definition: PowerUpDefinition, featureId: string): PowerUpNodeFeatureDefinition | null {
    return definition.nodeFeatures?.find(f => f.id === featureId) ?? null
}

export function createDocumentPowerUpEntry(powerUpId: string): DocumentPowerUpEntry | null {
    const definition = getPowerUpDefinition(powerUpId)
    if (!definition) return null
    return {
        id: definition.id,
        version: definition.version,
        settings: definition.createDefaultDocumentSettings(),
    }
}

export function getRegisteredDocumentPowerUps(document: VibeDocument): RegisteredPowerUp[] {
    return (document.powerUps ?? [])
        .map(entry => {
            const definition = getPowerUpDefinition(entry.id)
            if (!definition) return null
            return {definition, documentEntry: entry}
        })
        .filter((entry): entry is RegisteredPowerUp => entry !== null)
}

function dedupeByIdLastWins<T extends { id: string }>(items: T[]): T[] {
    const byId = new Map<string, T>()
    for (const item of items) {
        byId.set(item.id, item)
    }
    return [...byId.values()]
}

export function getActivePowerUpToolbarActions(document: VibeDocument): PowerUpToolbarActionDefinition[] {
    const ordered: PowerUpToolbarActionDefinition[] = []
    for (const {definition} of getRegisteredDocumentPowerUps(document)) {
        if (definition.toolbarActions) ordered.push(...definition.toolbarActions)
    }
    return dedupeByIdLastWins(ordered)
}

export function getActivePowerUpMenuActions(document: VibeDocument): PowerUpMenuActionDefinition[] {
    const ordered: PowerUpMenuActionDefinition[] = []
    for (const {definition} of getRegisteredDocumentPowerUps(document)) {
        if (definition.menuActions) ordered.push(...definition.menuActions)
    }
    return dedupeByIdLastWins(ordered)
}

export function getPowerUpByTauriMenuId(document: VibeDocument, menuId: string): PowerUpMenuActionDefinition | null {
    return getActivePowerUpMenuActions(document).find(item => item.tauriMenuId === menuId) ?? null
}

export function getAllKnownPowerUpTauriMenuIds(): string[] {
    const ids = new Set<string>()
    for (const definition of BUILT_IN_POWER_UPS) {
        for (const item of definition.menuActions ?? []) {
            if (item.tauriMenuId) ids.add(item.tauriMenuId)
        }
    }
    return [...ids]
}

export function createDefaultShapePowerUpEntry(powerUpId: string): ShapePowerUpEntry | null {
    const definition = getPowerUpDefinition(powerUpId)
    if (!definition) return null
    return {
        id: powerUpId,
        version: definition.version,
        features: {},
    }
}

export function createDefaultFeatureSettings(powerUpId: string, featureId: string): Record<string, unknown> | null {
    const definition = getPowerUpDefinition(powerUpId)
    if (!definition) return null
    const feature = definition.nodeFeatures?.find(f => f.id === featureId)
    if (!feature) return null
    return feature.createDefaultSettings()
}

export function migrateDocumentPowerUps(document: VibeDocument): VibeDocument {
    let powerUps = document.powerUps ?? []
    let didUpdateDocument = false

    powerUps = powerUps.map(entry => {
        const definition = getPowerUpDefinition(entry.id)
        if (!definition) return entry
        if (!definition.migrateDocument || entry.version === definition.version) return entry
        didUpdateDocument = true
        return definition.migrateDocument({entry})
    })

    const shapes = {...document.shapes}
    let didUpdateShapes = false
    for (const [shapeId, shape] of Object.entries(document.shapes)) {
        if (!shape.powerUps || shape.powerUps.length === 0) continue
        let updatedEntries = shape.powerUps
        let updatedShape = false
        for (let i = 0; i < updatedEntries.length; i++) {
            const entry = updatedEntries[i]
            const definition = getPowerUpDefinition(entry.id)
            if (!definition || !definition.migrateShape || entry.version === definition.version) continue
            const next = definition.migrateShape({entry, shape})
            if (next !== entry) {
                if (!updatedShape) updatedEntries = [...updatedEntries]
                updatedEntries[i] = next
                updatedShape = true
            }
        }
        if (updatedShape) {
            shapes[shapeId] = {...shape, powerUps: updatedEntries} as Shape
            didUpdateShapes = true
        }
    }

    if (!didUpdateDocument && !didUpdateShapes) return document
    return {
        ...document,
        powerUps,
        shapes,
    }
}

export async function runPowerUpMenuAction(action: PowerUpMenuActionDefinition, ctx: PowerUpActionContext): Promise<void> {
    if (action.isEnabled && !action.isEnabled(ctx)) return
    await action.run(ctx)
}

export async function runPowerUpToolbarAction(action: PowerUpToolbarActionDefinition, ctx: PowerUpActionContext): Promise<void> {
    if (action.isEnabled && !action.isEnabled(ctx)) return
    await action.run(ctx)
}
