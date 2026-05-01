import type {PageShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import styles from './Shape.module.css'

interface Props {
    shape: PageShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function PageShapeComp({shape, isSelected, onClick, onDoubleClick, children}: Props) {
    const {transform, background, clipChildren, fixedSize} = shape
    const {x, y, width, height} = transform

    return (
        <div
            className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: fixedSize?.width ?? width,
                height: fixedSize?.height ?? height,
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
                background,
                overflow: clipChildren ? 'hidden' : 'visible',
                boxShadow: '0 1px 8px rgba(0,0,0,0.15)',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {children}
        </div>
    )
}
