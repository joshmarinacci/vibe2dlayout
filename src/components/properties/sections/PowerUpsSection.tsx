import type {Shape} from '@model/shapes'
import {getPowerUpDisplayName, listAvailablePowerUps} from '@powerups/registry'
import type {RegisteredPowerUp} from '@powerups/types'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import {CollapsibleSection} from '../CollapsibleSection'
import styles from '../PropertiesPanel.module.css'

interface DocumentPowerUpsSectionProps {
    registeredPowerUps: RegisteredPowerUp[]
    dispatch: Dispatch<AppAction>
}

export function DocumentPowerUpsSection({registeredPowerUps, dispatch}: DocumentPowerUpsSectionProps) {
    const available = listAvailablePowerUps()
    const activeIds = new Set(registeredPowerUps.map(item => item.definition.id))

    return (
        <>
            <CollapsibleSection title="Power Ups">
                {available.map(powerUp => {
                    const enabled = activeIds.has(powerUp.id)
                    return (
                        <div className={styles.row} key={powerUp.id}>
                            <label className={styles.label}>{powerUp.name}</label>
                            {enabled ? (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => dispatch({type: 'REMOVE_DOCUMENT_POWER_UP', powerUpId: powerUp.id})}
                                >
                                    Remove
                                </button>
                            ) : (
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => dispatch({type: 'ADD_DOCUMENT_POWER_UP', powerUpId: powerUp.id})}
                                >
                                    Add
                                </button>
                            )}
                        </div>
                    )
                })}
            </CollapsibleSection>

            {registeredPowerUps.map(({definition, documentEntry}) => {
                if (!definition.documentSettingsRenderer) return null
                return (
                    <div key={definition.id}>
                        {definition.documentSettingsRenderer({
                            settings: documentEntry.settings,
                            update: patch => dispatch({
                                type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS',
                                powerUpId: definition.id,
                                patch,
                            }),
                        })}
                    </div>
                )
            })}
        </>
    )
}

interface ShapePowerUpsSectionProps {
    shape: Shape
    activePowerUps: RegisteredPowerUp[]
    dispatch: Dispatch<AppAction>
}

export function ShapePowerUpsSection({shape, activePowerUps, dispatch}: ShapePowerUpsSectionProps) {
    const shapeEntriesByPowerUp = new Map((shape.powerUps ?? []).map(entry => [entry.id, entry]))

    return (
        <CollapsibleSection title="Power Ups">
            {activePowerUps.length === 0 && (
                <div className={styles.row}>
                    <span className={styles.value}>No active document power ups.</span>
                </div>
            )}

            {activePowerUps.map(({definition, documentEntry}) => {
                const shapeEntry = shapeEntriesByPowerUp.get(definition.id)
                const features = definition.nodeFeatures ?? []
                if (features.length === 0) return null

                return (
                    <div key={definition.id} className={styles.section} style={{marginTop: 8, marginBottom: 8}}>
                        <div className={styles.row}>
                            <span className={styles.label}>{definition.name}</span>
                            <span className={styles.value}>v{documentEntry.version}</span>
                        </div>

                        {features.map(feature => {
                            const canAttach = feature.canAttachToShape ? feature.canAttachToShape(shape) : true
                            const featureSettings = shapeEntry?.features?.[feature.id]
                            const enabled = !!featureSettings

                            return (
                                <div key={feature.id} style={{marginBottom: 10, borderTop: '1px solid var(--color-border-subtle)', paddingTop: 8}}>
                                    <div className={styles.row}>
                                        <span className={styles.label}>{feature.name}</span>
                                        {enabled ? (
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => dispatch({
                                                    type: 'REMOVE_SHAPE_POWER_UP_FEATURE',
                                                    shapeId: shape.id,
                                                    powerUpId: definition.id,
                                                    featureId: feature.id,
                                                })}
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                className={styles.actionBtn}
                                                disabled={!canAttach}
                                                onClick={() => dispatch({
                                                    type: 'ADD_SHAPE_POWER_UP_FEATURE',
                                                    shapeId: shape.id,
                                                    powerUpId: definition.id,
                                                    featureId: feature.id,
                                                })}
                                            >
                                                Add
                                            </button>
                                        )}
                                    </div>

                                    {enabled && featureSettings && (
                                        <div style={{paddingLeft: 4}}>
                                            {feature.propsRenderer({
                                                shape,
                                                settings: featureSettings,
                                                update: patch => dispatch({
                                                    type: 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS',
                                                    shapeId: shape.id,
                                                    powerUpId: definition.id,
                                                    featureId: feature.id,
                                                    patch,
                                                }),
                                            })}
                                        </div>
                                    )}

                                    {!canAttach && (
                                        <div className={styles.value} style={{fontSize: 11}}>
                                            Not supported on this shape type.
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            })}

            {(shape.powerUps ?? [])
                .filter(entry => !activePowerUps.some(active => active.definition.id === entry.id))
                .map(entry => (
                    <div key={entry.id} className={styles.row}>
                        <span className={styles.label}>{getPowerUpDisplayName(entry.id)}</span>
                        <span className={styles.value}>Inactive</span>
                    </div>
                ))}
        </CollapsibleSection>
    )
}

export function UnknownDocumentPowerUpsSection({
    unknownEntries,
    dispatch,
}: {
    unknownEntries: Array<{ id: string; version: number }>
    dispatch: Dispatch<AppAction>
}) {
    if (unknownEntries.length === 0) return null
    return (
        <CollapsibleSection title="Unknown Power Ups">
            {unknownEntries.map(entry => (
                <div className={styles.row} key={entry.id}>
                    <span className={styles.label}>{getPowerUpDisplayName(entry.id)}</span>
                    <button
                        className={styles.actionBtn}
                        onClick={() => dispatch({type: 'REMOVE_DOCUMENT_POWER_UP', powerUpId: entry.id})}
                    >
                        Remove
                    </button>
                </div>
            ))}
        </CollapsibleSection>
    )
}
