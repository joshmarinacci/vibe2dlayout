import type {ColorPalette} from '@model/palette'
import type {PixelAsset} from '@model/pixelAsset'
import {hexToRgba, setPixel} from '@model/pixelAsset'
import type {AppAction} from '@store/types'
import {type Dispatch, useCallback, useEffect, useRef, useState} from 'react'

interface Props {
    asset: PixelAsset
    palettes: ColorPalette[]
    dispatch: Dispatch<AppAction>
}

type Tool = 'pencil' | 'line' | 'eraser'

function bresenham(x0: number, y0: number, x1: number, y1: number): Array<{
    col: number;
    row: number
}> {
    const pts: Array<{ col: number; row: number }> = []
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    let cx = x0, cy = y0
    while (true) {
        pts.push({col: cx, row: cy})
        if (cx === x1 && cy === y1) break
        const e2 = 2 * err
        if (e2 > -dy) {
            err -= dy;
            cx += sx
        }
        if (e2 < dx) {
            err += dx;
            cy += sy
        }
    }
    return pts
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number, cellSize: number) {
    for (let row = 0; row < Math.ceil(h / cellSize); row++) {
        for (let col = 0; col < Math.ceil(w / cellSize); col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#d1d5db' : '#ffffff'
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
    }
}

function redraw(canvas: HTMLCanvasElement, asset: PixelAsset, pixels: number[], zoom: number) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = asset.width * zoom
    const h = asset.height * zoom
    ctx.clearRect(0, 0, w, h)
    drawCheckerboard(ctx, w, h, Math.max(4, zoom / 2))
    for (let row = 0; row < asset.height; row++) {
        for (let col = 0; col < asset.width; col++) {
            const i = (row * asset.width + col) * 4
            const a = pixels[i + 3]
            if (a === 0) continue
            const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
            ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
            ctx.fillRect(col * zoom, row * zoom, zoom, zoom)
        }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 0.5
    for (let col = 0; col <= asset.width; col++) {
        ctx.beginPath();
        ctx.moveTo(col * zoom, 0);
        ctx.lineTo(col * zoom, h);
        ctx.stroke()
    }
    for (let row = 0; row <= asset.height; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * zoom);
        ctx.lineTo(w, row * zoom);
        ctx.stroke()
    }
}

function getPixelCoords(canvas: HTMLCanvasElement, clientX: number, clientY: number, zoom: number, asset: PixelAsset): {
    col: number;
    row: number
} | null {
    const rect = canvas.getBoundingClientRect()
    const col = Math.floor((clientX - rect.left) / zoom)
    const row = Math.floor((clientY - rect.top) / zoom)
    if (col < 0 || col >= asset.width || row < 0 || row >= asset.height) return null
    return {col, row}
}

export function PixelEditorOverlay({asset, palettes, dispatch}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [activeTool, setActiveTool] = useState<Tool>('pencil')
    const [activeColor, setActiveColor] = useState('#000000')
    const workingPixels = useRef<number[] | null>(null)
    const lineStart = useRef<{ col: number; row: number } | null>(null)
    const lineBasePixels = useRef<number[] | null>(null)

    const availW = window.innerWidth * 0.7
    const availH = window.innerHeight * 0.7
    const zoom = Math.max(4, Math.min(32, Math.floor(Math.min(availW, availH) / Math.max(asset.width, asset.height))))
    const canvasW = asset.width * zoom
    const canvasH = asset.height * zoom

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        redraw(canvas, asset, asset.pixels, zoom)
    }, [asset, zoom])

    const paintPixel = useCallback((pixels: number[], col: number, row: number, tool: Tool, color: string) => {
        if (tool === 'eraser') {
            setPixel(pixels, asset.width, col, row, 0, 0, 0, 0)
        } else {
            const [r, g, b, a] = hexToRgba(color)
            setPixel(pixels, asset.width, col, row, r, g, b, a)
        }
    }, [asset.width])

    // Use native pointer events on the canvas element to avoid CanvasView's
    // setPointerCapture stealing our events. We register them in a useEffect
    // so we can use { capture: false } and stop propagation at the source.
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const onDown = (e: PointerEvent) => {
            // Prevent CanvasView's onPointerDown from running and capturing the pointer
            e.stopPropagation()
            canvas.setPointerCapture(e.pointerId)
            const coords = getPixelCoords(canvas, e.clientX, e.clientY, zoom, asset)
            if (!coords) return
            const pixels = [...asset.pixels]
            if (activeTool === 'line') {
                lineStart.current = coords
                lineBasePixels.current = pixels
                workingPixels.current = pixels
            } else {
                paintPixel(pixels, coords.col, coords.row, activeTool, activeColor)
                workingPixels.current = pixels
                redraw(canvas, asset, pixels, zoom)
            }
        }

        const onMove = (e: PointerEvent) => {
            if (!workingPixels.current) return
            const coords = getPixelCoords(canvas, e.clientX, e.clientY, zoom, asset)
            if (!coords) return
            if (activeTool === 'line' && lineStart.current && lineBasePixels.current) {
                const preview = [...lineBasePixels.current]
                const pts = bresenham(lineStart.current.col, lineStart.current.row, coords.col, coords.row)
                const [r, g, b, a] = hexToRgba(activeColor)
                for (const {col, row} of pts) setPixel(preview, asset.width, col, row, r, g, b, a)
                workingPixels.current = preview
                redraw(canvas, asset, preview, zoom)
            } else {
                paintPixel(workingPixels.current, coords.col, coords.row, activeTool, activeColor)
                redraw(canvas, asset, workingPixels.current, zoom)
            }
        }

        const onUp = (e: PointerEvent) => {
            canvas.releasePointerCapture(e.pointerId)
            if (!workingPixels.current) return
            if (activeTool === 'line' && lineStart.current && lineBasePixels.current) {
                const coords = getPixelCoords(canvas, e.clientX, e.clientY, zoom, asset)
                if (coords) {
                    const final = [...lineBasePixels.current]
                    const pts = bresenham(lineStart.current.col, lineStart.current.row, coords.col, coords.row)
                    const [r, g, b, a] = hexToRgba(activeColor)
                    for (const {col, row} of pts) setPixel(final, asset.width, col, row, r, g, b, a)
                    workingPixels.current = final
                    redraw(canvas, asset, final, zoom)
                }
                lineStart.current = null
                lineBasePixels.current = null
            }
            dispatch({type: 'UPDATE_PIXEL_ASSET', asset: {...asset, pixels: workingPixels.current}})
            workingPixels.current = null
        }

        canvas.addEventListener('pointerdown', onDown)
        canvas.addEventListener('pointermove', onMove)
        canvas.addEventListener('pointerup', onUp)
        return () => {
            canvas.removeEventListener('pointerdown', onDown)
            canvas.removeEventListener('pointermove', onMove)
            canvas.removeEventListener('pointerup', onUp)
        }
    }, [asset, zoom, activeTool, activeColor, paintPixel, dispatch])

    // Collect palette colors (deduplicated)
    const allColors: string[] = []
    const seen = new Set<string>()
    for (const palette of palettes) {
        for (const c of palette.colors) {
            if (!seen.has(c.color)) {
                seen.add(c.color);
                allColors.push(c.color)
            }
        }
    }

    const close = () => dispatch({type: 'STOP_PIXEL_EDIT'})

    const toolBtn = (tool: Tool, label: string) => (
        <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            title={label}
            style={{
                padding: '4px 10px', fontSize: 12,
                border: '1px solid var(--color-border)', borderRadius: 4,
                background: activeTool === tool ? 'var(--color-accent)' : 'var(--color-bg-surface)',
                color: activeTool === tool ? '#fff' : 'var(--color-text-primary)',
                cursor: 'pointer',
            }}
        >{label}</button>
    )

    return (
        // Backdrop — stop all pointer events from reaching CanvasView handlers
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 200,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onPointerDown={e => e.stopPropagation()}
            onPointerMove={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
            onClick={e => {
                // Close when clicking on the backdrop itself (not the toolbar or canvas)
                if (e.target === e.currentTarget) close()
            }}
            onDoubleClick={e => {
                if (e.target === e.currentTarget) close()
            }}
        >
            {/* Toolbar */}
            <div
                style={{
                    position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 6, padding: '5px 10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    zIndex: 201,
                }}
                onClick={e => e.stopPropagation()}
            >
                {toolBtn('pencil', 'Pencil')}
                {toolBtn('line', 'Line')}
                {toolBtn('eraser', 'Eraser')}
                <div style={{
                    width: 1,
                    height: 20,
                    background: 'var(--color-border)',
                    margin: '0 4px'
                }}/>
                {allColors.map(color => (
                    <div
                        key={color}
                        onClick={() => setActiveColor(color)}
                        title={color}
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 3,
                            background: color,
                            cursor: 'pointer',
                            flexShrink: 0,
                            border: color === activeColor ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        }}
                    />
                ))}
                <input
                    type="color"
                    value={activeColor}
                    onChange={e => setActiveColor(e.target.value)}
                    title="Custom color"
                    style={{
                        width: 22,
                        height: 22,
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        background: 'none'
                    }}
                />
                <div style={{
                    width: 1,
                    height: 20,
                    background: 'var(--color-border)',
                    margin: '0 4px'
                }}/>
                <button
                    onClick={close}
                    title="Close editor (Escape)"
                    style={{
                        padding: '4px 10px', fontSize: 12,
                        border: '1px solid var(--color-border)', borderRadius: 4,
                        background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)',
                        cursor: 'pointer',
                    }}
                >Done
                </button>
            </div>

            {/* Pixel grid canvas — click propagation is already blocked by native listener */}
            <canvas
                ref={canvasRef}
                width={canvasW}
                height={canvasH}
                style={{
                    display: 'block',
                    imageRendering: 'pixelated',
                    cursor: activeTool === 'eraser' ? 'cell' : 'crosshair',
                    boxShadow: '0 0 0 2px var(--color-accent)',
                }}
                onClick={e => e.stopPropagation()}
            />

            <div style={{
                position: 'absolute',
                bottom: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 11,
                userSelect: 'none',
                pointerEvents: 'none',
            }}>
                Click backdrop or press Done to close
            </div>
        </div>
    )
}
