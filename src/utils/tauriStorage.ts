import {fromJSON, toJSON} from './serialization'
import type {VibeDocument} from '@model/document'

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
    const json = await readTextFile(filePath)
    const document = fromJSON(json)
    const {basename} = await import('@tauri-apps/api/path')
    const base = await basename(filePath)
    const name = base.replace(/\.vibe\.json$|\.json$/, '')
    return {filePath, document, name}
}

export async function tauriSaveFile(filePath: string, document: VibeDocument): Promise<void> {
    const {writeTextFile} = await import('@tauri-apps/plugin-fs')
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
    await writeTextFile(filePath, toJSON(document))
    const base = await basename(filePath)
    const name = base.replace(/\.vibe\.json$|\.json$/, '')
    return {filePath, name}
}
