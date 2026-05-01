import type {CircleShape} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {fillBackground} from '@utils/fillCSS'
import {boxShadowCSS} from '@utils/shadowCSS'
import {strokeBorderCSS} from '@utils/strokeStyleCSS'
import styles from './Shape.module.css'

interface Props {
    shape: CircleShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

export function CircleShapeComp({shape, isSelected, onClick, onDoubleClick, children}: Props) {
    const {transform, fill, stroke} = shape
    const {x, y, width, height} = transform

    return (
        <div
            className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
            style={{
                position: 'absolute',
                ...boxShadowCSS(shape),
                left: x,
                top: y,
                width,
                height,
                transform: buildCSSTransform(transform),
                transformOrigin: 'center center',
                background: fillBackground(fill),
                opacity: fill.opacity,
                borderRadius: '50%',
                ...strokeBorderCSS(stroke),
                boxSizing: 'border-box',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {children}
        </div>
    )
}
