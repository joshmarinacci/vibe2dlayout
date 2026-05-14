import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {TableShape} from '@model/shapes'
import {strokeColor} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import type {Dispatch} from 'react'
import {useTextEdit} from './useTextEdit'

interface Props {
    shape: TableShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function TableShapeComp({
                                   shape,
                                   isSelected,
                                   isEditing,
                                   dispatch,
                                   onClick,
                                   onDoubleClick,
                                   handDrawn
                               }: Props) {
    const {transform, fill, stroke, text} = shape
    const {width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const rows = text.content.split('\n').filter(r => r.length > 0)
    const numCols = rows.reduce((max, row) => Math.max(max, row.split(',').length), 1)
    const rowHeight = text.fontSize + 10
    const colWidth = width / numCols
    const pad = 2
    const seed = seedFromId(shape.id)


    // Header row background (hand-drawn)
    const headerBgPaths = handDrawn && rows.length > 0 ? roughRect(pad, pad, width - pad * 2, Math.min(rowHeight, height - pad * 2), {
        seed: seed + 1,
        roughness: 0.4,
        fill: strokeColor(stroke),
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: 'none',
        strokeWidth: 0,
    }) : []

    // Horizontal row dividers
    const hLinePaths = handDrawn ? rows.slice(0, -1).flatMap((_, i) => {
        const lineY = (i + 1) * rowHeight
        if (lineY >= height - pad) return []
        return roughLine(pad, lineY, width - pad, lineY, {
            seed: seed + 10 + i,
            roughness: 0.7,
            stroke: strokeColor(stroke),
            strokeWidth: stroke.width * 0.5,
        })
    }) : []

    // Vertical column dividers
    const vLinePaths = handDrawn ? Array.from({length: numCols - 1}, (_, i) => {
        const lineX = (i + 1) * colWidth
        return roughLine(lineX, pad, lineX, height - pad, {
            seed: seed + 20 + i,
            roughness: 0.7,
            stroke: strokeColor(stroke),
            strokeWidth: stroke.width * 0.5,
        })
    }).flat() : []

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
                    <RoughSvgPaths paths={makeRoughRect(shape)}/>
                    <RoughSvgPaths paths={headerBgPaths}/>
                    <RoughSvgPaths paths={hLinePaths}/>
                    <RoughSvgPaths paths={vLinePaths}/>
                </svg>
            ) : (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: fillBackground(fill),
                    ...strokeBorderCSS(stroke),
                }}/>
            )}

            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    defaultValue={text.content}
                    style={{
                        position: 'absolute',
                        inset: 4,
                        border: 'none',
                        background: 'rgba(255,255,255,0.9)',
                        resize: 'none',
                        fontFamily: text.fontFamily,
                        fontSize: text.fontSize,
                        fontWeight: text.fontWeight,
                        color: text.color,
                        outline: 'none',
                        padding: '2px 4px',
                        ...textExtraCSS(text),
                        zIndex: 2,
                    }}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onClick={onClickTextarea}
                />
            ) : (
                <div style={{position: 'absolute', inset: 0, zIndex: 1}}>
                    {rows.map((row, rowIdx) => {
                        const cells = row.split(',')
                        const isHeader = rowIdx === 0
                        const top = rowIdx * rowHeight
                        if (top >= height) return null
                        return (
                            <div
                                key={rowIdx}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top,
                                    height: rowHeight,
                                    display: 'flex',
                                    background: !handDrawn && isHeader ? strokeColor(stroke) : 'transparent',
                                    borderBottom: !handDrawn && rowIdx < rows.length - 1
                                        ? `${stroke.width * 0.5}px solid ${strokeColor(stroke)}` : undefined,
                                    boxSizing: 'border-box',
                                }}
                            >
                                {Array.from({length: numCols}, (_, colIdx) => (
                                    <div
                                        key={colIdx}
                                        style={{
                                            width: colWidth,
                                            flexShrink: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            paddingLeft: 6,
                                            paddingRight: 4,
                                            borderRight: !handDrawn && colIdx < numCols - 1
                                                ? `${stroke.width * 0.5}px solid ${strokeColor(stroke)}` : undefined,
                                            boxSizing: 'border-box',
                                            overflow: 'hidden',
                                        }}
                                    >
                    <span style={{
                        fontFamily: text.fontFamily,
                        fontSize: text.fontSize,
                        fontWeight: isHeader ? 'bold' : text.fontWeight,
                        fontStyle: text.fontStyle,
                        color: isHeader ? 'white' : text.color,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        userSelect: 'none',
                        width: '100%',
                        ...textExtraCSS(text),
                    }}>
                      {cells[colIdx]?.trim() ?? ''}
                    </span>
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </BoxShapeBase>
    )
}
