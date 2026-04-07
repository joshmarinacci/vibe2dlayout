import type { Dispatch } from 'react'
import type { LineShape } from '@model/shapes'
import type { Shape } from '@model/shapes'
import type { AppAction } from '@store/types'
import { resolveEndpoint, buildConnectorPath, arrowMarkerPath } from '@utils/connectors'

interface Props {
  shape: LineShape
  shapes: Record<string, Shape>
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  dispatch: Dispatch<AppAction>
}

export function LineShapeComp({ shape, shapes, isSelected, onClick }: Props) {
  const start = resolveEndpoint(shape.start, shapes)
  const end = resolveEndpoint(shape.end, shapes)

  // SVG is positioned at (minX, minY) in canvas space.
  // All path/handle coords must be relative to that origin.
  const pad = 20
  const minX = Math.min(start.x, end.x) - pad
  const minY = Math.min(start.y, end.y) - pad
  const svgW = Math.abs(end.x - start.x) + pad * 2
  const svgH = Math.abs(end.y - start.y) + pad * 2

  const localStart = { x: start.x - minX, y: start.y - minY }
  const localEnd = { x: end.x - minX, y: end.y - minY }
  const pathD = buildConnectorPath(localStart, localEnd, shape.route)

  const markerId = `arrow-${shape.id}`
  const markerStartId = `arrow-start-${shape.id}`
  const { stroke } = shape

  return (
    <svg
      style={{
        position: 'absolute',
        left: minX,
        top: minY,
        width: svgW,
        height: svgH,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <defs>
        {shape.endArrow !== 'none' && (
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <path d={arrowMarkerPath(shape.endArrow)} fill={stroke.color} />
          </marker>
        )}
        {shape.startArrow !== 'none' && (
          <marker
            id={markerStartId}
            markerWidth="10"
            markerHeight="10"
            refX="1"
            refY="5"
            orient="auto-start-reverse"
          >
            <path d={arrowMarkerPath(shape.startArrow)} fill={stroke.color} />
          </marker>
        )}
      </defs>

      {/* Wide invisible hit area */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(stroke.width + 8, 12)}
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onClick={onClick}
      />

      {/* Visible stroke */}
      <path
        d={pathD}
        fill="none"
        stroke={stroke.color}
        strokeWidth={stroke.width}
        strokeDasharray={stroke.dash.join(' ')}
        strokeOpacity={stroke.opacity}
        markerEnd={shape.endArrow !== 'none' ? `url(#${markerId})` : undefined}
        markerStart={shape.startArrow !== 'none' ? `url(#${markerStartId})` : undefined}
        style={{ pointerEvents: 'none' }}
      />

      {/* Endpoint handles when selected */}
      {isSelected && (
        <>
          <circle cx={localStart.x} cy={localStart.y} r={5} fill="#3b82f6" stroke="white" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
          <circle cx={localEnd.x} cy={localEnd.y} r={5} fill="#3b82f6" stroke="white" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
        </>
      )}
    </svg>
  )
}
