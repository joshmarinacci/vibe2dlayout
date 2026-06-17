import {ShapeRenderer} from '@components/canvas/ShapeRenderer'
import type {TreeNode} from '@model/document'
import type {PageShape} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import type {AppState} from '@store/types'
import {exporterLogger} from '@logging'
import html2canvas from 'html2canvas'
import {jsPDF} from 'jspdf'
import React from 'react'
import {createRoot} from 'react-dom/client'

export async function renderPageToCanvas(
    page: PageShape,
    pageNode: TreeNode,
    shapes: AppState['document']['shapes'],
    handDrawn: boolean,
    themeFontFamily: string,
): Promise<HTMLCanvasElement> {
    const {width, height} = page.fixedSize!

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
                    shapes,
                    selectedIds: [],
                    editingTextId: null,
                    dispatch: () => {
                    },
                    handDrawn,
                    themeFontFamily,
                })
            )
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })

        return await html2canvas(container, {
            width,
            height,
            scale: window.devicePixelRatio || 2,
            useCORS: true,
            backgroundColor: page.background,
            logging: false,
        })
    } finally {
        root.unmount()
        document.body.removeChild(container)
    }
}

export async function exportDocumentAsPdf(state: AppState): Promise<void> {
    exporterLogger.info('Exporting document as PDF', {documentName: state.documentName})
    const {rootNodes, shapes} = state.document
    const activeTheme = getActiveTheme(state.document)
    const handDrawn = activeTheme.handDrawn
    const themeFontFamily = activeTheme.fontFamily

    // Collect all fixed-size pages in document order
    const pages = rootNodes
        .map(node => ({node, shape: shapes[node.id]}))
        .filter((p): p is { node: TreeNode; shape: PageShape } =>
            p.shape?.type === 'page' && p.shape.fixedSize != null
        )

    if (pages.length === 0) {
        alert('No fixed-size pages found. Set a width and height for at least one page in the properties panel first.')
        return
    }

    let pdf: jsPDF | null = null

    for (const {node, shape} of pages) {
        const {width, height} = shape.fixedSize!
        const canvas = await renderPageToCanvas(shape, node, shapes, handDrawn, themeFontFamily)
        const imgData = canvas.toDataURL('image/png')

        if (pdf === null) {
            pdf = new jsPDF({
                unit: 'px',
                format: [width, height],
                orientation: width >= height ? 'landscape' : 'portrait',
                hotfixes: ['px_scaling'],
            })
        } else {
            pdf.addPage([width, height], width >= height ? 'landscape' : 'portrait')
        }

        pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    }

    if (pdf) {
        pdf.save(`${state.documentName || 'export'}.pdf`)
        exporterLogger.info('Exported document as PDF', {pageCount: pages.length})
    }
}
