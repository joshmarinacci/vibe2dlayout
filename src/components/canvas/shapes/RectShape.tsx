import type {GradientStroke, RectShape as RectShapeType} from '@model/shapes'
import {buildCSSTransform} from '@model/transform'
import {fillBackground} from '@utils/fillCSS'
import {boxShadowCSS} from '@utils/shadowCSS'
import {cornerRadiiCSS, strokeBorderCSS} from '@utils/strokeStyleCSS'
import styles from './Shape.module.css'

interface Props {
    shape: RectShapeType
    isSelected: boolean
    onClick: (e: React.MouseEvent) => void
    onDoubleClick: (e: React.MouseEvent) => void
    children?: React.ReactNode
}

function gradientStrokeCSS(gs: GradientStroke): string {
    const stops = gs.stops.map(s => `${s.color} ${Math.round(s.position * 100)}%`).join(', ')
    switch (gs.gradientType) {
        case 'linear': return `linear-gradient(${gs.angle}deg, ${stops})`
        case 'radial':  return `radial-gradient(circle, ${stops})`
        case 'conic':   return `conic-gradient(from ${gs.angle}deg, ${stops})`
    }
}

function GradientStrokeBorder({shape}: {shape: RectShapeType}) {
    const gs = shape.stroke as GradientStroke
    const borderRadius = cornerRadiiCSS(shape.cornerRadius, shape.cornerRadii)
    const gradient = gradientStrokeCSS(gs)
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            border: `${gs.width}px solid transparent`,
            background: `${gradient} border-box`,
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'destination-out',
            maskComposite: 'exclude',
            opacity: gs.opacity,
            pointerEvents: 'none',
            boxSizing: 'border-box',
        }}/>
    )
}

export function RectShape({shape, isSelected, onClick, onDoubleClick, children}: Props) {
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
                borderRadius: cornerRadiiCSS(shape.cornerRadius, shape.cornerRadii),
                ...strokeBorderCSS(stroke),
                boxSizing: 'border-box',
            }}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {stroke.type === 'gradient' && <GradientStrokeBorder shape={shape}/>}
            {children}
        </div>
    )
}
