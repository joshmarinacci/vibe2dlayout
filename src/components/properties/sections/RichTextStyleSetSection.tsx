import {createPortal} from 'react-dom'
import {useState} from 'react'
import {marked} from 'marked'
import {StyleSetEditor} from '@powerups/richText/StyleSetEditor'
import {styleSetToCSS} from '@powerups/richText/styleSetToCSS'
import type {RichTextDocumentSettings, RichTextStyleSet} from '@powerups/richText/types'
import type {AppAction} from '@store/types'
import type {Dispatch} from 'react'
import styles from '../PropertiesPanel.module.css'

const SCALE = 0.6
const PREVIEW_MD = `# Heading 1\n## Heading 2\nBody text **bold** *italic*.`

interface Props {
    styleSet: RichTextStyleSet
    source: 'document' | 'library'
    documentSettings: RichTextDocumentSettings | null
    dispatch: Dispatch<AppAction>
}

export function RichTextStyleSetSection({styleSet, source, documentSettings, dispatch}: Props) {
    const [editorOpen, setEditorOpen] = useState(false)
    const [nameText, setNameText] = useState<string | null>(null)

    const scopeClass = `rt-ps-${styleSet.id}`
    const css = styleSetToCSS(styleSet, scopeClass)
    const previewHtml = marked(PREVIEW_MD, {breaks: true, gfm: true}) as string
    const innerWidth = `${Math.round(100 / SCALE)}%`

    const displayName = nameText ?? styleSet.name

    const commitRename = () => {
        if (nameText !== null && nameText.trim() && source === 'document' && documentSettings) {
            const updated = documentSettings.styleSets.map(s =>
                s.id === styleSet.id ? {...s, name: nameText.trim()} : s
            )
            dispatch({type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS', powerUpId: 'powerup.rich-text', patch: {styleSets: updated}})
        }
        setNameText(null)
    }

    return (
        <>
            <div className={styles.section}>
                <div className={styles.row}>
                    <span className={styles.label}>Name</span>
                    {source === 'document' ? (
                        <input
                            className={styles.textInput}
                            value={displayName}
                            onChange={e => setNameText(e.target.value)}
                            onBlur={commitRename}
                            onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                if (e.key === 'Escape') setNameText(null)
                            }}
                        />
                    ) : (
                        <span className={styles.value}>{styleSet.name}</span>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div style={{
                    height: 130,
                    overflow: 'hidden',
                    background: 'var(--color-bg-canvas, #fafafa)',
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    padding: '8px 10px 4px',
                }}>
                    <style dangerouslySetInnerHTML={{__html: css}} />
                    <div style={{
                        transform: `scale(${SCALE})`,
                        transformOrigin: 'top left',
                        width: innerWidth,
                        pointerEvents: 'none',
                    }}>
                        <div className={scopeClass} dangerouslySetInnerHTML={{__html: previewHtml}} />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                {source === 'document' && (
                    <div className={styles.row}>
                        <button className={styles.actionBtn} onClick={() => setEditorOpen(true)}>
                            Edit Style Set…
                        </button>
                    </div>
                )}
                {source === 'library' && (
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => dispatch({type: 'ADD_RICH_TEXT_STYLE_SET_TO_DOCUMENT', styleSet})}
                        >
                            Add to Document
                        </button>
                    </div>
                )}
                {source === 'document' && (
                    <div className={styles.row}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => dispatch({type: 'ADD_RICH_TEXT_STYLE_SET_TO_LIBRARY', styleSet: {...styleSet}})}
                        >
                            Save to Library
                        </button>
                    </div>
                )}
                {source === 'library' && (
                    <div className={styles.row}>
                        <button
                            className={`${styles.actionBtn} ${styles.danger}`}
                            onClick={() => dispatch({type: 'REMOVE_RICH_TEXT_STYLE_SET_FROM_LIBRARY', id: styleSet.id})}
                        >
                            Delete from Library
                        </button>
                    </div>
                )}
            </div>

            {editorOpen && documentSettings && createPortal(
                <StyleSetEditor
                    styleSetId={styleSet.id}
                    settings={documentSettings}
                    dispatch={dispatch}
                    onClose={() => setEditorOpen(false)}
                />,
                document.body
            )}
        </>
    )
}
