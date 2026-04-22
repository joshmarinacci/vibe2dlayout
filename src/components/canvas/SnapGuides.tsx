import type { GuideLines } from '@utils/alignmentSnap'

interface Props {
  guides: GuideLines
  zoom: number
}

const EXTENT = 50000

export function SnapGuides({ guides, zoom }: Props) {
  if (guides.x === null && guides.y === null) return null
  const sw = 1 / zoom
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: 0,
        height: 0,
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      {guides.x !== null && (
        <line
          x1={guides.x} y1={-EXTENT}
          x2={guides.x} y2={EXTENT}
          stroke="#e8396a"
          strokeWidth={sw}
        />
      )}
      {guides.y !== null && (
        <line
          x1={-EXTENT} y1={guides.y}
          x2={EXTENT} y2={guides.y}
          stroke="#e8396a"
          strokeWidth={sw}
        />
      )}
    </svg>
  )
}
