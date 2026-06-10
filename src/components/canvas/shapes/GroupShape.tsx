import type {GroupShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {svgDropShadow} from '@utils/shadowSVG'

interface Props {
    shape: GroupShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function GroupShapeComp({shape, isSelected, onClick, onDoubleClick, children}: Props) {
    const {x, y, width: w, height: h} = shape.transform
    const shadow = svgDropShadow(shape.boxShadow, shape.id)

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                transform: buildCSSTransform(shape.transform),
                transformOrigin: 'center center',
                cursor: 'move',
                userSelect: 'none',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {/* SVG visual layer: shadow + optional selection indicator */}
            <svg
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
                aria-hidden="true"
            >
                {shadow && (
                    <defs>{shadow.filterEl}</defs>
                )}
                {shadow && (
                    <rect x={0} y={0} width={w} height={h} fill="transparent"
                          filter={`url(#shadow-${shape.id})`} pointerEvents="none"/>
                )}
                {isSelected && (
                    <rect x={0} y={0} width={w} height={h}
                          fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 3"
                          pointerEvents="none"/>
                )}
            </svg>
            {children}
        </div>
    )
}
