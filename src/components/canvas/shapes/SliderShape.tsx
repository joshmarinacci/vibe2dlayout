import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {fillColor} from '@model/shapes'
import type {SliderShape} from '@model/shapes'
import {roughCircle, roughLine, roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'

interface Props {
    shape: SliderShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function SliderShapeComp({shape, isSelected, onClick, onDoubleClick, handDrawn}: Props) {
    const {transform, value, ticks, thumbFill} = shape
    const {width, height} = transform
    const thumbSize = height
    const thumbX = value * (width - thumbSize)
    const trackHeight = height * 0.3
    const trackY = (height - trackHeight) / 2
    const trackX = thumbSize / 2
    const trackWidth = width - thumbSize

    const seed = seedFromId(shape.id)
    const trackPaths = handDrawn ? roughRect(trackX, trackY, trackWidth, trackHeight, {
        seed,
        roughness: 1.2,
        bowing: 0.5,
        fill: fillColor(shape.fill) === 'transparent' ? undefined : fillColor(shape.fill),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: fillColor(shape.fill) === 'transparent' ? '#999' : fillColor(shape.fill),
        strokeWidth: 1.5,
    }) : []

    const thumbCx = thumbX + thumbSize / 2
    const thumbCy = height / 2
    const thumbPaths = handDrawn ? roughCircle(thumbCx, thumbCy, thumbSize, {
        seed: seed + 1,
        roughness: 1.4,
        bowing: 1,
        fill: fillColor(thumbFill) === 'transparent' ? undefined : fillColor(thumbFill),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: fillColor(thumbFill) === 'transparent' ? '#555' : fillColor(thumbFill),
        strokeWidth: 1.5,
    }) : []

    const tickPositions = ticks >= 2
        ? Array.from({length: ticks}, (_, i) => i / (ticks - 1))
        : []
    const tickTop = trackY + trackHeight + 2
    const tickBottom = tickTop + Math.max(3, height * 0.15)
    const tickColor = fillColor(thumbFill) === 'transparent' ? '#999' : fillColor(thumbFill)

    const tickPaths = handDrawn
        ? tickPositions.flatMap((t, i) => {
            const tx = trackX + t * trackWidth
            return roughLine(tx, tickTop, tx, tickBottom, {
                seed: seed + 10 + i,
                roughness: 1.2,
                stroke: tickColor,
                strokeWidth: 1.5,
            })
        })
        : []

    return (
        <BoxShapeBase shape={shape} isSelected={isSelected} onClick={onClick}
                      onDoubleClick={onDoubleClick}>
            {handDrawn ? (
                <svg
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        overflow: 'visible'
                    }}
                    width={width}
                    height={height}
                >
                    <RoughSvgPaths paths={trackPaths}/>
                    <RoughSvgPaths paths={thumbPaths}/>
                    {tickPaths.length > 0 && <RoughSvgPaths paths={tickPaths}/>}
                </svg>
            ) : (
                <>
                    {/* Plain track */}
                    <div style={{
                        position: 'absolute',
                        left: trackX,
                        top: trackY,
                        width: trackWidth,
                        height: trackHeight,
                        background: fillColor(shape.fill),
                        borderRadius: trackHeight / 2,
                    }}/>
                    {/* Plain thumb */}
                    <div style={{
                        position: 'absolute',
                        left: thumbX,
                        top: 0,
                        width: thumbSize,
                        height: thumbSize,
                        background: fillColor(thumbFill),
                        borderRadius: '50%',
                        border: `1.5px solid ${fillColor(thumbFill)}`,
                    }}/>
                    {/* Plain tick marks */}
                    {tickPositions.map((t, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: trackX + t * trackWidth - 1,
                            top: tickTop,
                            width: 2,
                            height: tickBottom - tickTop,
                            background: tickColor,
                            borderRadius: 1,
                            opacity: 0.6,
                        }}/>
                    ))}
                </>
            )}
        </BoxShapeBase>
    )
}
