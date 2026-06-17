import {notifyPowerUpsDocumentSaved} from '@hooks/usePowerUpsRuntime'
import {getAllKnownPowerUpTauriMenuIds, getPowerUpByTauriMenuId, runPowerUpMenuAction} from '@powerups/registry'
import {useAppDispatch, useAppState} from '@store/context'
import {createInitialDocument} from '@store/reducer'
import type {AppState} from '@store/types'
import {exportDocumentAsPdf} from '@utils/exportPdf'
import {exportPageAsHtml} from '@utils/exportHtml'
import {exportPhysicsHtml} from '@utils/exportPhysicsHtml'
import {exportPageAsPng, renderPageToBytes} from '@utils/exportPng'
import {encodeLimnPng} from '@utils/limnFile'
import {shortcutEvents} from '@utils/shortcutEvents'
import {tauriOpenFile, tauriOpenLimnFile, tauriSaveAsFile, tauriSaveAsLimnFile, tauriSaveFile} from '@utils/tauriStorage'
import {appLogger, exporterLogger} from '@logging'
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
                    appLogger.info('Opening document from native menu')
                    const result = await tauriOpenFile()
                    if (!result) return
                    dispatch({type: 'LOAD_DOCUMENT', document: result.document})
                    dispatch({type: 'SET_ACTIVE_PAGE', pageId: result.document.rootNodes[0]?.id ?? null})
                    dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                    dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                    appLogger.info('Opened document from native menu', {
                        name: result.name,
                        rootNodes: result.document.rootNodes.length,
                        shapeCount: Object.keys(result.document.shapes).length,
                    })
                } catch (err) {
                    appLogger.error('Open failed', err)
                }
            }))

            unlisten.push(await listen('menu:save', async () => {
                const s = stateRef.current
                try {
                    appLogger.info('Saving document from native menu', {hasPath: Boolean(s.currentFilePath)})
                    if (s.currentFilePath) {
                        await tauriSaveFile(s.currentFilePath, s.document)
                        dispatch({type: 'SET_DOCUMENT_META', id: null, name: s.documentName})
                        await notifyPowerUpsDocumentSaved(stateRef.current, dispatch)
                    } else {
                        const result = await tauriSaveAsFile(s.document, s.documentName)
                        if (result) {
                            dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                            dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                            await notifyPowerUpsDocumentSaved(stateRef.current, dispatch)
                        }
                    }
                } catch (err) {
                    appLogger.error('Save failed', err)
                }
            }))

            unlisten.push(await listen('menu:save-as', async () => {
                const s = stateRef.current
                try {
                    appLogger.info('Save As from native menu')
                    const result = await tauriSaveAsFile(s.document, s.documentName)
                    if (result) {
                        dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                        dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                        await notifyPowerUpsDocumentSaved(stateRef.current, dispatch)
                    }
                } catch (err) {
                    appLogger.error('Save As failed', err)
                }
            }))

            unlisten.push(await listen('menu:save-limn', async () => {
                const s = stateRef.current
                try {
                    exporterLogger.info('Saving Limn file via native menu')
                    const thumbnailBytes = await renderPageToBytes(s)
                    const pngBytes = encodeLimnPng(thumbnailBytes, s.document)
                    await tauriSaveAsLimnFile(pngBytes, s.documentName)
                } catch (err) {
                    appLogger.error('Save as Limn failed', err)
                }
            }))

            unlisten.push(await listen('menu:open-limn', async () => {
                try {
                    appLogger.info('Opening Limn file via native menu')
                    const result = await tauriOpenLimnFile()
                    if (!result) return
                    dispatch({type: 'LOAD_DOCUMENT', document: result.document})
                    dispatch({type: 'SET_ACTIVE_PAGE', pageId: result.document.rootNodes[0]?.id ?? null})
                    dispatch({type: 'SET_DOCUMENT_META', id: null, name: result.name})
                    dispatch({type: 'SET_FILE_PATH', path: result.filePath})
                } catch (err) {
                    appLogger.error('Open Limn failed', err)
                }
            }))

            unlisten.push(await listen('menu:toggle-left-panel', () => {
                dispatch({type: 'TOGGLE_LEFT_PANEL'})
            }))

            unlisten.push(await listen('menu:toggle-right-panel', () => {
                dispatch({type: 'TOGGLE_RIGHT_PANEL'})
            }))

            unlisten.push(await listen('menu:toggle-grid', () => {
                const s = stateRef.current
                dispatch({
                    type: 'UPDATE_GRID_SETTINGS',
                    patch: {snapEnabled: !s.document.gridSettings.snapEnabled},
                })
            }))

            unlisten.push(await listen('menu:toggle-snap', () => {
                const s = stateRef.current
                dispatch({
                    type: 'UPDATE_GRID_SETTINGS',
                    patch: {snapAlignment: !(s.document.gridSettings.snapAlignment ?? true)},
                })
            }))

            unlisten.push(await listen('menu:toggle-theme', () => {
                window.dispatchEvent(new CustomEvent('limn:toggle-theme'))
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
                exporterLogger.info('Exporting PNG via native menu')
                exportPageAsPng(stateRef.current).catch(err => exporterLogger.error('PNG export failed', err))
            }))

            unlisten.push(await listen('menu:export-pdf', () => {
                exporterLogger.info('Exporting PDF via native menu')
                exportDocumentAsPdf(stateRef.current).catch(err => exporterLogger.error('PDF export failed', err))
            }))

            unlisten.push(await listen('menu:export-html', () => {
                exporterLogger.info('Exporting HTML via native menu')
                exportPageAsHtml(stateRef.current)
            }))
            unlisten.push(await listen('menu:toggle-log-console', () => {
                dispatch({type: 'TOGGLE_LOG_CONSOLE'})
            }))

            unlisten.push(await listen('menu:duplicate', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length > 0) {
                    dispatch({type: 'DUPLICATE_SHAPES', ids})
                    shortcutEvents.emit('⌘D', 'Duplicate selected')
                }
            }))

            unlisten.push(await listen('menu:group', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length > 1) {
                    dispatch({type: 'GROUP_SHAPES', ids})
                    shortcutEvents.emit('⌘G', 'Group selected')
                }
            }))

            unlisten.push(await listen('menu:ungroup', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length === 1) {
                    const shape = stateRef.current.document.shapes[ids[0]]
                    if (shape?.type === 'group') {
                        dispatch({type: 'UNGROUP_SHAPES', id: ids[0]})
                        shortcutEvents.emit('⌘⇧G', 'Ungroup')
                    }
                }
            }))

            unlisten.push(await listen('menu:bring-forward', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length === 1) {
                    dispatch({type: 'REORDER_SHAPE', id: ids[0], direction: 'up'})
                    shortcutEvents.emit('⌘]', 'Bring forward')
                }
            }))

            unlisten.push(await listen('menu:send-backward', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length === 1) {
                    dispatch({type: 'REORDER_SHAPE', id: ids[0], direction: 'down'})
                    shortcutEvents.emit('⌘[', 'Send backward')
                }
            }))

            unlisten.push(await listen('menu:delete', () => {
                const ids = stateRef.current.selection.ids
                if (ids.length > 0) {
                    dispatch({type: 'DELETE_SHAPES', ids})
                    dispatch({type: 'DESELECT_ALL'})
                    shortcutEvents.emit('⌫', 'Delete selected')
                }
            }))

            unlisten.push(await listen('menu:powerups:action:physics:export-html', () => {
                const s = stateRef.current
                exportPhysicsHtml(s, `${s.documentName || 'physics'}-simulation.html`)
            }))

            unlisten.push(await listen('menu:powerups:add:physics', () => {
                dispatch({type: 'ADD_DOCUMENT_POWER_UP', powerUpId: 'powerup.physics'})
            }))
            unlisten.push(await listen('menu:powerups:add:xml-export', () => {
                dispatch({type: 'ADD_DOCUMENT_POWER_UP', powerUpId: 'powerup.export.xml'})
            }))
            unlisten.push(await listen('menu:powerups:add:png-export', () => {
                dispatch({type: 'ADD_DOCUMENT_POWER_UP', powerUpId: 'powerup.export.png'})
            }))
            unlisten.push(await listen('menu:powerups:remove:physics', () => {
                dispatch({type: 'REMOVE_DOCUMENT_POWER_UP', powerUpId: 'powerup.physics'})
            }))
            unlisten.push(await listen('menu:powerups:remove:xml-export', () => {
                dispatch({type: 'REMOVE_DOCUMENT_POWER_UP', powerUpId: 'powerup.export.xml'})
            }))
            unlisten.push(await listen('menu:powerups:remove:png-export', () => {
                dispatch({type: 'REMOVE_DOCUMENT_POWER_UP', powerUpId: 'powerup.export.png'})
            }))

            for (const menuId of getAllKnownPowerUpTauriMenuIds()) {
                unlisten.push(await listen(menuId, async () => {
                    const currentState = stateRef.current
                    const action = getPowerUpByTauriMenuId(currentState.document, menuId)
                    if (!action) return
                    try {
                        await runPowerUpMenuAction(action, {state: currentState, dispatch})
                    } catch (err) {
                        appLogger.error('Power-up action failed', {menuId, error: err})
                    }
                }))
            }
        }

        setup().catch(err => appLogger.error('Failed to set up native menus', err))
        return () => {
            unlisten.forEach(fn => fn())
        }
    }, [dispatch])
}
