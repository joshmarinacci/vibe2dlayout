import {useAppDispatch, useAppState} from '@store/context'
import {createPortal} from 'react-dom'
import {useState} from 'react'
import {ContextMenu, type ContextMenuGroup} from './ContextMenu'
import styles from './StylesSection.module.css'
import rowStyles from './StyleRow.module.css'
import {StyleSetEditor} from '@powerups/richText/StyleSetEditor'
import type {RichTextDocumentSettings, RichTextStyleSet} from '@powerups/richText/types'
import {generateId} from '@utils/idgen'

const POWER_UP_ID = 'powerup.rich-text'

function getRichTextSettings(state: ReturnType<typeof useAppState>['state']): RichTextDocumentSettings | null {
    const entry = state.document.powerUps?.find(p => p.id === POWER_UP_ID)
    if (!entry) return null
    return entry.settings as unknown as RichTextDocumentSettings
}

export function RichTextStyleSetsSection() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const settings = getRichTextSettings(state)

    const [collapsed, setCollapsed] = useState(false)
    const [editorStyleSetId, setEditorStyleSetId] = useState<string | null>(null)
    const [ctxMenu, setCtxMenu] = useState<{x: number; y: number; styleSet: RichTextStyleSet} | null>(null)

    if (!settings) return null

    const updateSettings = (patch: Partial<RichTextDocumentSettings>) =>
        dispatch({type: 'UPDATE_DOCUMENT_POWER_UP_SETTINGS', powerUpId: POWER_UP_ID, patch})

    const handleDuplicate = (ss: RichTextStyleSet) => {
        const copy: RichTextStyleSet = JSON.parse(JSON.stringify(ss))
        copy.id = generateId()
        copy.name = ss.name + ' Copy'
        updateSettings({styleSets: [...settings.styleSets, copy]})
        dispatch({type: 'SELECT_RICH_TEXT_STYLE_SET', id: copy.id, source: 'document'})
    }

    const handleDelete = (id: string) => {
        const remaining = settings.styleSets.filter(s => s.id !== id)
        if (remaining.length > 0) {
            updateSettings({styleSets: remaining})
            if (state.selectedRichTextStyleSetId === id) {
                dispatch({type: 'DESELECT_RICH_TEXT_STYLE_SET'})
            }
        }
    }

    const ctxGroups: ContextMenuGroup[] = ctxMenu ? [
        {items: [
            {label: 'Edit…', onClick: () => { setEditorStyleSetId(ctxMenu.styleSet.id); setCtxMenu(null) }},
            {label: 'Duplicate', onClick: () => { handleDuplicate(ctxMenu.styleSet); setCtxMenu(null) }},
        ]},
        {items: [
            {label: 'Save to Library', onClick: () => {
                dispatch({type: 'ADD_RICH_TEXT_STYLE_SET_TO_LIBRARY', styleSet: {...ctxMenu.styleSet, id: generateId()}})
                setCtxMenu(null)
            }},
        ]},
        {items: [
            {label: 'Delete', danger: true, disabled: settings.styleSets.length <= 1, onClick: () => { handleDelete(ctxMenu.styleSet.id); setCtxMenu(null) }},
        ]},
    ] : []

    const editorSettings = getRichTextSettings(state)

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.headerLabel} onClick={() => setCollapsed(v => !v)}>
                    <span className={`${styles.chevron} ${collapsed ? '' : styles.chevronOpen}`}>›</span>
                    <span className={styles.label}>Rich Text Styles</span>
                </div>
            </div>

            {!collapsed && settings.styleSets.map(ss => (
                <div
                    key={ss.id}
                    className={`${rowStyles.row} ${state.selectedRichTextStyleSetId === ss.id && state.selectedRichTextStyleSetSource === 'document' ? rowStyles.selected : ''}`}
                    onClick={() => dispatch({type: 'SELECT_RICH_TEXT_STYLE_SET', id: ss.id, source: 'document'})}
                    onDoubleClick={() => setEditorStyleSetId(ss.id)}
                    onContextMenu={e => { e.preventDefault(); setCtxMenu({x: e.clientX, y: e.clientY, styleSet: ss}) }}
                    title={ss.name}
                >
                    <div style={{display: 'flex', gap: 2, flexShrink: 0}}>
                        <div style={{width: 10, height: 10, borderRadius: 2, background: ss.styles.h1.color, border: '1px solid rgba(0,0,0,0.1)'}}/>
                        <div style={{width: 10, height: 10, borderRadius: 2, background: ss.styles.body.color, border: '1px solid rgba(0,0,0,0.1)'}}/>
                    </div>
                    <span className={rowStyles.name}>{ss.name}</span>
                </div>
            ))}

            {!collapsed && settings.styleSets.length === 0 && (
                <div style={{padding: '4px 12px', fontSize: 11, color: 'var(--color-text-disabled)'}}>No styles</div>
            )}

            {editorStyleSetId && editorSettings && createPortal(
                <StyleSetEditor
                    styleSetId={editorStyleSetId}
                    settings={editorSettings}
                    dispatch={dispatch}
                    onClose={() => setEditorStyleSetId(null)}
                />,
                document.body
            )}

            {ctxMenu && createPortal(
                <ContextMenu x={ctxMenu.x} y={ctxMenu.y} groups={ctxGroups} onClose={() => setCtxMenu(null)} />,
                document.body
            )}
        </div>
    )
}
