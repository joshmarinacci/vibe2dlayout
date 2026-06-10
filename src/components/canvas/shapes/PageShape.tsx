import type {PageShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'

interface Props {
    shape: PageShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function PageShapeComp({shape, onClick, onDoubleClick, children}: Props) {
    const {transform, background, clipChildren, fixedSize} = shape
    const {x, y, width, height} = transform
    const w = fixedSize?.width ?? width
    const h = fixedSize?.height ?? height

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
                overflow: clipChildren ? 'hidden' : 'visible',
                cursor: 'move',
                userSelect: 'none',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {/* SVG visual layer: background + page drop shadow */}
            <svg
                style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible'}}
                aria-hidden="true"
            >
                <defs>
                    <filter id={`page-shadow-${shape.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx={0} dy={1} stdDeviation={4} floodColor="rgba(0,0,0,0.15)"/>
                    </filter>
                </defs>
                <rect
                    x={0} y={0} width={w} height={h}
                    fill={background ?? 'white'}
                    filter={`url(#page-shadow-${shape.id})`}
                    pointerEvents="none"
                />
            </svg>
            {children}
        </div>
    )
}
