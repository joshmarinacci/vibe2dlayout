import type {RectShape as RectShapeType} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {svgFill} from '@utils/fillSVG'
import {svgDropShadow} from '@utils/shadowSVG'
import {cornerRadiiPath, svgStroke} from '@utils/strokeStyleSVG'

interface Props {
    shape: RectShapeType
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function RectShape({shape, onClick, onDoubleClick, children}: Props) {
    const {transform, fill, stroke} = shape
    const {x, y, width: w, height: h} = transform

    const fillResult = svgFill(fill, shape.id)
    const strokeResult = svgStroke(stroke, shape.id)
    const shadow = svgDropShadow(shape.boxShadow, shape.id)

    const hasDefs = fillResult.defs || strokeResult.defs || shadow
    const filterAttr = shadow ? `url(#shadow-${shape.id})` : undefined

    // Use path for per-corner radii, rect for uniform radius
    const shapeEl = shape.cornerRadii ? (
        <path
            d={cornerRadiiPath(0, 0, w, h, shape.cornerRadii)}
            fill={fillResult.fillAttr}
            fillOpacity={fillResult.opacity}
            stroke={strokeResult.stroke}
            strokeWidth={strokeResult.strokeWidth}
            strokeDasharray={strokeResult.strokeDasharray}
            strokeOpacity={strokeResult.strokeOpacity}
            filter={filterAttr}
            pointerEvents="none"
        />
    ) : (
        <rect
            x={0} y={0} width={w} height={h}
            rx={shape.cornerRadius ?? 0}
            fill={fillResult.fillAttr}
            fillOpacity={fillResult.opacity}
            stroke={strokeResult.stroke}
            strokeWidth={strokeResult.strokeWidth}
            strokeDasharray={strokeResult.strokeDasharray}
            strokeOpacity={strokeResult.strokeOpacity}
            filter={filterAttr}
            pointerEvents="none"
        />
    )

    return (
        <div
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: w,
                height: h,
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
                cursor: 'move',
                userSelect: 'none',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            <svg
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
                aria-hidden="true"
            >
                {hasDefs && (
                    <defs>
                        {fillResult.defs}
                        {strokeResult.defs}
                        {shadow?.filterEl}
                    </defs>
                )}
                {shapeEl}
            </svg>
            {children}
        </div>
    )
}
