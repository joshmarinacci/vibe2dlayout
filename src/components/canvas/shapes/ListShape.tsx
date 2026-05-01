import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import {makeRoughRect} from "@components/canvas/shapes/formUtils.ts";
import type {ListShape} from '@model/shapes'
import type {AppAction} from '@store/types'
import {fillBackground} from '@utils/fillCSS'
import {roughLine, roughRect, seedFromId} from '@utils/roughPaths'
import {RoughSvgPaths} from '@utils/RoughSvgPaths'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import {textExtraCSS} from '@utils/textStyleCSS'
import type {Dispatch} from 'react'
import {useTextEdit} from './useTextEdit'

interface Props {
    shape: ListShape
    isSelected: boolean
    isEditing: boolean
    dispatch: Dispatch<AppAction>
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    handDrawn: boolean
}

export function ListShapeComp({
                                  shape,
                                  isSelected,
                                  isEditing,
                                  dispatch,
                                  onClick,
                                  onDoubleClick,
                                  handDrawn
                              }: Props) {
    const {transform, fill, stroke, text, selectedIndex} = shape
    const {width, height} = transform
    const {textareaRef, onChange, onKeyDown, onClickTextarea} = useTextEdit({
        content: text.content, isEditing, shapeId: shape.id, dispatch,
    })

    const items = text.content.split('\n')
    const rowHeight = text.fontSize + 10
    const pad = 2
    const seed = seedFromId(shape.id)

    // Row separator lines
    const separatorPaths = handDrawn ? items.slice(0, -1).flatMap((_, i) => {
        const lineY = (i + 1) * rowHeight
        if (lineY >= height - pad * 2) return []
        return roughLine(pad, lineY, width - pad, lineY, {
            seed: seed + i + 1,
            roughness: 0.8,
            stroke: stroke.color,
            strokeWidth: stroke.width * 0.5,
        })
    }) : []

    // Selected row highlight (hand-drawn)
    const selRowY = selectedIndex >= 0 ? selectedIndex * rowHeight : -1
    const selRowVisible = selRowY >= 0 && selRowY < height - pad * 2
    const selectedRowPaths = handDrawn && selRowVisible ? roughRect(pad, selRowY + pad, width - pad * 2, Math.min(rowHeight, height - selRowY - pad * 2), {
        seed: seed + 999,
        roughness: 0.5,
        fill: '#bfdbfe',
        fillStyle: 'solid',
        fillWeight: 1,
        stroke: 'none',
        strokeWidth: 0,
    }) : []

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
                    <RoughSvgPaths paths={selectedRowPaths}/>
                    <RoughSvgPaths paths={separatorPaths}/>
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
                        background: 'transparent',
                        resize: 'none',
                        fontFamily: text.fontFamily,
                        fontSize: text.fontSize,
                        fontWeight: text.fontWeight,
                        color: text.color,
                        outline: 'none',
                        padding: 0,
                        zIndex: 1,
                    }}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onClick={onClickTextarea}
                />
            ) : (
                <div style={{position: 'absolute', inset: 0, zIndex: 1}}>
                    {items.map((item, i) => {
                        const isSelectedRow = i === selectedIndex
                        const top = i * rowHeight
                        if (top >= height) return null
                        return (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top,
                                    height: rowHeight,
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: 8,
                                    paddingRight: 4,
                                    background: !handDrawn && isSelectedRow ? '#bfdbfe' : 'transparent',
                                    borderBottom: !handDrawn && i < items.length - 1 ? `${stroke.width * 0.5}px solid ${stroke.color}` : undefined,
                                    boxSizing: 'border-box',
                                }}
                            >
                <span style={{
                    fontFamily: text.fontFamily,
                    fontSize: text.fontSize,
                    fontWeight: isSelectedRow ? 'bold' : text.fontWeight,
                    fontStyle: text.fontStyle,
                    color: text.color,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    userSelect: 'none',
                    width: '100%',
                    ...textExtraCSS(text),
                }}>
                  {item}
                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </BoxShapeBase>
    )
}
