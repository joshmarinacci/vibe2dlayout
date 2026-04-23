import { buildCSSTransform } from '@model/transform'
import { boxShadowCSS } from '@utils/shadowCSS'
import type { ChartMockShape } from '@model/shapes'
import { roughRect, roughCircle, roughLine, seedFromId } from '@utils/roughPaths'
import { RoughSvgPaths } from '@utils/RoughSvgPaths'
import styles from './Shape.module.css'

interface Props {
  shape: ChartMockShape
  isSelected: boolean
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: (e: React.MouseEvent) => void
  handDrawn: boolean
}

const DATA = [0.4, 0.7, 0.55, 0.85, 0.6]

export function ChartMockShapeComp({ shape, isSelected, onClick, onDoubleClick, handDrawn }: Props) {
  const { transform, fill, stroke, chartType } = shape
  const { x, y, width: w, height: h } = transform

  const seed = seedFromId(shape.id)
  const p = 8
  const axisX = p + 2
  const axisY = h - p
  const chartW = w - axisX - p
  const chartH = axisY - p
  const barColor = fill.color
  const axisColor = stroke.color

  // Bar geometry
  const gap = chartW / (DATA.length + 1)
  const barW = gap * 0.6
  const bars = DATA.map((v, i) => ({
    bx: axisX + gap * (i + 1) - barW / 2,
    by: p + chartH * (1 - v),
    bw: barW,
    bh: chartH * v,
  }))

  // Line geometry
  const pts = DATA.map((v, i) => ({
    px: axisX + gap * (i + 1),
    py: p + chartH * (1 - v),
  }))

  const roughPaths = handDrawn ? [
    // Axes
    ...roughLine(axisX, p, axisX, axisY, {
      seed, roughness: 1, stroke: axisColor, strokeWidth: stroke.width,
    }),
    ...roughLine(axisX, axisY, w - p, axisY, {
      seed: seed + 1, roughness: 1, stroke: axisColor, strokeWidth: stroke.width,
    }),
    // Bars or lines
    ...(chartType === 'bar'
      ? bars.flatMap((b, i) => roughRect(b.bx, b.by, b.bw, b.bh, {
          seed: seed + 10 + i,
          roughness: 1.2,
          bowing: 0.5,
          fill: barColor,
          fillStyle: 'solid',
          fillWeight: 2,
          stroke: barColor,
          strokeWidth: 1,
        }))
      : [
          ...pts.slice(0, -1).flatMap((pt, i) => roughLine(pt.px, pt.py, pts[i + 1].px, pts[i + 1].py, {
            seed: seed + 10 + i,
            roughness: 1,
            stroke: barColor,
            strokeWidth: stroke.width + 1,
          })),
          ...pts.flatMap((pt, i) => roughCircle(pt.px, pt.py, 6, {
            seed: seed + 20 + i,
            roughness: 1,
            fill: barColor,
            fillStyle: 'solid',
            stroke: barColor,
            strokeWidth: 1,
          })),
        ]
    ),
  ] : []

  return (
    <div
      className={`${styles.shape} ${isSelected ? styles.selected : ''}`}
      style={{
        position: 'absolute',
        ...boxShadowCSS(shape),
        left: x,
        top: y,
        width: w,
        height: h,
        transform: buildCSSTransform(transform),
        transformOrigin: 'center center',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
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
          {/* Axes */}
          <line x1={axisX} y1={p} x2={axisX} y2={axisY} stroke={axisColor} strokeWidth={stroke.width} />
          <line x1={axisX} y1={axisY} x2={w - p} y2={axisY} stroke={axisColor} strokeWidth={stroke.width} />

          {chartType === 'bar' ? (
            bars.map((b, i) => (
              <rect key={i} x={b.bx} y={b.by} width={b.bw} height={b.bh} fill={barColor} />
            ))
          ) : (
            <>
              <polyline
                points={pts.map(pt => `${pt.px},${pt.py}`).join(' ')}
                fill="none"
                stroke={barColor}
                strokeWidth={stroke.width + 1}
                strokeLinejoin="round"
              />
              {pts.map((pt, i) => (
                <circle key={i} cx={pt.px} cy={pt.py} r={3} fill={barColor} />
              ))}
            </>
          )}
        </svg>
      )}
    </div>
  )
}
