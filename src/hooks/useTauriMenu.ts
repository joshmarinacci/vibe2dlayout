import {useAppDispatch, useAppState} from '@store/context'
import {createInitialDocument} from '@store/reducer'
import type {AppState} from '@store/types'
import {exportDocumentAsPdf} from '@utils/exportPdf'
import {exportPageAsPng} from '@utils/exportPng'
import {saveDoc} from '@utils/localStorageDB'
import {downloadJSON, fromJSON, uploadJSON} from '@utils/serialization'
import {useEffect, useRef} from 'react'

function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

export function useTauriMenu() {
    const {state} = useAppState()
    const dispatch = useAppDispatch()
    const stateRef = useRef<AppState>(state)

    // Keep ref current without re-registering listeners on every state change
    useEffect(() => {
        stateRef.current = state
    }, [state])

    useEffect(() => {
        if (!isTauri()) return
        const unlisten: Array<() => void> = []

        async function setup() {
            const {listen} = await import('@tauri-apps/api/event')

            unlisten.push(await listen('menu:new', () => {
                const doc = createInitialDocument()
                dispatch({type: 'LOAD_DOCUMENT', document: doc})
                dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
                dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
            }))

            unlisten.push(await listen('menu:open', () => {
                dispatch({type: 'REQUEST_DOCUMENTS_MODAL', mode: 'open'})
            }))

            unlisten.push(await listen('menu:save', () => {
                const s = stateRef.current
                try {
                    const entry = saveDoc(s.documentId, s.documentName, s.document)
                    dispatch({type: 'SET_DOCUMENT_META', id: entry.id, name: entry.name})
                } catch (err) {
                    console.error('Save failed:', err)
                }
            }))

            unlisten.push(await listen('menu:save-as', () => {
                dispatch({type: 'REQUEST_DOCUMENTS_MODAL', mode: 'save-as'})
            }))

            unlisten.push(await listen('menu:edit-palettes', () => {
                dispatch({type: 'TOGGLE_PALETTE_MODAL'})
            }))

            unlisten.push(await listen('menu:edit-themes', () => {
                dispatch({type: 'TOGGLE_THEME_MODAL'})
            }))

            unlisten.push(await listen('menu:settings', () => {
                dispatch({type: 'TOGGLE_SETTINGS_MODAL'})
            }))

            unlisten.push(await listen('menu:document-settings', () => {
                dispatch({type: 'TOGGLE_DOCUMENT_SETTINGS_MODAL'})
            }))

            unlisten.push(await listen('menu:import-json', async () => {
                try {
                    const json = await uploadJSON()
                    const doc = fromJSON(json)
                    dispatch({type: 'LOAD_DOCUMENT', document: doc})
                    dispatch({type: 'SET_ACTIVE_PAGE', pageId: doc.rootNodes[0]?.id ?? null})
                    dispatch({type: 'SET_DOCUMENT_META', id: null, name: 'Untitled'})
                } catch (err) {
                    console.error('Import failed:', err)
                }
            }))

            unlisten.push(await listen('menu:export-json', () => {
                downloadJSON(stateRef.current.document)
            }))

            unlisten.push(await listen('menu:export-png', () => {
                exportPageAsPng(stateRef.current).catch(console.error)
            }))

            unlisten.push(await listen('menu:export-pdf', () => {
                exportDocumentAsPdf(stateRef.current).catch(console.error)
            }))
        }

        setup().catch(console.error)
        return () => {
            unlisten.forEach(fn => fn())
        }
    }, [dispatch])
}
