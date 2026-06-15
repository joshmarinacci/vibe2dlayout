import {useAppDispatch, useAppState} from '@store/context'
import {useEffect, useRef} from 'react'
import {getPowerUpDefinition, getRegisteredDocumentPowerUps} from '@powerups/registry'
import type {DocumentPowerUpEntry} from '@model/powerUps'
import {createPowerUpLogger} from '@logging'

export async function notifyPowerUpsDocumentSaved(
    state: ReturnType<typeof useAppState>['state'],
    dispatch: ReturnType<typeof useAppDispatch>,
): Promise<void> {
    const ctx = {state, dispatch}
    for (const {definition, documentEntry} of getRegisteredDocumentPowerUps(state.document)) {
        try {
            await definition.lifecycle?.onDocumentSaved?.(ctx, documentEntry)
        } catch (err) {
            createPowerUpLogger(definition.id).error('onDocumentSaved failed', err)
        }
    }
}

function toEntryMap(entries: DocumentPowerUpEntry[]): Map<string, DocumentPowerUpEntry> {
    return new Map(entries.map(entry => [entry.id, entry]))
}

export function usePowerUpsRuntime(): void {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const previousEntriesRef = useRef<DocumentPowerUpEntry[]>(state.document.powerUps ?? [])
    const previousSelectedShapeIdRef = useRef<string | null>(null)

    useEffect(() => {
        const currentEntries = state.document.powerUps ?? []
        const previousEntries = previousEntriesRef.current
        const currentById = toEntryMap(currentEntries)
        const previousById = toEntryMap(previousEntries)
        const ctx = {state, dispatch}

        for (const entry of currentEntries) {
            if (previousById.has(entry.id)) continue
            const definition = getPowerUpDefinition(entry.id)
            if (!definition) continue
            const logger = createPowerUpLogger(entry.id)
            logger.info('Power-up installed')
            Promise.resolve(definition.lifecycle?.onInstall?.(ctx, entry)).catch(err => {
                logger.error('onInstall failed', err)
            })
            Promise.resolve(definition.lifecycle?.onLoad?.(ctx, entry)).catch(err => {
                logger.error('onLoad failed', err)
            })
        }

        for (const entry of previousEntries) {
            if (currentById.has(entry.id)) continue
            const definition = getPowerUpDefinition(entry.id)
            if (!definition) continue
            const logger = createPowerUpLogger(entry.id)
            logger.info('Power-up unloaded')
            Promise.resolve(definition.lifecycle?.onUnload?.(ctx, entry)).catch(err => {
                logger.error('onUnload failed', err)
            })
        }

        previousEntriesRef.current = currentEntries
    }, [state, dispatch])

    useEffect(() => {
        if (state.selection.ids.length !== 1) {
            previousSelectedShapeIdRef.current = null
            return
        }

        const selectedShapeId = state.selection.ids[0]
        if (selectedShapeId === previousSelectedShapeIdRef.current) return
        previousSelectedShapeIdRef.current = selectedShapeId

        const selectedShape = state.document.shapes[selectedShapeId]
        if (!selectedShape || !selectedShape.powerUps || selectedShape.powerUps.length === 0) return

        const documentPowerUpsById = new Map((state.document.powerUps ?? []).map(entry => [entry.id, entry]))
        const ctx = {state, dispatch}

        for (const shapePowerUp of selectedShape.powerUps) {
            const definition = getPowerUpDefinition(shapePowerUp.id)
            const documentPowerUp = documentPowerUpsById.get(shapePowerUp.id)
            if (!definition || !documentPowerUp) continue
            const logger = createPowerUpLogger(shapePowerUp.id)
            logger.debug('Shape selected with power-up', {
                shapeId: selectedShape.id,
                featureCount: Object.keys(shapePowerUp.features ?? {}).length,
            })
            Promise.resolve(definition.lifecycle?.onNodeSelected?.(ctx, {
                shape: selectedShape,
                shapePowerUp,
                documentPowerUp,
            })).catch(err => {
                logger.error('onNodeSelected failed', err)
            })
        }
    }, [state, dispatch])
}
