import type { Shape } from './shapes'

/**
 * The document tree stores topology separately from shape data.
 * Shapes are in a flat normalized map keyed by ID.
 * This makes undo/redo cheap via structural sharing.
 */
export interface TreeNode {
  id: string
  children: TreeNode[]
}

export interface VibeDocument {
  version: number             // serialization format version
  rootNodes: TreeNode[]       // top-level pages
  shapes: Record<string, Shape>
}

// ─── Tree helpers ─────────────────────────────────────────────────────────

export function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const found = findNode(node.children, id)
    if (found) return found
  }
  return null
}

export function findParent(nodes: TreeNode[], id: string, parent: TreeNode | null = null): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return parent
    const found = findParent(node.children, id, node)
    if (found !== undefined) return found
  }
  return undefined as unknown as null
}

export function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => ({ ...n, children: removeNode(n.children, id) }))
}

export function insertNode(
  nodes: TreeNode[],
  parentId: string | null,
  node: TreeNode,
  index?: number,
): TreeNode[] {
  if (parentId === null) {
    const arr = [...nodes]
    const idx = index !== undefined ? index : arr.length
    arr.splice(idx, 0, node)
    return arr
  }
  return nodes.map(n => {
    if (n.id === parentId) {
      const children = [...n.children]
      const idx = index !== undefined ? index : children.length
      children.splice(idx, 0, node)
      return { ...n, children }
    }
    return { ...n, children: insertNode(n.children, parentId, node, index) }
  })
}

export function getAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = []
  function walk(ns: TreeNode[]) {
    for (const n of ns) {
      ids.push(n.id)
      walk(n.children)
    }
  }
  walk(nodes)
  return ids
}
