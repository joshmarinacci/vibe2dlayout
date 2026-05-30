import {EMPTY_LIBRARY, type Library} from '@model/library'

const LOCAL_STORAGE_KEY = 'vibe2d:library'

function isTauri(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function getTauriLibraryPath(): Promise<string> {
    const {appDataDir} = await import('@tauri-apps/api/path')
    const dir = await appDataDir()
    return `${dir}/library.json`
}

export async function loadLibrary(): Promise<Library> {
    try {
        if (isTauri()) {
            const {readTextFile} = await import('@tauri-apps/plugin-fs')
            const path = await getTauriLibraryPath()
            const json = await readTextFile(path)
            return JSON.parse(json) as Library
        } else {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (!raw) return {...EMPTY_LIBRARY}
            return JSON.parse(raw) as Library
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
        console.warn('Failed to save library', e)
    }
}
