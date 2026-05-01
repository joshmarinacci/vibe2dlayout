import {BoxShapeBase} from "@components/canvas/shapes/BoxShapeBase.tsx";
import type { ImageMockShape } from '@model/shapes'
import { roughRect, roughCircle, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'

interface Props {
  shape: ImageMockShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

export function ImageMockShapeComp({ shape, isSelected, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, fill, stroke } = shape
  const { width: w, height: h } = transform

  const seed = seedFromId(shape.id)
  const cx = w / 2
  const cy = h / 2
  const r = Math.min(w, h) * 0.35
  const eyeR = r * 0.12
  const lEx = cx - r * 0.35
  const lEy = cy - r * 0.25
  const rEx = cx + r * 0.35
  const rEy = cy - r * 0.25

  // Smile: 4 line segments approximating an arc
  const smilePoints = [
    { x: cx - r * 0.4, y: cy + r * 0.1 },
    { x: cx - r * 0.15, y: cy + r * 0.38 },
    { x: cx + r * 0.15, y: cy + r * 0.38 },
    { x: cx + r * 0.4, y: cy + r * 0.1 },
  ]

  const faceColor = stroke.color
  const bgColor = fill.color === 'transparent' ? undefined : fill.color

  const roughPaths = handDrawn ? [
    ...roughRect(0, 0, w, h, {
      seed,
      roughness: 1,
      bowing: 0.5,
      fill: bgColor,
      fillStyle: 'solid',
      fillWeight: 1,
      stroke: stroke.color,
      strokeWidth: stroke.width,
    }),
    ...roughCircle(cx, cy, r * 2, {
      seed: seed + 1,
      roughness: 1.2,
      bowing: 0.5,
      stroke: faceColor,
      strokeWidth: stroke.width,
    }),
    ...roughCircle(lEx, lEy, eyeR * 2, {
      seed: seed + 2,
      roughness: 1,
      fill: faceColor,
      fillStyle: 'solid',
      stroke: faceColor,
      strokeWidth: 1,
    }),
    ...roughCircle(rEx, rEy, eyeR * 2, {
      seed: seed + 3,
      roughness: 1,
      fill: faceColor,
      fillStyle: 'solid',
      stroke: faceColor,
      strokeWidth: 1,
    }),
    ...roughLine(smilePoints[0].x, smilePoints[0].y, smilePoints[1].x, smilePoints[1].y, {
      seed: seed + 4, roughness: 1.2, stroke: faceColor, strokeWidth: stroke.width,
    }),
    ...roughLine(smilePoints[1].x, smilePoints[1].y, smilePoints[2].x, smilePoints[2].y, {
      seed: seed + 5, roughness: 1.2, stroke: faceColor, strokeWidth: stroke.width,
    }),
    ...roughLine(smilePoints[2].x, smilePoints[2].y, smilePoints[3].x, smilePoints[3].y, {
      seed: seed + 6, roughness: 1.2, stroke: faceColor, strokeWidth: stroke.width,
    }),
  ] : []

  return (
      <BoxShapeBase shape={shape} isSelected={isSelected} onClick={onClick} onDoubleClick={onDoubleClick}>
      {handDrawn ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          width={w}
          height={h}
        >
          <RoughSvgPaths paths={roughPaths} />
        </svg>
      ) : (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          width={w}
          height={h}
        >
          {/* Background */}
          <rect
            x={0} y={0} width={w} height={h}
            fill={fill.color}
            stroke={stroke.color}
            strokeWidth={stroke.width}
          />
          {/* Head */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={faceColor} strokeWidth={stroke.width} />
          {/* Eyes */}
          <circle cx={lEx} cy={lEy} r={eyeR} fill={faceColor} />
          <circle cx={rEx} cy={rEy} r={eyeR} fill={faceColor} />
          {/* Smile (SVG arc) */}
          <path
            d={`M ${cx - r * 0.4},${cy + r * 0.1} A ${r * 0.5},${r * 0.4} 0 0,0 ${cx + r * 0.4},${cy + r * 0.1}`}
            fill="none"
            stroke={faceColor}
            strokeWidth={stroke.width}
            strokeLinecap="round"
          />
        </svg>
      )}
      </BoxShapeBase>
  )
}
