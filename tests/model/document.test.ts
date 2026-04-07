import { describe, it, expect } from 'vitest'
import { findNode, findParent, removeNode, insertNode, getAllIds } from '../../src/model/document'
import type { TreeNode } from '../../src/model/document'

const tree: TreeNode[] = [
  {
    id: 'a',
    children: [
      { id: 'b', children: [] },
      { id: 'c', children: [{ id: 'd', children: [] }] },
    ],
  },
]

describe('findNode', () => {
  it('finds root node', () => {
    expect(findNode(tree, 'a')?.id).toBe('a')
  })
  it('finds nested node', () => {
    expect(findNode(tree, 'd')?.id).toBe('d')
  })
  it('returns null for missing id', () => {
    expect(findNode(tree, 'z')).toBeNull()
  })
})

describe('findParent', () => {
  it('returns null for root', () => {
    expect(findParent(tree, 'a')).toBeNull()
  })
  it('finds parent of direct child', () => {
    expect(findParent(tree, 'b')?.id).toBe('a')
  })
  it('finds parent of deeply nested', () => {
    expect(findParent(tree, 'd')?.id).toBe('c')
  })
})

describe('removeNode', () => {
  it('removes a root node', () => {
    const result = removeNode(tree, 'a')
    expect(result).toHaveLength(0)
  })
  it('removes a nested node', () => {
    const result = removeNode(tree, 'b')
    const a = result.find(n => n.id === 'a')
    expect(a?.children).toHaveLength(1)
    expect(a?.children[0].id).toBe('c')
  })
  it('does not modify original', () => {
    removeNode(tree, 'b')
    expect(tree[0].children).toHaveLength(2)
  })
})

describe('insertNode', () => {
  it('inserts at root level', () => {
    const newNode: TreeNode = { id: 'x', children: [] }
    const result = insertNode(tree, null, newNode)
    expect(result).toHaveLength(2)
    expect(result[1].id).toBe('x')
  })
  it('inserts at specified index', () => {
    const newNode: TreeNode = { id: 'x', children: [] }
    const result = insertNode(tree, null, newNode, 0)
    expect(result[0].id).toBe('x')
    expect(result[1].id).toBe('a')
  })
  it('inserts as child of existing node', () => {
    const newNode: TreeNode = { id: 'x', children: [] }
    const result = insertNode(tree, 'a', newNode)
    const a = result.find(n => n.id === 'a')
    expect(a?.children).toHaveLength(3)
    expect(a?.children[2].id).toBe('x')
  })
})

describe('getAllIds', () => {
  it('returns all ids in tree', () => {
    const ids = getAllIds(tree)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).toContain('c')
    expect(ids).toContain('d')
    expect(ids).toHaveLength(4)
  })
})
