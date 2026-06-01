import {describe, expect, it} from 'vitest'
import {appReducer, initialState} from '../../src/store/reducer'
import {createShape} from '../../src/utils/shapeFactory'

function buildShapeState() {
    const pageId = initialState.document.rootNodes[0].id
    const shape = createShape('rect', 100, 100)
    const stateWithShape = appReducer(initialState, {
        type: 'ADD_SHAPE',
        parentId: pageId,
        shape,
    })
    return {stateWithShape, shapeId: shape.id, pageId}
}

describe('document power ups', () => {
    it('adds one instance per power up id', () => {
        const withPhysics = appReducer(initialState, {
            type: 'ADD_DOCUMENT_POWER_UP',
            powerUpId: 'powerup.physics',
        })
        const duplicate = appReducer(withPhysics, {
            type: 'ADD_DOCUMENT_POWER_UP',
            powerUpId: 'powerup.physics',
        })
        expect(withPhysics.document.powerUps).toHaveLength(1)
        expect(duplicate.document.powerUps).toHaveLength(1)
    })

    it('removes shape-level entries when document power up is removed', () => {
        const {stateWithShape, shapeId} = buildShapeState()
        let next = appReducer(stateWithShape, {
            type: 'ADD_DOCUMENT_POWER_UP',
            powerUpId: 'powerup.physics',
        })
        next = appReducer(next, {
            type: 'ADD_SHAPE_POWER_UP_FEATURE',
            shapeId,
            powerUpId: 'powerup.physics',
            featureId: 'physics-body',
        })
        expect(next.document.shapes[shapeId].powerUps?.length).toBe(1)

        const removed = appReducer(next, {
            type: 'REMOVE_DOCUMENT_POWER_UP',
            powerUpId: 'powerup.physics',
        })

        expect(removed.document.powerUps).toHaveLength(0)
        expect(removed.document.shapes[shapeId].powerUps ?? []).toHaveLength(0)
    })
})

describe('shape power up features', () => {
    it('requires document power up to be enabled before adding feature', () => {
        const {stateWithShape, shapeId} = buildShapeState()
        const next = appReducer(stateWithShape, {
            type: 'ADD_SHAPE_POWER_UP_FEATURE',
            shapeId,
            powerUpId: 'powerup.physics',
            featureId: 'physics-body',
        })

        expect(next.document.shapes[shapeId].powerUps ?? []).toHaveLength(0)
    })

    it('adds and updates feature settings', () => {
        const {stateWithShape, shapeId} = buildShapeState()
        let next = appReducer(stateWithShape, {
            type: 'ADD_DOCUMENT_POWER_UP',
            powerUpId: 'powerup.physics',
        })
        next = appReducer(next, {
            type: 'ADD_SHAPE_POWER_UP_FEATURE',
            shapeId,
            powerUpId: 'powerup.physics',
            featureId: 'physics-body',
        })

        const entry = next.document.shapes[shapeId].powerUps?.find(p => p.id === 'powerup.physics')
        expect(entry?.features['physics-body']).toBeDefined()

        const updated = appReducer(next, {
            type: 'UPDATE_SHAPE_POWER_UP_FEATURE_SETTINGS',
            shapeId,
            powerUpId: 'powerup.physics',
            featureId: 'physics-body',
            patch: {mass: 5},
        })

        const updatedEntry = updated.document.shapes[shapeId].powerUps?.find(p => p.id === 'powerup.physics')
        expect(updatedEntry?.features['physics-body']?.mass).toBe(5)
    })
})
