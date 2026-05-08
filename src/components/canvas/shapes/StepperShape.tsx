import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {fillColor} from '@model/shapes'
import type {StepperShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import type {Dispatch} from 'react'

interface Props {
    shape: StepperShape
    isSelected: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

const BTN_W = 30

export function StepperShapeComp({shape, isSelected, onClick, onDoubleClick, handDrawn}: Props) {
    const {transform, value, text, fill, stroke} = shape
    const {width, height} = transform

    const seed = seedFromId(shape.id)
    const pad = 2

    const minusPaths = handDrawn ? roughRect(pad, pad, BTN_W - pad * 2, height - pad * 2, {
        seed,
        roughness: 1.2,
        bowing: 0.5,
        fill: fillColor(fill) === 'transparent' ? undefined : fillColor(fill),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    }) : []

    const plusPaths = handDrawn ? roughRect(width - BTN_W + pad, pad, BTN_W - pad * 2, height - pad * 2, {
        seed: seed + 1,
        roughness: 1.2,
        bowing: 0.5,
        fill: fillColor(fill) === 'transparent' ? undefined : fillColor(fill),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: stroke.color,
        strokeWidth: stroke.width,
    }) : []

    const valuePaths = handDrawn ? roughRect(BTN_W + pad, pad, width - BTN_W * 2 - pad * 2, height - pad * 2, {
        seed: seed + 2,
        roughness: 0.8,
        bowing: 0.3,
        fill: undefined,
        stroke: stroke.color,
        strokeWidth: stroke.width * 0.6,
    }) : []

    const btnBg = fillColor(fill) === 'transparent' ? undefined : fillColor(fill)

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
                    <RoughSvgPaths paths={minusPaths}/>
                    <RoughSvgPaths paths={valuePaths}/>
                    <RoughSvgPaths paths={plusPaths}/>
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex', ...strokeBorderCSS(stroke),
                    borderRadius: 4,
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: BTN_W,
                        background: btnBg,
                        borderRight: `${stroke.width}px solid ${stroke.color}`,
                        flexShrink: 0
                    }}/>
                    <div style={{flex: 1}}/>
                    <div style={{
                        width: BTN_W,
                        background: btnBg,
                        borderLeft: `${stroke.width}px solid ${stroke.color}`,
                        flexShrink: 0
                    }}/>
                </div>
            )}

            {/* − button label */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: BTN_W,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: text.fontFamily,
                fontSize: text.fontSize + 2,
                color: text.color,
                userSelect: 'none',
            }}>−
            </div>

            {/* Value display */}
            <div style={{
                position: 'absolute',
                left: BTN_W,
                top: 0,
                right: BTN_W,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: text.fontFamily,
                fontSize: text.fontSize,
                color: text.color,
                userSelect: 'none',
                ...textExtraCSS(text),
            }}>{value}</div>

            {/* + button label */}
            <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: BTN_W,
                height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: text.fontFamily,
                fontSize: text.fontSize + 2,
                color: text.color,
                userSelect: 'none',
            }}>+
            </div>
        </BoxShapeBase>
    )
}
