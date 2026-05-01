import type {BoxShape} from "@model/shapes.ts";
import styles from './Shape.module.css'
import {buildCSSTransform} from "@model/transform.ts";
import {boxShadowCSS} from "@utils/shadowCSS.ts";

interface Props {
    shape:BoxShape,
    isSelected:boolean,
    onClick: (e: React.MouseEvent) => void,
    onDoubleClick: (e: React.MouseEvent) => void,
    children:React.ReactNode
    clipChildren?:boolean
}
export function BoxShapeBase(props:Props) {
    const {isSelected, shape} = props
    const {transform, fill} = shape
    const { x, y, width, height } = transform
    return (<div
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
            opacity: fill.opacity,
            overflow: props.clipChildren ? 'hidden' : 'visible',
        }}
        onClick={props.onClick}
        onDoubleClick={props.onDoubleClick}
    >
            {props.children}
        </div>
    )
}