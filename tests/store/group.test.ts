import {describe, expect, it} from 'vitest'
import {findNode} from '../../src/model/document'
import {appReducer, initialState} from '../../src/store/reducer'
import type {AppState} from '../../src/store/types'
import {createShape} from '../../src/utils/shapeFactory'

function pageId(): string {
    return initialState.document.rootNodes[0].id
}

function addRect(state: AppState, x: number, y: number, w = 100, h = 50): {
    state: AppState;
    id: string
} {
    const shape = createShape('rect', x, y)
    const s = appReducer(state, {type: 'ADD_SHAPE', parentId: pageId(), shape})
    // Override transform to exact dimensions
    const s2 = appReducer(s, {
        type: 'SET_TRANSFORM',
        id: shape.id,
        transform: {x, y, width: w, height: h, rotation: 0}
    })
    return {state: s2, id: shape.id}
}

// ─── GROUP_SHAPES ─────────────────────────────────────────────────────────────

describe('GROUP_SHAPES', () => {
    it('creates a group shape in the document', () => {
        let state = initialState
        const a = addRect(state, 0, 0, 100, 50)
        state = a.state
        const b = addRect(state, 200, 0, 80, 40)
        state = b.state

        const next = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        const groups = Object.values(next.document.shapes).filter(s => s.type === 'group')
        expect(groups).toHaveLength(1)
    })

    it('removes grouped shapes from the page root and places them under the group', () => {
        let state = initialState
        const a = addRect(state, 0, 0)
        state = a.state
        const b = addRect(state, 100, 0)
        state = b.state

        const next = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        const pg = pageId()
        const pageNode = next.document.rootNodes.find(n => n.id === pg)
        // Both shapes should no longer be direct page children
        expect(pageNode?.children.some(c => c.id === a.id)).toBe(false)
        expect(pageNode?.children.some(c => c.id === b.id)).toBe(false)
        // Find the group
        const groupShape = Object.values(next.document.shapes).find(s => s.type === 'group')!
        const groupNode = findNode(next.document.rootNodes, groupShape.id)
        expect(groupNode?.children.some(c => c.id === a.id)).toBe(true)
        expect(groupNode?.children.some(c => c.id === b.id)).toBe(true)
    })

    it('group transform equals union of children absolute bounding boxes', () => {
        let state = initialState
        const a = addRect(state, 10, 20, 100, 50)
        state = a.state
        const b = addRect(state, 60, 10, 80, 60)
        state = b.state

        const next = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        const group = Object.values(next.document.shapes).find(s => s.type === 'group')!
        expect(group.type).toBe('group')
        if (group.type !== 'group') return
        // Union of {10,20,100,50} and {60,10,80,60}:
        //   x: min(10,60)=10, y: min(20,10)=10
        //   right: max(110,140)=140, bottom: max(70,70)=70
        //   width=130, height=60
        expect(group.transform.x).toBe(10)
        expect(group.transform.y).toBe(10)
        expect(group.transform.width).toBe(130)
        expect(group.transform.height).toBe(60)
    })

    it('children have local coords relative to group origin', () => {
        let state = initialState
        // rect A at absolute (50, 100, 80, 60)
        const a = addRect(state, 50, 100, 80, 60)
        state = a.state
        // rect B at absolute (150, 80, 60, 40)
        const b = addRect(state, 150, 80, 60, 40)
        state = b.state

        const next = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        // Group origin = union x:50, y:80
        const shapeA = next.document.shapes[a.id]
        const shapeB = next.document.shapes[b.id]
        expect(shapeA?.type !== 'line' && shapeA?.transform.x).toBe(0)   // 50 - 50
        expect(shapeA?.type !== 'line' && shapeA?.transform.y).toBe(20)  // 100 - 80
        expect(shapeB?.type !== 'line' && shapeB?.transform.x).toBe(100) // 150 - 50
        expect(shapeB?.type !== 'line' && shapeB?.transform.y).toBe(0)   // 80 - 80
    })

    it('does nothing when ids is empty', () => {
        const next = appReducer(initialState, {type: 'GROUP_SHAPES', ids: []})
        expect(next.document).toEqual(initialState.document)
    })
})

// ─── UNGROUP_SHAPES ───────────────────────────────────────────────────────────

describe('UNGROUP_SHAPES', () => {
    function makeGroup() {
        let state = initialState
        const a = addRect(state, 50, 100, 80, 60)
        state = a.state
        const b = addRect(state, 150, 80, 60, 40)
        state = b.state
        const grouped = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        const group = Object.values(grouped.document.shapes).find(s => s.type === 'group')!
        return {state: grouped, groupId: group.id, aId: a.id, bId: b.id}
    }

    it('removes the group shape', () => {
        const {state, groupId} = makeGroup()
        const next = appReducer(state, {type: 'UNGROUP_SHAPES', id: groupId})
        expect(next.document.shapes[groupId]).toBeUndefined()
    })

    it('restores children as direct page children', () => {
        const {state, groupId, aId, bId} = makeGroup()
        const next = appReducer(state, {type: 'UNGROUP_SHAPES', id: groupId})
        const pageNode = next.document.rootNodes.find(n => n.id === pageId())
        expect(pageNode?.children.some(c => c.id === aId)).toBe(true)
        expect(pageNode?.children.some(c => c.id === bId)).toBe(true)
    })

    it('preserves absolute positions after ungroup', () => {
        const {state, groupId, aId, bId} = makeGroup()
        const next = appReducer(state, {type: 'UNGROUP_SHAPES', id: groupId})
        const shapeA = next.document.shapes[aId]
        const shapeB = next.document.shapes[bId]
        // Original absolute positions were (50,100) and (150,80)
        expect(shapeA?.type !== 'line' && shapeA?.transform.x).toBe(50)
        expect(shapeA?.type !== 'line' && shapeA?.transform.y).toBe(100)
        expect(shapeB?.type !== 'line' && shapeB?.transform.x).toBe(150)
        expect(shapeB?.type !== 'line' && shapeB?.transform.y).toBe(80)
    })

    it('does nothing when id is not a group', () => {
        let state = initialState
        const a = addRect(state, 0, 0)
        state = a.state
        const next = appReducer(state, {type: 'UNGROUP_SHAPES', id: a.id})
        expect(next.document.shapes[a.id]).toBeDefined()
        expect(Object.keys(next.document.shapes).length).toBe(Object.keys(state.document.shapes).length)
    })
})

// ─── Group bounds recomputation ───────────────────────────────────────────────

describe('group bounds recomputation after MOVE_SHAPES', () => {
    it('expands group bounds when a child is moved out', () => {
        let state = initialState
        const a = addRect(state, 0, 0, 100, 50)
        state = a.state
        const b = addRect(state, 0, 60, 100, 50)
        state = b.state
        state = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})

        // Enter drill mode and move child B further down
        state = appReducer(state, {
            type: 'ENTER_DRILL_MODE',
            containerId: Object.values(state.document.shapes).find(s => s.type === 'group')!.id,
        })
        const groupId = Object.values(state.document.shapes).find(s => s.type === 'group')!.id
        const next = appReducer(state, {type: 'MOVE_SHAPES', ids: [b.id], dx: 0, dy: 50})

        const group = next.document.shapes[groupId]
        expect(group?.type).toBe('group')
        if (group?.type !== 'group') return
        // Group height should now span from 0 to 160 (child B moved to y=110, h=50)
        expect(group.transform.height).toBe(160)
    })
})

// ─── DELETE group ─────────────────────────────────────────────────────────────

describe('DELETE_SHAPES on group', () => {
    it('deletes group and all its children', () => {
        let state = initialState
        const a = addRect(state, 0, 0)
        state = a.state
        const b = addRect(state, 100, 0)
        state = b.state
        state = appReducer(state, {type: 'GROUP_SHAPES', ids: [a.id, b.id]})
        const groupId = Object.values(state.document.shapes).find(s => s.type === 'group')!.id

        const next = appReducer(state, {type: 'DELETE_SHAPES', ids: [groupId]})
        expect(next.document.shapes[groupId]).toBeUndefined()
        expect(next.document.shapes[a.id]).toBeUndefined()
        expect(next.document.shapes[b.id]).toBeUndefined()
    })
})
