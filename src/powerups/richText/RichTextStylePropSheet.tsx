import {marked} from 'marked'
import {styleSetToCSS} from './styleSetToCSS'
import type {RichTextStyleSet} from './types'
import styles from './RichTextStylePropSheet.module.css'

const SCALE = 0.6
const PREVIEW_MD = `# Heading 1\n## Heading 2\nBody text **bold** *italic*.`

interface Props {
    styleSet: RichTextStyleSet
    onEdit?: () => void
    onAddToDocument?: () => void
}

export function RichTextStylePropSheet({styleSet, onEdit, onAddToDocument}: Props) {
    const scopeClass = `rt-ps-${styleSet.id}`
    const css = styleSetToCSS(styleSet, scopeClass)
    const previewHtml = marked(PREVIEW_MD, {breaks: true, gfm: true}) as string
    const innerWidth = `${Math.round(100 / SCALE)}%`

    return (
        <div className={styles.sheet}>
            <div className={styles.previewOuter}>
                <style dangerouslySetInnerHTML={{__html: css}} />
                <div
                    style={{
                        transform: `scale(${SCALE})`,
                        transformOrigin: 'top left',
                        width: innerWidth,
                        pointerEvents: 'none',
                    }}
                >
                    <div className={scopeClass} dangerouslySetInnerHTML={{__html: previewHtml}} />
                </div>
            </div>
            <div className={styles.actions}>
                {onEdit && (
                    <button className={styles.btn} onClick={onEdit}>Edit Style Set…</button>
                )}
                {onAddToDocument && (
                    <button className={styles.btn} onClick={onAddToDocument}>Add to Document</button>
                )}
            </div>
        </div>
    )
}
