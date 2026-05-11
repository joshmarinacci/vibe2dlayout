import {useAppDispatch, useAppState} from '@store/context'
import {createInitialDocument} from '@store/reducer'
import type {AppState} from '@store/types'
import {exportDocumentAsPdf} from '@utils/exportPdf'
import {exportPageAsPng} from '@utils/exportPng'
import {tauriOpenFile, tauriSaveAsFile, tauriSaveFile} from '@utils/tauriStorage'
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
                dispatch({type: 'SET_FILE_PATH', path: null})
            }))

            unlisten.push(await listen('menu:open', async () => {
                try {
                    const result = await tauriOpenFile()
                    if (!result) return
                    dispatch({type: 'LOAD_DOCUMENT', document: result.document})
                    dispatch({type: 'SET_ACTIVE_PAGE', pageId: result.document.rootNodes[0]?.id ?? null})
                    dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                    dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                } catch (err) {
                    console.error('Open failed:', err)
                }
            }))

            unlisten.push(await listen('menu:save', async () => {
                const s = stateRef.current
                try {
                    if (s.currentFilePath) {
                        await tauriSaveFile(s.currentFilePath, s.document)
                        dispatch({type: 'SET_DOCUMENT_META', id: null, name: s.documentName})
                    } else {
                        const result = await tauriSaveAsFile(s.document, s.documentName)
                        if (result) {
                            dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                            dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                        }
                    }
                } catch (err) {
                    console.error('Save failed:', err)
                }
            }))

            unlisten.push(await listen('menu:save-as', async () => {
                const s = stateRef.current
                try {
                    const result = await tauriSaveAsFile(s.document, s.documentName)
                    if (result) {
                        dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                        dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                    }
                } catch (err) {
                    console.error('Save As failed:', err)
                }
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
