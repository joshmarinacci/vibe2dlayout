import type { SliderShape } from '@model/shapes'
import { roughRect, roughCircle, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: SliderShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

export function SliderShapeComp({ shape, isSelected, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, value, trackFill, thumbFill } = shape
  const { x, y, width, height, rotation } = transform
  const thumbSize = height
  const thumbX = value * (width - thumbSize)
  const trackHeight = height * 0.3
  const trackY = (height - trackHeight) / 2
  const trackX = thumbSize / 2

  const seed = seedFromId(shape.id)
  const trackPaths = handDrawn ? roughRect(trackX, trackY, width - thumbSize, trackHeight, {
    seed,
    roughness: 1.2,
    bowing: 0.5,
    fill: trackFill.color === 'transparent' ? undefined : trackFill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: trackFill.color === 'transparent' ? '#999' : trackFill.color,
    strokeWidth: 1.5,
  }) : []

  const thumbCx = thumbX + thumbSize / 2
  const thumbCy = height / 2
  const thumbPaths = handDrawn ? roughCircle(thumbCx, thumbCy, thumbSize, {
    seed: seed + 1,
    roughness: 1.4,
    bowing: 1,
    fill: thumbFill.color === 'transparent' ? undefined : thumbFill.color,
    fillStyle: 'solid',
    fillWeight: 1,
    stroke: thumbFill.color === 'transparent' ? '#555' : thumbFill.color,
    strokeWidth: 1.5,
  }) : []

  return (
    <div
      className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {handDrawn ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          width={width}
          height={height}
        >
          <RoughSvgPaths paths={trackPaths} />
          <RoughSvgPaths paths={thumbPaths} />
        </svg>
      ) : (
        <>
          {/* Plain track */}
          <div style={{
            position: 'absolute',
            left: trackX,
            top: trackY,
            width: width - thumbSize,
            height: trackHeight,
            background: trackFill.color,
            borderRadius: trackHeight / 2,
          }} />
          {/* Plain thumb */}
          <div style={{
            position: 'absolute',
            left: thumbX,
            top: 0,
            width: thumbSize,
            height: thumbSize,
            background: thumbFill.color,
            borderRadius: '50%',
            border: `1.5px solid ${thumbFill.color}`,
          }} />
        </>
      )}
    </div>
  )
}
