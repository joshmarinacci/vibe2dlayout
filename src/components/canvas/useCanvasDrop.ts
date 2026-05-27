import type {ImageAsset} from '@model/imageAsset'
import type {ImageShape, MimeType} from '@model/shapes'
import {useAppDispatch, useAppState} from '@store/context'
import {screenToCanvas} from '@store/reducer'
import type {ViewTransform} from '@store/types'
import {generateId} from '@utils/idgen'
import type React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {RULER_SIZE} from './CanvasRuler'

const MIME_TYPES: MimeType[] = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_DROP_SIZE = 400

function isTauriEnv(): boolean {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

function clampedSize(naturalW: number, naturalH: number): { w: number; h: number } {
    const scale = Math.min(1, MAX_DROP_SIZE / naturalW, MAX_DROP_SIZE / naturalH)
    return {w: Math.round(naturalW * scale), h: Math.round(naturalH * scale)}
}

function mimeFromPath(path: string): MimeType {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, MimeType> = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    }
    return map[ext] ?? 'image/png'
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
}

function loadImageDimensions(dataUrl: string): Promise<{ naturalWidth: number; naturalHeight: number }> {
    return new Promise(resolve => {
        const img = new Image()
        img.onload = () => resolve({naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight})
        img.onerror = () => resolve({naturalWidth: 200, naturalHeight: 150})
        img.src = dataUrl
    })
}

export function useCanvasDrop(_containerRef: React.RefObject<HTMLDivElement | null>) {
    const {state} = useAppState()
    const dispatch = useAppDispatch()

    // Keep refs to avoid stale closures in the Tauri listener (registered once)
    const viewTransformRef = useRef<ViewTransform>(state.viewTransform)
    const activePageIdRef = useRef<string | null>(state.activePageId)
    viewTransformRef.current = state.viewTransform
    activePageIdRef.current = state.activePageId

    const processImageDrop = useCallback(async (
        base64: string,
        mimeType: MimeType,
        fileName: string,
        canvasX: number,
        canvasY: number
    ) => {
        const dataUrl = `data:${mimeType};base64,${base64}`
        const {naturalWidth, naturalHeight} = await loadImageDimensions(dataUrl)
        const {w, h} = clampedSize(naturalWidth, naturalHeight)
        const asset: ImageAsset = {
            id: generateId(),
            name: fileName.replace(/\.[^.]+$/, ''),
            src: base64,
            mimeType,
            width: naturalWidth,
            height: naturalHeight,
        }
        const shape: ImageShape = {
            id: generateId(),
            name: asset.name,
            type: 'image',
            locked: false,
            visible: true,
            transform: {x: canvasX - w / 2, y: canvasY - h / 2, width: w, height: h, rotation: 0},
            src: base64,
            mimeType,
            preserveAspectRatio: true,
            opacity: 1,
            assetId: asset.id,
        }
        dispatch({type: 'ADD_IMAGE_ASSET', asset})
        dispatch({type: 'ADD_SHAPE', parentId: activePageIdRef.current, shape})
        dispatch({type: 'SELECT_SHAPES', ids: [shape.id], additive: false})
    }, [dispatch])

    // Browser drop handler
    const onDragOver = useCallback((e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
        }
    }, [])

    const onDrop = useCallback((e: React.DragEvent) => {
        const files = Array.from(e.dataTransfer.files).filter(f => MIME_TYPES.includes(f.type as MimeType))
        if (files.length === 0) return
        e.preventDefault()
        const {x: canvasX, y: canvasY} = screenToCanvas(
            viewTransformRef.current,
            e.clientX - RULER_SIZE,
            e.clientY - RULER_SIZE
        )
        files.forEach(file => {
            const reader = new FileReader()
            reader.onload = () => {
                const dataUrl = reader.result as string
                const base64 = dataUrl.split(',')[1] ?? ''
                processImageDrop(base64, file.type as MimeType, file.name, canvasX, canvasY)
            }
            reader.readAsDataURL(file)
        })
    }, [processImageDrop])

    // Tauri drag-drop listener — registered once, uses refs for live state
    useEffect(() => {
        if (!isTauriEnv()) return
        let unlisten: (() => void) | null = null
        let cancelled = false

        import('@tauri-apps/api/event').then(({listen}) => {
            listen('tauri://drag-drop', async (event: {payload: {paths: string[]; position?: {x: number; y: number}}}) => {
                const {paths, position} = event.payload
                const imagePaths = paths.filter(p => {
                    const ext = p.split('.').pop()?.toLowerCase() ?? ''
                    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)
                })
                if (imagePaths.length === 0) return

                const dropX = position?.x ?? 0
                const dropY = position?.y ?? 0
                const {x: canvasX, y: canvasY} = screenToCanvas(
                    viewTransformRef.current,
                    dropX - RULER_SIZE,
                    dropY - RULER_SIZE
                )

                const {readFile} = await import('@tauri-apps/plugin-fs')
                for (const filePath of imagePaths) {
                    const mimeType = mimeFromPath(filePath)
                    const bytes = await readFile(filePath)
                    const base64 = bytesToBase64(bytes)
                    const fileName = filePath.split('/').pop() ?? filePath.split('\\').pop() ?? 'image'
                    await processImageDrop(base64, mimeType, fileName, canvasX, canvasY)
                }
            }).then(fn => {
                if (cancelled) fn()
                else unlisten = fn
            })
        })

        return () => {
            cancelled = true
            unlisten?.()
        }
    }, [processImageDrop])

    return {onDragOver, onDrop}
}
