import {ShapeRenderer} from '@components/canvas/ShapeRenderer'
import type {TreeNode} from '@model/document'
import {getActiveTheme} from '@model/theme'
import type {AppState} from '@store/types'
import {computeVisualBounds} from '@utils/exportBounds'
import {exporterLogger} from '@logging'
import html2canvas from 'html2canvas'
import React from 'react'
import {createRoot} from 'react-dom/client'

export interface ExportPageAsPngOptions {
    scale?: number
    transparentBackground?: boolean
}

export interface RenderPageToBytesOptions {
    maxSize?: number  // longest-side pixel limit for thumbnail, default 1200
    border?: number   // white border width in output pixels, default 16
}

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
    for (const n of nodes) {
        if (n.id === id) return n
        const found = findNode(n.children, id)
        if (found) return found
    }
    return null
}

/**
 * Renders the active page to a PNG Uint8Array suitable for embedding in a .limn file.
 * Scales the page to fit within maxSize on the longest side, and adds a decorative
 * white border with a small "Limn" label. Throws (does not alert) if the page has no
 * fixed size, so callers can show a user-friendly message.
 */
export async function renderPageToBytes(state: AppState, options?: RenderPageToBytesOptions): Promise<Uint8Array> {
    const pageId = state.activePageId
    if (!pageId) throw new Error('No active page')

    const page = state.document.shapes[pageId]
    if (!page || page.type !== 'page') throw new Error('No page found')
    if (!page.fixedSize) throw new Error('PNG thumbnail requires a fixed-size page. Set a width and height in the properties panel first.')

    const pageNode = state.document.rootNodes.find(n => n.id === pageId)
    if (!pageNode) throw new Error('Page node not found')

    const {width, height} = page.fixedSize
    const maxSize = options?.maxSize ?? 1200
    const border = options?.border ?? 16
    const renderScale = Math.min(1, maxSize / Math.max(width, height))

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
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

        const canvas = await html2canvas(container, {
            width,
            height,
            scale: renderScale,
            useCORS: true,
            backgroundColor: page.background,
            logging: false,
        })

        // Compose final thumbnail: white border + page render + gray outline + "Limn" label
        const final = document.createElement('canvas')
        final.width = canvas.width + 2 * border
        final.height = canvas.height + 2 * border
        const ctx = final.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, final.width, final.height)
        ctx.drawImage(canvas, border, border)
        ctx.strokeStyle = '#cccccc'
        ctx.lineWidth = 1
        ctx.strokeRect(border - 0.5, border - 0.5, canvas.width + 1, canvas.height + 1)
        ctx.font = '10px sans-serif'
        ctx.fillStyle = '#aaaaaa'
        ctx.textAlign = 'right'
        ctx.fillText('Limn', final.width - 4, final.height - 4)

        const dataUrl = final.toDataURL('image/png')
        const binary = atob(dataUrl.split(',')[1])
        return Uint8Array.from(binary, c => c.charCodeAt(0))
    } finally {
        root.unmount()
        document.body.removeChild(container)
    }
}

export async function exportGroupAsPng(groupId: string, state: AppState): Promise<void> {
    exporterLogger.info('Exporting group as PNG', {groupId})
    const group = state.document.shapes[groupId]
    if (!group || group.type !== 'group') throw new Error('Shape is not a group')

    const groupNode = findNode(state.document.rootNodes, groupId)
    if (!groupNode) throw new Error('Group node not found')

    const theme = getActiveTheme(state.document)

    // Compute the true visual bounds of all children (accounts for rotation/scale/skew).
    const bounds = computeVisualBounds(groupNode.children, state.document.shapes)

    // Add a small margin so anti-aliased edges aren't hard-cut.
    const MARGIN = 4
    const canvasW = Math.ceil(bounds.width) + MARGIN * 2
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
                    dispatch: () => {
                    },
                    handDrawn: theme.handDrawn,
                    themeFontFamily: theme.fontFamily,
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
        exporterLogger.info('Exported group as PNG', {groupId})
    } finally {
        root.unmount()
        document.body.removeChild(container)
    }
}

export async function exportPageAsPng(state: AppState, options?: ExportPageAsPngOptions): Promise<void> {
    exporterLogger.info('Exporting page as PNG', {
        pageId: state.activePageId,
        scale: options?.scale,
        transparentBackground: options?.transparentBackground ?? false,
    })
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

    const {width, height} = page.fixedSize

    // Create an off-screen container. position:fixed makes it a containing
    // block so that absolutely-positioned shape children position correctly.
    const transparentBackground = options?.transparentBackground ?? false
    const background = transparentBackground ? 'transparent' : page.background

    const container = document.createElement('div')
    container.style.cssText = `
    position: fixed;
    left: ${-(width + 200)}px;
    top: 0;
    width: ${width}px;
    height: ${height}px;
    background: ${background};
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
                    dispatch: () => {
                    },
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
            scale: options?.scale ?? (window.devicePixelRatio || 2),
            useCORS: true,
            backgroundColor: transparentBackground ? null : page.background,
            logging: false,
        })

        const url = canvas.toDataURL('image/png')
        const a = document.createElement('a')
        a.href = url
        a.download = `${state.documentName || 'export'}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        exporterLogger.info('Exported page as PNG', {pageId})
    } finally {
        root.unmount()
        document.body.removeChild(container)
    }
}
