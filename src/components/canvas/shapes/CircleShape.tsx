import type {CircleShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {svgFill} from '@utils/fillSVG'
import {svgDropShadow} from '@utils/shadowSVG'
import {svgStroke} from '@utils/strokeStyleSVG'

interface Props {
    shape: CircleShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function CircleShapeComp({shape, onClick, onDoubleClick, children}: Props) {
    const {transform, fill, stroke} = shape
    const {x, y, width: w, height: h} = transform

    const fillResult = svgFill(fill, shape.id, w, h)
    const strokeResult = svgStroke(stroke, shape.id, w, h)
    const shadow = svgDropShadow(shape.boxShadow, shape.id)

    const hasDefs = fillResult.defs || strokeResult.defs || shadow
    const filterAttr = shadow ? `url(#shadow-${shape.id})` : undefined

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
                <ellipse
                    cx={w / 2}
                    cy={h / 2}
                    rx={w / 2}
                    ry={h / 2}
                    fill={fillResult.fillAttr}
                    fillOpacity={fillResult.opacity}
                    stroke={strokeResult.stroke}
                    strokeWidth={strokeResult.strokeWidth}
                    strokeDasharray={strokeResult.strokeDasharray}
                    strokeOpacity={strokeResult.strokeOpacity}
                    filter={filterAttr}
                    pointerEvents="none"
                />
            </svg>
            {children}
        </div>
    )
}
