import type {ImageShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {svgDropShadow} from '@utils/shadowSVG'
import type React from 'react'

interface Props {
    shape: ImageShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
}

export function ImageShapeComp({shape, onClick, onDoubleClick}: Props) {
    const {transform, src, mimeType, preserveAspectRatio, opacity, crop} = shape
    const {x, y, width: w, height: h} = transform

    const shadow = svgDropShadow(shape.boxShadow, shape.id)
    const filterAttr = shadow ? `url(#shadow-${shape.id})` : undefined

    // Compute image position and size from crop (all in canvas pixels)
    const imgX = crop ? -(crop.x / crop.width) * w : 0
    const imgY = crop ? -(crop.y / crop.height) * h : 0
    const imgW = crop ? w / crop.width : w
    const imgH = crop ? h / crop.height : h
    // When cropped, always fill (no aspect ratio). Otherwise respect the shape setting.
    const aspectRatio = crop ? 'none' : (preserveAspectRatio ? 'xMidYMid meet' : 'none')

    return (
        <svg
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                overflow: 'visible',
                cursor: 'move',
                userSelect: 'none',
                opacity,
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {shadow && <defs>{shadow.filterEl}</defs>}

            {/* Shadow rect (outside content so shadow bleeds through overflow:visible) */}
            {shadow && (
                <rect x={0} y={0} width={w} height={h} fill="none"
                      filter={filterAttr} pointerEvents="none"/>
            )}

            {/* Image content clipped to shape bounds via nested SVG overflow:hidden */}
            <svg x={0} y={0} width={w} height={h} overflow="hidden">
                {src ? (
                    <image
                        href={`data:${mimeType};base64,${src}`}
                        x={imgX}
                        y={imgY}
                        width={imgW}
                        height={imgH}
                        preserveAspectRatio={aspectRatio}
                    />
                ) : (
                    <>
                        <rect x={0} y={0} width={w} height={h} fill="#e5e7eb"/>
                        <text
                            x={w / 2} y={h / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={12}
                            fill="#9ca3af"
                        >
                            Image
                        </text>
                    </>
                )}
            </svg>
        </svg>
    )
}
