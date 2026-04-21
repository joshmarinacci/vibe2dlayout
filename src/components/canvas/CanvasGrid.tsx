import type { GridSettings } from '@model/grid'

interface Props {
  settings: GridSettings
}

export function CanvasGrid({ settings }: Props) {
  const { size, style, snapEnabled } = settings
  if (!snapEnabled || style === 'none') return null

  const patternId = `grid-${size}-${style}`

  return (
    <svg
      style={{
        position: 'absolute',
        left: -10000,
        top: -10000,
        width: 20000,
        height: 20000,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        <pattern id={patternId} width={size} height={size} patternUnits="userSpaceOnUse">
          {style === 'lines' && (
            <>
              <line x1={size} y1="0" x2={size} y2={size} stroke="#c8c8c8" strokeWidth={0.5} />
              <line x1="0" y1={size} x2={size} y2={size} stroke="#c8c8c8" strokeWidth={0.5} />
            </>
          )}
          {style === 'dots' && (
            <circle cx={size} cy={size} r={0.75} fill="#b0b0b0" />
          )}
        </pattern>
      </defs>
      <rect x="0" y="0" width="20000" height="20000" fill={`url(#${patternId})`} />
    </svg>
  )
}
