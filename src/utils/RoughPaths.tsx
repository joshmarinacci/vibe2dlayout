import type { PathInfo } from './roughPaths'

interface Props {
  paths: PathInfo[]
}

export function RoughPaths({ paths }: Props) {
  return (
    <>
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          stroke={p.stroke !== 'none' ? p.stroke : undefined}
          strokeWidth={p.strokeWidth}
          fill={p.fill !== 'none' ? p.fill : 'none'}
          strokeDasharray={p.strokeLineDash?.join(' ')}
        />
      ))}
    </>
  )
}
