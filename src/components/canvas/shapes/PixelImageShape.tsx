import type {PixelAsset} from '@model/pixelAsset'
import type {PixelImageShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {useEffect, useRef} from 'react'

interface Props {
    shape: PixelImageShape
    asset: PixelAsset | undefined
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
}

export function PixelImageShapeComp({shape, asset, isSelected, onClick, onDoubleClick}: Props) {
    const {transform} = shape
    const {x, y, width, height} = transform
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !asset) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, width, height)
        const cellW = width / asset.width
        const cellH = height / asset.height
        const pixels = asset.pixels
        for (let row = 0; row < asset.height; row++) {
            for (let col = 0; col < asset.width; col++) {
                const i = (row * asset.width + col) * 4
                const a = pixels[i + 3]
                if (a === 0) continue
                const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2]
                ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
                ctx.fillRect(col * cellW, row * cellH, Math.ceil(cellW), Math.ceil(cellH))
            }
        }
    }, [asset, width, height])

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width,
                height,
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
                outline: isSelected ? '2px solid #94a3b8' : undefined,
                // Checkerboard background shows through transparent pixels
                background: 'repeating-conic-gradient(#d1d5db 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px',
                imageRendering: 'pixelated',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {asset ? (
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        imageRendering: 'pixelated'
                    }}
                />
            ) : (
                <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#9ca3af', fontSize: 11, userSelect: 'none',
                }}>
                    16×16
                </div>
            )}
        </div>
    )
}
