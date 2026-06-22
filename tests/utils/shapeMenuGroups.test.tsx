import {describe, expect, it, vi, beforeEach} from 'vitest'
import type {Shape} from '../../src/model/shapes'
import type {AppState} from '../../src/store/types'
import type {PowerUpShapeTypeDefinition} from '../../src/powerups/types'
import {
    BASIC_SHAPES,
    buildAddShapeGroups,
    buildSingleShapeGroups,
    buildPageGroups,
    buildMultiSelectGroups,
} from '../../src/utils/shapeMenuGroups'

// ── helpers ──────────────────────────────────────────────────────────────────

function makeShape(overrides: Partial<Shape> = {}): Shape {
    return {
        id: 'shape-1',
        name: 'Rect',
        type: 'rect',
        visible: true,
        locked: false,
        transform: {x: 0, y: 0, width: 100, height: 100, rotation: 0},
        fill: {type: 'solid', color: '#fff'},
        stroke: null,
        opacity: 1,
        ...overrides,
    } as unknown as Shape
}

function makePageShape(overrides: Partial<Shape> = {}): Shape {
    return {
        id: 'page-1',
        name: 'Page 1',
        type: 'page',
        visible: true,
        locked: false,
        fixedSize: true,
        transform: {x: 0, y: 0, width: 1280, height: 720, rotation: 0},
        fill: {type: 'solid', color: '#fff'},
        stroke: null,
        opacity: 1,
        ...overrides,
    } as unknown as Shape
}

// Minimal registered shape stubs for category filtering
const containerShape: PowerUpShapeTypeDefinition = {
    type: 'frame',
    name: 'Frame',
    toolMode: 'insert-frame',
    icon: null,
    category: 'containers',
    createDefault: () => makeShape({type: 'frame' as any}),
    renderShape: () => null,
}

const formShape: PowerUpShapeTypeDefinition = {
    type: 'button',
    name: 'Button',
    toolMode: 'insert-button',
    icon: null,
    category: 'forms',
    createDefault: () => makeShape({type: 'button' as any}),
    renderShape: () => null,
}

const mockupShape: PowerUpShapeTypeDefinition = {
    type: 'imagemock',
    name: 'Image Mock',
    toolMode: 'insert-imagemock',
    icon: null,
    category: 'mockups',
    createDefault: () => makeShape({type: 'imagemock' as any}),
    renderShape: () => null,
}

// Minimal AppState stub for buildPageGroups
const mockAppState = {
    document: {images: [], fonts: [], gradients: [], pages: [], pageFolders: []},
    activePageId: null,
} as unknown as AppState

// ── BASIC_SHAPES ──────────────────────────────────────────────────────────────

describe('BASIC_SHAPES', () => {
    it('includes the six core shape types', () => {
        const types = BASIC_SHAPES.map(s => s.type)
        expect(types).toContain('rect')
        expect(types).toContain('circle')
        expect(types).toContain('line')
        expect(types).toContain('text')
        expect(types).toContain('image')
        expect(types).toContain('pixelimage')
    })

    it('does not include page (pages are not child shapes)', () => {
        expect(BASIC_SHAPES.map(s => s.type)).not.toContain('page')
    })
})

// ── buildAddShapeGroups ───────────────────────────────────────────────────────

describe('buildAddShapeGroups', () => {
    it('returns one group with Shapes submenu', () => {
        const groups = buildAddShapeGroups(vi.fn(), [])
        expect(groups).toHaveLength(1)
        expect(groups[0].items[0].label).toBe('Shapes')
        expect(groups[0].items[0].submenu).toHaveLength(BASIC_SHAPES.length)
    })

    it('calls addShape with the correct type when a basic shape is clicked', () => {
        const addShape = vi.fn()
        const groups = buildAddShapeGroups(addShape, [])
        const rectItem = groups[0].items[0].submenu!.find(i => i.label === 'Rectangle')!
        rectItem.onClick!()
        expect(addShape).toHaveBeenCalledWith('rect')
    })

    it('includes Containers submenu when registry has container shapes', () => {
        const groups = buildAddShapeGroups(vi.fn(), [containerShape])
        const labels = groups[0].items.map(i => i.label)
        expect(labels).toContain('Containers')
    })

    it('includes Form Controls submenu when registry has form shapes', () => {
        const groups = buildAddShapeGroups(vi.fn(), [formShape])
        const labels = groups[0].items.map(i => i.label)
        expect(labels).toContain('Form Controls')
    })

    it('includes Mockups submenu when registry has mockup shapes', () => {
        const groups = buildAddShapeGroups(vi.fn(), [mockupShape])
        const labels = groups[0].items.map(i => i.label)
        expect(labels).toContain('Mockups')
    })

    it('omits category submenus when registry is empty', () => {
        const groups = buildAddShapeGroups(vi.fn(), [])
        const labels = groups[0].items.map(i => i.label)
        expect(labels).not.toContain('Containers')
        expect(labels).not.toContain('Form Controls')
        expect(labels).not.toContain('Mockups')
    })

    it('calls addShape with correct type from category submenus', () => {
        const addShape = vi.fn()
        const groups = buildAddShapeGroups(addShape, [containerShape])
        const containerItem = groups[0].items.find(i => i.label === 'Containers')!
        containerItem.submenu![0].onClick!()
        expect(addShape).toHaveBeenCalledWith('frame')
    })
})

// ── buildSingleShapeGroups ────────────────────────────────────────────────────

describe('buildSingleShapeGroups', () => {
    let dispatch: ReturnType<typeof vi.fn>
    let saveToLibrary: ReturnType<typeof vi.fn>
    let addShapeGroups: ReturnType<typeof buildAddShapeGroups>

    beforeEach(() => {
        dispatch = vi.fn()
        saveToLibrary = vi.fn()
        addShapeGroups = buildAddShapeGroups(vi.fn(), [])
    })

    const getGroups = (overrides: Partial<Shape> = {}, extra = []) =>
        buildSingleShapeGroups({
            shape: makeShape(overrides),
            shapeId: 'shape-1',
            dispatch,
            addShapeGroups,
            onSaveToLibrary: saveToLibrary,
            extraActionItems: extra,
        })

    it('prepends the add-shape group', () => {
        const groups = getGroups()
        // First group is the "Add shapes" group (from addShapeGroups)
        expect(groups[0].items[0].label).toBe('Shapes')
    })

    it('second group contains Duplicate and Save to Library', () => {
        const groups = getGroups()
        const labels = groups[1].items.map(i => i.label)
        expect(labels).toContain('Duplicate')
        expect(labels).toContain('Save to Library')
    })

    it('Duplicate has ⌘D shortcut', () => {
        const groups = getGroups()
        const dup = groups[1].items.find(i => i.label === 'Duplicate')!
        expect(dup.shortcut).toBe('⌘D')
    })

    it('Duplicate dispatches DUPLICATE_SHAPES with the shape id', () => {
        const groups = getGroups()
        groups[1].items.find(i => i.label === 'Duplicate')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'DUPLICATE_SHAPES', ids: ['shape-1']})
    })

    it('Save to Library calls onSaveToLibrary callback', () => {
        const groups = getGroups()
        groups[1].items.find(i => i.label === 'Save to Library')!.onClick!()
        expect(saveToLibrary).toHaveBeenCalled()
    })

    it('includes extraActionItems in the actions group', () => {
        const extra = [{label: 'Export CSS', onClick: vi.fn()}]
        const groups = buildSingleShapeGroups({
            shape: makeShape(),
            shapeId: 'shape-1',
            dispatch,
            addShapeGroups,
            onSaveToLibrary: saveToLibrary,
            extraActionItems: extra,
        })
        expect(groups[1].items.some(i => i.label === 'Export CSS')).toBe(true)
    })

    it('reorder group contains Move Up / Move Down / Bring to Front / Send to Back', () => {
        const groups = getGroups()
        const reorderLabels = groups[2].items.map(i => i.label)
        expect(reorderLabels).toEqual(['Move Up', 'Move Down', 'Bring to Front', 'Send to Back'])
    })

    it('Move Up has ⌘] shortcut', () => {
        const groups = getGroups()
        expect(groups[2].items.find(i => i.label === 'Move Up')!.shortcut).toBe('⌘]')
    })

    it('Move Down has ⌘[ shortcut', () => {
        const groups = getGroups()
        expect(groups[2].items.find(i => i.label === 'Move Down')!.shortcut).toBe('⌘[')
    })

    it('Move Up dispatches REORDER_SHAPE with direction up', () => {
        const groups = getGroups()
        groups[2].items.find(i => i.label === 'Move Up')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'REORDER_SHAPE', id: 'shape-1', direction: 'up'})
    })

    it('Bring to Front dispatches REORDER_SHAPE with direction to-front', () => {
        const groups = getGroups()
        groups[2].items.find(i => i.label === 'Bring to Front')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'REORDER_SHAPE', id: 'shape-1', direction: 'to-front'})
    })

    it('visibility group shows Hide when shape is visible', () => {
        const groups = getGroups({visible: true})
        expect(groups[3].items.find(i => i.label === 'Hide')).toBeTruthy()
    })

    it('visibility group shows Show when shape is hidden', () => {
        const groups = getGroups({visible: false})
        expect(groups[3].items.find(i => i.label === 'Show')).toBeTruthy()
    })

    it('Hide dispatches PATCH_SHAPE with visible: false', () => {
        const groups = getGroups({visible: true})
        groups[3].items.find(i => i.label === 'Hide')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'PATCH_SHAPE', id: 'shape-1', patch: {visible: false}})
    })

    it('lock group shows Lock when shape is unlocked', () => {
        const groups = getGroups({locked: false})
        expect(groups[3].items.find(i => i.label === 'Lock')).toBeTruthy()
    })

    it('lock group shows Unlock when shape is locked', () => {
        const groups = getGroups({locked: true})
        expect(groups[3].items.find(i => i.label === 'Unlock')).toBeTruthy()
    })

    it('Delete group is last with danger: true', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        const del = last.items[0]
        expect(del.label).toBe('Delete')
        expect(del.danger).toBe(true)
    })

    it('Delete dispatches DELETE_SHAPES and DESELECT_ALL', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        last.items[0].onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'DELETE_SHAPES', ids: ['shape-1']})
        expect(dispatch).toHaveBeenCalledWith({type: 'DESELECT_ALL'})
    })

    it('Delete has ⌫ shortcut', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        expect(last.items[0].shortcut).toBe('⌫')
    })
})

// ── buildPageGroups ───────────────────────────────────────────────────────────

describe('buildPageGroups', () => {
    let dispatch: ReturnType<typeof vi.fn>
    let saveAsTemplate: ReturnType<typeof vi.fn>
    let addShapeGroups: ReturnType<typeof buildAddShapeGroups>

    beforeEach(() => {
        dispatch = vi.fn()
        saveAsTemplate = vi.fn()
        addShapeGroups = buildAddShapeGroups(vi.fn(), [])
    })

    const getGroups = (shapeOverrides: Partial<Shape> = {}, isActivePage = false) =>
        buildPageGroups({
            shape: makePageShape(shapeOverrides),
            nodeId: 'page-1',
            dispatch,
            addShapeGroups,
            isActivePage,
            appState: mockAppState,
            onSaveAsTemplate: saveAsTemplate,
        })

    it('first group has Set as Active Page, Export HTML, Save as Template', () => {
        const groups = getGroups()
        const labels = groups[0].items.map(i => i.label)
        expect(labels).toContain('Set as Active Page')
        expect(labels).toContain('Export HTML…')
        expect(labels).toContain('Save as Template')
    })

    it('Set as Active Page is disabled when already active', () => {
        const groups = getGroups({}, true)
        const item = groups[0].items.find(i => i.label === 'Set as Active Page')!
        expect(item.disabled).toBe(true)
    })

    it('Set as Active Page is enabled when not active', () => {
        const groups = getGroups({}, false)
        const item = groups[0].items.find(i => i.label === 'Set as Active Page')!
        expect(item.disabled).toBe(false)
    })

    it('Export HTML is disabled when page does not have fixedSize', () => {
        const groups = getGroups({fixedSize: false} as any)
        const item = groups[0].items.find(i => i.label === 'Export HTML…')!
        expect(item.disabled).toBe(true)
    })

    it('Export HTML is enabled when page has fixedSize', () => {
        const groups = getGroups({fixedSize: true} as any)
        const item = groups[0].items.find(i => i.label === 'Export HTML…')!
        expect(item.disabled).toBeFalsy()
    })

    it('Set as Active Page dispatches SET_ACTIVE_PAGE', () => {
        const groups = getGroups()
        groups[0].items.find(i => i.label === 'Set as Active Page')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'SET_ACTIVE_PAGE', pageId: 'page-1'})
    })

    it('Save as Template calls onSaveAsTemplate callback', () => {
        const groups = getGroups()
        groups[0].items.find(i => i.label === 'Save as Template')!.onClick!()
        expect(saveAsTemplate).toHaveBeenCalled()
    })

    it('includes the add-shape group after page actions', () => {
        const groups = getGroups()
        // Second group is the add-shapes group
        expect(groups[1].items[0].label).toBe('Shapes')
    })

    it('has reorder items Move Up / Move Down / Bring to Front / Send to Back', () => {
        const groups = getGroups()
        const allLabels = groups.flatMap(g => g.items.map(i => i.label))
        expect(allLabels).toContain('Move Up')
        expect(allLabels).toContain('Move Down')
        expect(allLabels).toContain('Bring to Front')
        expect(allLabels).toContain('Send to Back')
    })

    it('Move Up dispatches REORDER_SHAPE with direction up', () => {
        const groups = getGroups()
        const reorderGroup = groups.find(g => g.items.some(i => i.label === 'Move Up'))!
        reorderGroup.items.find(i => i.label === 'Move Up')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'REORDER_SHAPE', id: 'page-1', direction: 'up'})
    })

    it('Delete is last item and has danger: true', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        expect(last.items[0].label).toBe('Delete')
        expect(last.items[0].danger).toBe(true)
    })

    it('Delete dispatches DELETE_SHAPES and DESELECT_ALL', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        last.items[0].onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'DELETE_SHAPES', ids: ['page-1']})
        expect(dispatch).toHaveBeenCalledWith({type: 'DESELECT_ALL'})
    })
})

// ── buildMultiSelectGroups ────────────────────────────────────────────────────

describe('buildMultiSelectGroups', () => {
    let dispatch: ReturnType<typeof vi.fn>

    beforeEach(() => {
        dispatch = vi.fn()
    })

    const getGroups = () =>
        buildMultiSelectGroups({selectedIds: ['a', 'b'], dispatch})

    it('first group has Duplicate and Group', () => {
        const labels = getGroups()[0].items.map(i => i.label)
        expect(labels).toContain('Duplicate')
        expect(labels).toContain('Group')
    })

    it('Duplicate has ⌘D shortcut', () => {
        const dup = getGroups()[0].items.find(i => i.label === 'Duplicate')!
        expect(dup.shortcut).toBe('⌘D')
    })

    it('Group has ⌘G shortcut', () => {
        const grp = getGroups()[0].items.find(i => i.label === 'Group')!
        expect(grp.shortcut).toBe('⌘G')
    })

    it('Duplicate dispatches DUPLICATE_SHAPES with all selected ids', () => {
        getGroups()[0].items.find(i => i.label === 'Duplicate')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'DUPLICATE_SHAPES', ids: ['a', 'b']})
    })

    it('Group dispatches GROUP_SHAPES with all selected ids', () => {
        getGroups()[0].items.find(i => i.label === 'Group')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'GROUP_SHAPES', ids: ['a', 'b']})
    })

    it('second group has all eight alignment options', () => {
        const labels = getGroups()[1].items.map(i => i.label)
        expect(labels).toContain('Align Left')
        expect(labels).toContain('Align Center')
        expect(labels).toContain('Align Right')
        expect(labels).toContain('Align Top')
        expect(labels).toContain('Align Middle')
        expect(labels).toContain('Align Bottom')
        expect(labels).toContain('Match Width')
        expect(labels).toContain('Match Height')
    })

    it('Align Left dispatches ALIGN_SHAPES with alignment left', () => {
        getGroups()[1].items.find(i => i.label === 'Align Left')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'ALIGN_SHAPES', ids: ['a', 'b'], alignment: 'left'})
    })

    it('Match Width dispatches ALIGN_SHAPES with alignment match-width', () => {
        getGroups()[1].items.find(i => i.label === 'Match Width')!.onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'ALIGN_SHAPES', ids: ['a', 'b'], alignment: 'match-width'})
    })

    it('last group has Delete with danger: true', () => {
        const groups = getGroups()
        const last = groups[groups.length - 1]
        expect(last.items[0].label).toBe('Delete')
        expect(last.items[0].danger).toBe(true)
    })

    it('Delete dispatches DELETE_SHAPES and DESELECT_ALL', () => {
        const groups = getGroups()
        groups[groups.length - 1].items[0].onClick!()
        expect(dispatch).toHaveBeenCalledWith({type: 'DELETE_SHAPES', ids: ['a', 'b']})
        expect(dispatch).toHaveBeenCalledWith({type: 'DESELECT_ALL'})
    })
})
