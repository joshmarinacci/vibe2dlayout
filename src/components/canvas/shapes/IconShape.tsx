import type {IconShape} from '@model/shapes'
import {fillColor} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {lookupIcon} from '@utils/allLucideIcons'
import {boxShadowCSS} from '@utils/shadowCSS'
import styles from './Shape.module.css'

interface Props {
    shape: IconShape
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
}

export function IconShapeComp({shape, isSelected, onClick, onDoubleClick}: Props) {
    const {transform, fill, icon} = shape
    const {x, y, width, height} = transform

    const IconComp = lookupIcon(icon.name)
    const iconSize = Math.round(Math.min(width, height) * 0.8)

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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: fillColor(fill) === 'transparent' ? 'currentColor' : fillColor(fill),
                opacity: fill.opacity,
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {IconComp && <IconComp size={iconSize} strokeWidth={1.5}/>}
        </div>
    )
}
