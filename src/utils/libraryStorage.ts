import {EMPTY_LIBRARY, type Library} from '@model/library'
import {appLogger} from '@logging'

const LOCAL_STORAGE_KEY = 'vibe2d:library'

function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function getTauriLibraryPath(): Promise<string> {
    const {appDataDir} = await import('@tauri-apps/api/path')
    const dir = await appDataDir()
    return `${dir}/library.json`
}

function normalizeLibrary(raw: unknown): Library {
    if (typeof raw !== 'object' || raw === null) return {...EMPTY_LIBRARY}
    const lib = raw as Partial<Library> & Record<string, unknown>
    return {
        version: 3,
        gradients: Array.isArray(lib.gradients) ? lib.gradients as Library['gradients'] : [],
        images: Array.isArray(lib.images) ? lib.images as Library['images'] : [],
        dimensions: Array.isArray(lib.dimensions) ? lib.dimensions as Library['dimensions'] : [],
        fonts: Array.isArray(lib.fonts) ? lib.fonts as Library['fonts'] : [],
        shapeTemplates: Array.isArray(lib.shapeTemplates) ? lib.shapeTemplates as Library['shapeTemplates'] : [],
        pageTemplates: Array.isArray(lib.pageTemplates) ? lib.pageTemplates as Library['pageTemplates'] : [],
    }
}

export async function loadLibrary(): Promise<Library> {
    try {
        if (isTauri()) {
            const {readTextFile} = await import('@tauri-apps/plugin-fs')
            const path = await getTauriLibraryPath()
            const json = await readTextFile(path)
            return normalizeLibrary(JSON.parse(json))
        } else {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (!raw) return {...EMPTY_LIBRARY}
            return normalizeLibrary(JSON.parse(raw))
        }
    } catch {
        return {...EMPTY_LIBRARY}
    }
}

export async function saveLibrary(library: Library): Promise<void> {
    try {
        const json = JSON.stringify(library, null, 2)
        if (isTauri()) {
            const {writeTextFile, mkdir} = await import('@tauri-apps/plugin-fs')
            const {appDataDir} = await import('@tauri-apps/api/path')
            const dir = await appDataDir()
            await mkdir(dir, {recursive: true})
            const path = `${dir}/library.json`
            await writeTextFile(path, json)
        } else {
            localStorage.setItem(LOCAL_STORAGE_KEY, json)
        }
    } catch (e) {
        appLogger.warn('Failed to save library', e)
    }
}
