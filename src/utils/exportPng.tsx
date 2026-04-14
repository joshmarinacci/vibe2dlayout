import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import { ShapeRenderer } from '@components/canvas/ShapeRenderer'
import type { AppState } from '@store/types'

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
