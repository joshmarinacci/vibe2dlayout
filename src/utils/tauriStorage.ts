import {fromJSON, toJSON} from './serialization'
import {decodeLimnPng} from './limnFile'
import type {VibeDocument} from '@model/document'
import {importerLogger, exporterLogger} from '@logging'

export interface TauriOpenResult {
    filePath: string
    document: VibeDocument
    name: string
}

export async function tauriOpenFile(): Promise<TauriOpenResult | null> {
    const {open} = await import('@tauri-apps/plugin-dialog')
    const {readTextFile} = await import('@tauri-apps/plugin-fs')
    const selected = await open({
        filters: [{name: 'Vibe Document', extensions: ['json']}],
        multiple: false,
    })
    if (!selected || Array.isArray(selected)) return null
    const filePath = selected as string
    importerLogger.info('Reading document from disk', {filePath})
    const json = await readTextFile(filePath)
    const document = fromJSON(json)
    const {basename} = await import('@tauri-apps/api/path')
    const base = await basename(filePath)
    const name = base.replace(/\.vibe\.json$|\.json$/, '')
    importerLogger.info('Loaded document from disk', {filePath, name})
    return {filePath, document, name}
}

export async function tauriSaveFile(filePath: string, document: VibeDocument): Promise<void> {
    const {writeTextFile} = await import('@tauri-apps/plugin-fs')
    exporterLogger.info('Writing document to disk', {filePath})
    await writeTextFile(filePath, toJSON(document))
}

export async function tauriSaveAsFile(
    document: VibeDocument,
    defaultName: string,
): Promise<{filePath: string; name: string} | null> {
    const {save} = await import('@tauri-apps/plugin-dialog')
    const {writeTextFile} = await import('@tauri-apps/plugin-fs')
    const {basename} = await import('@tauri-apps/api/path')
    const filePath = await save({
        defaultPath: `${defaultName}.json`,
        filters: [{name: 'Vibe Document', extensions: ['json']}],
    })
    if (!filePath) return null
    exporterLogger.info('Writing document with Save As', {filePath})
    await writeTextFile(filePath, toJSON(document))
    const base = await basename(filePath)
    const name = base.replace(/\.vibe\.json$|\.json$/, '')
    return {filePath, name}
}

export async function tauriSaveLimnFile(filePath: string, pngBytes: Uint8Array): Promise<void> {
    const {writeFile} = await import('@tauri-apps/plugin-fs')
    exporterLogger.info('Writing Limn file to disk', {filePath})
    await writeFile(filePath, pngBytes)
}

export async function tauriSaveAsLimnFile(
    pngBytes: Uint8Array,
    defaultName: string,
): Promise<{filePath: string; name: string} | null> {
    const {save} = await import('@tauri-apps/plugin-dialog')
    const {writeFile} = await import('@tauri-apps/plugin-fs')
    const {basename} = await import('@tauri-apps/api/path')
    const filePath = await save({
        defaultPath: `${defaultName}.limn.png`,
        filters: [{name: 'Limn Document', extensions: ['limn.png', 'png']}],
    })
    if (!filePath) return null
    exporterLogger.info('Writing Limn file with Save As', {filePath})
    await writeFile(filePath, pngBytes)
    const base = await basename(filePath)
    const name = base.replace(/\.limn\.png$|\.limn$/, '')
    return {filePath, name}
}

export async function tauriOpenLimnFile(): Promise<TauriOpenResult | null> {
    const {open} = await import('@tauri-apps/plugin-dialog')
    const {readFile} = await import('@tauri-apps/plugin-fs')
    const {basename} = await import('@tauri-apps/api/path')
    const selected = await open({
        filters: [{name: 'Limn Document', extensions: ['limn.png', 'png']}],
        multiple: false,
    })
    if (!selected || Array.isArray(selected)) return null
    const filePath = selected as string
    importerLogger.info('Reading Limn file from disk', {filePath})
    const bytes = await readFile(filePath)
    const document = decodeLimnPng(bytes)
    const base = await basename(filePath)
    const name = base.replace(/\.limn\.png$|\.limn$/, '')
    importerLogger.info('Loaded Limn file from disk', {filePath, name})
    return {filePath, document, name}
}
