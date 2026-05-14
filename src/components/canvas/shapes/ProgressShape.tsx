import {fillColor, strokeColor} from '@model/shapes'
import type {ProgressShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import type {Dispatch} from 'react'
import {BoxShapeBase} from "./BoxShapeBase"

interface Props {
    shape: ProgressShape
    isSelected: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function ProgressShapeComp({shape, isSelected, onClick, onDoubleClick, handDrawn}: Props) {
    const {transform, value, ticks, fill, progressFill, stroke} = shape
    const {width, height} = transform

    const seed = seedFromId(shape.id)
    const pad = 2
    const barWidth = Math.max(pad * 2, (value / 100) * (width - pad * 2))

    const trackPaths = handDrawn ? roughRect(pad, pad, width - pad * 2, height - pad * 2, {
        seed,
        roughness: 1,
        bowing: 0.5,
        fill: fillColor(progressFill) === 'transparent' ? undefined : fillColor(progressFill),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: strokeColor(stroke),
        strokeWidth: stroke.width,
    }) : []

    const barPaths = handDrawn && barWidth > 0 ? roughRect(pad, pad, barWidth, height - pad * 2, {
        seed: seed + 1,
        roughness: 1,
        bowing: 0.5,
        fill: fillColor(fill),
        fillStyle: 'solid',
        fillWeight: 2,
        stroke: 'none',
        strokeWidth: 0,
    }) : []

    const tickPositions = ticks >= 2
        ? Array.from({length: ticks}, (_, i) => i / (ticks - 1))
        : []
    const tickTop = height + 2
    const tickBottom = tickTop + Math.max(3, height * 0.5)
    const tickColor = fillColor(fill) === 'transparent' ? '#999' : fillColor(fill)

    const tickPaths = handDrawn
        ? tickPositions.flatMap((t, i) => {
            const tx = pad + t * (width - pad * 2)
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
                    <RoughSvgPaths paths={barPaths}/>
                    {tickPaths.length > 0 && <RoughSvgPaths paths={tickPaths}/>}
                </svg>
            ) : (
                <>
                    {/* Plain track */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: fillColor(progressFill),
                        borderRadius: height / 2,
                        ...strokeBorderCSS(stroke),
                        overflow: 'hidden',
                    }}>
                        {/* Bar fill */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${value}%`,
                            background: fillBackground(fill),
                        }}/>
                    </div>
                    {/* Plain tick marks */}
                    {tickPositions.map((t, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: pad + t * (width - pad * 2) - 1,
                            top: height + 2,
                            width: 2,
                            height: Math.max(3, height * 0.5),
                            background: tickColor,
                            borderRadius: 1,
                            opacity: 0.7,
                        }}/>
                    ))}
                </>
            )}
        </BoxShapeBase>
    )
}
