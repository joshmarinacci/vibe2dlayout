import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { ShapeRenderer } from '@components/canvas/ShapeRenderer'
import type { AppState } from '@store/types'
import { getActiveTheme } from '@model/theme'
import type { TreeNode } from '@model/document'
import type { BoundingBox } from '@model/transform'
import type { Shape } from '@model/shapes'

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children, id)
    if (found) return found
  }
  return null
}

/**
 * Transform a point (px, py) — relative to shape center — through the CSS
 * transform stack matching buildCSSTransform's output order:
 *   rotate(θ) scaleX(sx) scaleY(sy) skewX(kx) skewY(ky)
 * CSS applies listed transforms left-to-right to the coordinate system, which
 * means points are transformed right-to-left: skewY → skewX → scaleY → scaleX → rotate.
 */
function applyTransform(px: number, py: number, t: BoundingBox): [number, number] {
  const kx = ((t.skewX ?? 0) * Math.PI) / 180
  const ky = ((t.skewY ?? 0) * Math.PI) / 180
  const sx = t.scaleX ?? 1
  const sy = t.scaleY ?? 1
  const θ  = (t.rotation * Math.PI) / 180

  // skewY: (x, y) → (x, y + x·tan(ky))
  py = py + px * Math.tan(ky)
  // skewX: (x, y) → (x + y·tan(kx), y)
  px = px + py * Math.tan(kx)
  // scaleY
  py = py * sy
  // scaleX
  px = px * sx
  // rotate
  const cos = Math.cos(θ), sin = Math.sin(θ)
  return [px * cos - py * sin, px * sin + py * cos]
}

/**
 * Return the four corners of a shape in parent-local coordinates, fully
 * accounting for rotation, scale and skew.
 */
function shapeCorners(t: BoundingBox): [number, number][] {
  const cx = t.x + t.width  / 2
  const cy = t.y + t.height / 2
  const hw = t.width  / 2
  const hh = t.height / 2
  return ([ [-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh] ] as [number, number][])
    .map(([px, py]) => {
      const [rx, ry] = applyTransform(px, py, t)
      return [cx + rx, cy + ry] as [number, number]
    })
}

/**
 * Compute the axis-aligned visual bounding box of a set of tree nodes,
 * accounting for each shape's transforms. Does not recurse into children
 * (containers are responsible for their own overflow).
 */
function computeVisualBounds(nodes: TreeNode[], shapes: Record<string, Shape>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const node of nodes) {
    const shape = shapes[node.id]
    if (!shape || shape.type === 'line') continue
    for (const [x, y] of shapeCorners(shape.transform as BoundingBox)) {
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

export async function exportGroupAsPng(groupId: string, state: AppState): Promise<void> {
  const group = state.document.shapes[groupId]
  if (!group || group.type !== 'group') throw new Error('Shape is not a group')

  const groupNode = findNode(state.document.rootNodes, groupId)
  if (!groupNode) throw new Error('Group node not found')

  const theme = getActiveTheme(state.document)

  // Compute the true visual bounds of all children (accounts for rotation/scale/skew).
  const bounds = computeVisualBounds(groupNode.children, state.document.shapes)

  // Add a small margin so anti-aliased edges aren't hard-cut.
  const MARGIN = 4
  const canvasW = Math.ceil(bounds.width)  + MARGIN * 2
  const canvasH = Math.ceil(bounds.height) + MARGIN * 2

  // Offset: shift content so the visual top-left lands at (MARGIN, MARGIN).
  const offsetX = -bounds.x + MARGIN
  const offsetY = -bounds.y + MARGIN

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: ${-(canvasW + 200)}px;
    top: 0;
    width: ${canvasW}px;
    height: ${canvasH}px;
  `
  document.body.appendChild(container)

  const inner = document.createElement('div')
  inner.style.cssText = `
    position: absolute;
    left: ${offsetX}px;
    top: ${offsetY}px;
    width: ${Math.ceil(bounds.width)}px;
    height: ${Math.ceil(bounds.height)}px;
  `
  container.appendChild(inner)

  const root = createRoot(inner)
  try {
    await new Promise<void>(resolve => {
      root.render(
        React.createElement(ShapeRenderer, {
          nodes: groupNode.children,
          shapes: state.document.shapes,
          selectedIds: [],
          editingTextId: null,
          dispatch: () => {},
          handDrawn: theme.handDrawn,
          themeFontFamily: theme.fontFamily,
          textStyles: state.document.textStyles,
          variables: state.document.variables,
        })
      )
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const canvas = await html2canvas(container, {
      width: canvasW,
      height: canvasH,
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.documentName || 'export'}-group.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}

export async function exportPageAsPng(state: AppState): Promise<void> {
  const pageId = state.activePageId
  if (!pageId) throw new Error('No active page')

  const page = state.document.shapes[pageId]
  if (!page || page.type !== 'page') throw new Error('No page found')

  if (!page.fixedSize) {
    alert('PNG export requires a fixed-size page. Set a width and height for the page in the properties panel first.')
    return
  }

  const pageNode = state.document.rootNodes.find(n => n.id === pageId)
  if (!pageNode) throw new Error('Page node not found')

  const { width, height } = page.fixedSize

  // Create an off-screen container. position:fixed makes it a containing
  // block so that absolutely-positioned shape children position correctly.
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: ${-(width + 200)}px;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    background: ${page.background};
    overflow: hidden;
  `
  document.body.appendChild(container)

  const root = createRoot(container)
  try {
    // Render shapes at natural (1:1) scale with no selection highlights
    await new Promise<void>(resolve => {
      root.render(
        React.createElement(ShapeRenderer, {
          nodes: pageNode.children,
          shapes: state.document.shapes,
          selectedIds: [],
          editingTextId: null,
          dispatch: () => {},
          handDrawn: getActiveTheme(state.document).handDrawn,
          themeFontFamily: getActiveTheme(state.document).fontFamily,
        })
      )
      // Two rAFs: first lets React flush, second lets the browser paint
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const canvas = await html2canvas(container, {
      width,
      height,
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      backgroundColor: page.background,
      logging: false,
    })

    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.documentName || 'export'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
