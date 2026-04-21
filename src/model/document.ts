import type { Shape } from './shapes'
import type { ColorPalette } from './palette'
import type { Theme } from './theme'
import type { GridSettings } from './grid'
import type { TextStyleDef } from './textStyle'
import type { Variable } from './variable'

/**
 * The document tree stores topology separately from shape data.
 * Shapes are in a flat normalized map keyed by ID.
 * This makes undo/redo cheap via structural sharing.
 */
export interface TreeNode {
  id: string
  children: TreeNode[]
}

/**
 * A page folder is a UI-only organizational container for pages.
 * It has no canvas representation — just a name and an ordered list of page IDs.
 * Pages not in any folder appear as top-level items below all folders.
 */
export interface PageFolder {
  id: string
  name: string
  pageIds: string[]    // ordered page shape IDs in this folder
  collapsed: boolean
}

export interface VibeDocument {
  version: number             // serialization format version
  rootNodes: TreeNode[]       // top-level pages
  shapes: Record<string, Shape>
  palettes: ColorPalette[]
  themes: Theme[]             // custom + built-in themes for this document
  activeThemeId: string       // which theme applies to new shapes
  gridSettings: GridSettings  // document-level grid / snap settings
  pageFolders: PageFolder[]   // organizational folders for pages (UI-only, no canvas presence)
  textStyles: TextStyleDef[]  // named text style definitions
  variables: Variable[]       // named document-level variables
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

export function findAncestorPage(
  nodes: TreeNode[],
  id: string,
  shapes: Record<string, Shape>,
): string | null {
  for (const node of nodes) {
    if (shapes[node.id]?.type === 'page' && findNode([node], id)) return node.id
  }
  return null
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

/** Returns the first folder containing pageId, or null. */
export function findFolderForPage(folders: PageFolder[], pageId: string): PageFolder | null {
  return folders.find(f => f.pageIds.includes(pageId)) ?? null
}

/**
 * Returns IDs of root-level page nodes that are not in any folder, in rootNodes order.
 */
export function getUnfiledPageIds(
  rootNodes: TreeNode[],
  folders: PageFolder[],
  shapes: Record<string, Shape>,
): string[] {
  const filedIds = new Set(folders.flatMap(f => f.pageIds))
  return rootNodes
    .filter(n => shapes[n.id]?.type === 'page' && !filedIds.has(n.id))
    .map(n => n.id)
}
