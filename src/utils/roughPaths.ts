import rough from 'roughjs'
import type { Options as RoughOptions } from 'roughjs/bin/core'

export type { RoughOptions }

const gen = rough.generator()

/** Stable numeric seed from a shape ID string so rough paths don't jitter on re-render. */
export function seedFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  }
  return Math.abs(h) || 1
}

export interface PathInfo {
  d: string
  stroke: string
  strokeWidth: number
  fill: string
  fillStyle?: string
  strokeLineDash?: number[]
}

function toPathInfos(drawable: ReturnType<typeof gen.rectangle>): PathInfo[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return gen.toPaths(drawable).map((p: any) => ({
    d: p.d as string,
    stroke: p.stroke as string,
    strokeWidth: p.strokeWidth as number,
    fill: (p.fill ?? 'none') as string,
    fillStyle: p.fillStyle as string | undefined,
    strokeLineDash: p.strokeLineDash as number[] | undefined,
  }))
}

export function roughRect(
  x: number, y: number, w: number, h: number, opts: RoughOptions,
): PathInfo[] {
  return toPathInfos(gen.rectangle(x, y, w, h, opts))
}

export function roughCircle(
  cx: number, cy: number, diameter: number, opts: RoughOptions,
): PathInfo[] {
  return toPathInfos(gen.circle(cx, cy, diameter, opts))
}

export function roughLine(
  x1: number, y1: number, x2: number, y2: number, opts: RoughOptions,
): PathInfo[] {
  return toPathInfos(gen.line(x1, y1, x2, y2, opts))
}
