import type {TreeNode} from '@model/document'
import type {PageShape} from '@model/shapes'
import {getActiveTheme} from '@model/theme'
import type {AppState} from '@store/types'
import {exporterLogger} from '@logging'
import {jsPDF} from 'jspdf'
import {renderPageToCanvas} from './exportPdf'

const SLIDES_POWERUP_ID = 'slides'
const NOTES_FEATURE_ID = 'speaker-notes'

function getPageNotes(shape: PageShape): string {
    const entry = shape.powerUps?.find(p => p.id === SLIDES_POWERUP_ID)
    const content = entry?.features?.[NOTES_FEATURE_ID]?.content
    return typeof content === 'string' ? content : ''
}

function stripMarkdown(text: string): string {
    return text
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*+]\s+/gm, '• ')
        .replace(/^\d+\.\s+/gm, '')
}

export async function exportSlidesWithNotesPdf(state: AppState): Promise<void> {
    exporterLogger.info('Exporting slides with notes as PDF', {documentName: state.documentName})
    const {rootNodes, shapes} = state.document
    const activeTheme = getActiveTheme(state.document)
    const handDrawn = activeTheme.handDrawn
    const themeFontFamily = activeTheme.fontFamily

    const pages = rootNodes
        .map(node => ({node, shape: shapes[node.id]}))
        .filter((p): p is { node: TreeNode; shape: PageShape } =>
            p.shape?.type === 'page' && p.shape.fixedSize != null
        )

    if (pages.length === 0) {
        alert('No fixed-size pages found. Set a width and height for at least one page first.')
        return
    }

    let pdf: jsPDF | null = null

    for (const {node, shape} of pages) {
        const {width, height} = shape.fixedSize!
        const notesAreaHeight = Math.round(height * 0.5)
        const pageH = height + notesAreaHeight

        const canvas = await renderPageToCanvas(shape, node, shapes, handDrawn, themeFontFamily)
        const imgData = canvas.toDataURL('image/png')

        if (pdf === null) {
            pdf = new jsPDF({
                unit: 'px',
                format: [width, pageH],
                orientation: width >= pageH ? 'landscape' : 'portrait',
                hotfixes: ['px_scaling'],
            })
        } else {
            pdf.addPage([width, pageH], width >= pageH ? 'landscape' : 'portrait')
        }

        pdf.addImage(imgData, 'PNG', 0, 0, width, height)

        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(1)
        pdf.line(20, height + 4, width - 20, height + 4)

        const rawNotes = getPageNotes(shape)
        if (rawNotes.trim()) {
            const notes = stripMarkdown(rawNotes)
            pdf.setFontSize(11)
            pdf.setTextColor(60, 60, 60)
            const lines = pdf.splitTextToSize(notes, width - 40)
            pdf.text(lines, 20, height + 20)
        } else {
            pdf.setFontSize(11)
            pdf.setTextColor(160, 160, 160)
            pdf.text('(no speaker notes)', 20, height + 20)
        }
    }

    if (pdf) {
        pdf.save(`${state.documentName || 'presentation'}-with-notes.pdf`)
        exporterLogger.info('Exported slides with notes as PDF', {pageCount: pages.length})
    }
}
