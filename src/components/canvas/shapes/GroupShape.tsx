import type {GroupShape} from '@model/shapes'
import {boxShadowCSS} from '@utils/shadowCSS'

interface Props {
    shape: GroupShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function GroupShapeComp({shape, isSelected, onClick, onDoubleClick, children}: Props) {
    const {x, y, width, height} = shape.transform
    return (
        <div
            style={{
                position: 'absolute',
                ...boxShadowCSS(shape),
                left: x,
                top: y,
                width,
                height,
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {children}
            {isSelected && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        border: '1px dashed #94a3b8',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    )
}
