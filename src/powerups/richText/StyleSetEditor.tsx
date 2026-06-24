import type {AppAction} from '@store/types'
import {useAppState} from '@store/context'
import {generateId} from '@utils/idgen'
import {X} from 'lucide-react'
import {useRef, useState} from 'react'
import type {Dispatch} from 'react'
import {marked} from 'marked'
import {StyleElementEditor} from './StyleElementEditor'
import styles from './StyleSetEditor.module.css'
import {styleSetToCSS} from './styleSetToCSS'
import type {RichTextDocumentSettings, RichTextStyleEntry, RichTextStyleSet, StyleKey} from './types'

const ELEMENT_LABELS: Array<{key: StyleKey; label: string}> = [
    {key: 'body', label: 'Body'},
    {key: 'h1', label: 'H1 Heading'},
    {key: 'h2', label: 'H2 Heading'},
    {key: 'h3', label: 'H3 Heading'},
    {key: 'blockquote', label: 'Blockquote'},
    {key: 'code', label: 'Code (inline)'},
    {key: 'codeBlock', label: 'Code Block'},
    {key: 'link', label: 'Link'},
]

const PREVIEW_MARKDOWN = `# Heading 1\n## Heading 2\n### Heading 3\n\nBody text with **bold** and *italic*. Try \`inline code\` too.\n\n> A blockquote paragraph\n\n[A link](#) and a [second link](#)`

const POWER_UP_ID = 'powerup.rich-text'

interface Props {
    styleSetId: string
    settings: RichTextDocumentSettings
    dispatch: Dispatch<AppAction>
    onClose: () => void
}

export function StyleSetEditor({styleSetId, settings, dispatch, onClose}: Props) {
    const {state} = useAppState()
    const customFontNames = state.document.customFonts.map(f => f.name)
    const [activeId, setActiveId] = useState(styleSetId)
    const [selectedKey, setSelectedKey] = useState<StyleKey>('body')
    const [renaming, setRenaming] = useState(false)

    const [pos, setPos] = useState({x: Math.max(0, window.innerWidth / 2 - 330), y: 80})
    const dragStart = useRef<{mx: number; my: number; px: number; py: number} | null>(null)

    const styleSet = settings.styleSets.find(s => s.id === activeId) ?? settings.styleSets.find(s => s.id === styleSetId) ?? settings.styleSets[0]

    const updateSettings = (patch: Partial<RichTextDocumentSettings>) =>
        dispatch({type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS', powerUpId: POWER_UP_ID, patch})

    const updateStyleSet = (patch: Partial<RichTextStyleSet>) => {
        const updated = settings.styleSets.map(s =>
            s.id === styleSet.id ? {...s, ...patch} : s
        )
        updateSettings({styleSets: updated})
    }

    const updateEntry = (key: StyleKey, patch: Partial<RichTextStyleEntry>) => {
        updateStyleSet({styles: {...styleSet.styles, [key]: {...styleSet.styles[key], ...patch}}})
    }

    const onHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button, input')) return
        e.preventDefault()
        dragStart.current = {mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y}
        const onMove = (me: MouseEvent) => {
            if (!dragStart.current) return
            setPos({
                x: dragStart.current.px + me.clientX - dragStart.current.mx,
                y: dragStart.current.py + me.clientY - dragStart.current.my,
            })
        }
        const onUp = () => {
            dragStart.current = null
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    const handleDuplicate = () => {
        const copy: RichTextStyleSet = JSON.parse(JSON.stringify(styleSet))
        copy.id = generateId()
        copy.name = styleSet.name + ' Copy'
        updateSettings({styleSets: [...settings.styleSets, copy]})
        setActiveId(copy.id)
        setRenaming(true)
    }

    const handleSaveToLibrary = () => {
        const copy: RichTextStyleSet = JSON.parse(JSON.stringify(styleSet))
        copy.id = generateId()
        dispatch({type: 'ADD_RICH_TEXT_STYLE_SET_TO_LIBRARY', styleSet: copy})
    }

    const css = styleSetToCSS(styleSet, 'rt-preview')
    const previewHtml = marked(PREVIEW_MARKDOWN, {breaks: true, gfm: true}) as string

    return (
        <div
            className={styles.modal}
            style={{left: pos.x, top: pos.y}}
        >
            <div className={styles.header} onMouseDown={onHeaderMouseDown}>
                <div className={styles.title}>
                    {renaming ? (
                        <input
                            autoFocus
                            className={styles.titleInput}
                            value={styleSet.name}
                            onChange={e => updateStyleSet({name: e.target.value})}
                            onBlur={() => setRenaming(false)}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setRenaming(false) }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span>Edit Style Set: "{styleSet.name}"</span>
                    )}
                </div>
                <button className={styles.closeBtn} onClick={onClose}><X size={16}/></button>
            </div>

            <div className={styles.body}>
                <div className={styles.elementList}>
                    {ELEMENT_LABELS.map(({key, label}) => (
                        <button
                            key={key}
                            className={`${styles.elementBtn} ${selectedKey === key ? styles.active : ''}`}
                            onClick={() => setSelectedKey(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className={styles.editorPanel}>
                    <StyleElementEditor
                        entry={styleSet.styles[selectedKey]}
                        customFonts={customFontNames}
                        onChange={patch => updateEntry(selectedKey, patch)}
                    />
                </div>
            </div>

            <div className={styles.previewArea}>
                <div className={styles.previewLabel}>Preview</div>
                <style dangerouslySetInnerHTML={{__html: css}} />
                <div
                    className="rt-preview"
                    dangerouslySetInnerHTML={{__html: previewHtml}}
                    style={{fontSize: 'initial'}}
                />
            </div>

            <div className={styles.footer}>
                <button className={styles.btn} onClick={() => setRenaming(r => !r)}>Rename…</button>
                <button className={styles.btn} onClick={handleDuplicate}>Duplicate</button>
                <button className={styles.btn} onClick={handleSaveToLibrary}>Save to Library</button>
                <div className={styles.footerSpacer} />
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>Close</button>
            </div>
        </div>
    )
}
