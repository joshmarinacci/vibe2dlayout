import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { ShapeRenderer } from '@components/canvas/ShapeRenderer'
import type { AppState } from '@store/types'
import { getActiveTheme } from '@model/theme'
import type { TreeNode } from '@model/document'

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    const found = findNode(n.children, id)
    if (found) return found
  }
  return null
}

export async function exportGroupAsPng(groupId: string, state: AppState): Promise<void> {
  const group = state.document.shapes[groupId]
  if (!group || group.type !== 'group') throw new Error('Shape is not a group')

  const groupNode = findNode(state.document.rootNodes, groupId)
  if (!groupNode) throw new Error('Group node not found')

  const { width, height } = group.transform
  const theme = getActiveTheme(state.document)

  // Add padding so CSS-transformed (rotated/scaled/skewed) shapes that visually
  // overflow their bounding box are not clipped by the container edge.
  const PAD = 200
  const totalW = width + PAD * 2
  const totalH = height + PAD * 2

  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: ${-(totalW + 200)}px;
    top: 0;
    width: ${totalW}px;
    height: ${totalH}px;
  `
  document.body.appendChild(container)

  // Inner div translates all children by PAD so they sit in the centre of the
  // padded container rather than at its top-left corner.
  const inner = document.createElement('div')
  inner.style.cssText = `
    position: absolute;
    left: ${PAD}px;
    top: ${PAD}px;
    width: ${width}px;
    height: ${height}px;
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
      width: totalW,
      height: totalH,
      scale: window.devicePixelRatio || 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })

    // Crop out the padding to produce a canvas sized exactly to the group.
    const scale = window.devicePixelRatio || 2
    const cropped = document.createElement('canvas')
    cropped.width  = width  * scale
    cropped.height = height * scale
    const ctx = cropped.getContext('2d')!
    ctx.drawImage(canvas,
      PAD * scale, PAD * scale, width * scale, height * scale,
      0, 0, width * scale, height * scale,
    )

    const url = cropped.toDataURL('image/png')
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
