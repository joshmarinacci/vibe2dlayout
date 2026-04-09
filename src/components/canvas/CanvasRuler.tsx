import { useRef, useEffect } from 'react'
import type { ViewTransform } from '@store/types'

const RULER_SIZE = 28
const TICK_COLOR = '#777'
const BG_COLOR = '#e8e8e8'
const BORDER_COLOR = '#bbb'
const LABEL_COLOR = '#555'

interface Props {
  viewTransform: ViewTransform
  pageOriginX: number
  pageOriginY: number
}

function pickInterval(zoom: number): { minor: number; major: number } {
  // Page-space pixels between minor ticks, keeping screen ticks ~12-60px apart
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]
  for (const c of candidates) {
    if (c * zoom >= 12) return { minor: c, major: c * 5 }
  }
  return { minor: 1000, major: 5000 }
}

export function CanvasRuler({ viewTransform, pageOriginX, pageOriginY }: Props) {
  const hRef = useRef<HTMLCanvasElement>(null)
  const vRef = useRef<HTMLCanvasElement>(null)

  const { panX, panY, zoom } = viewTransform

  useEffect(() => {
    const hCanvas = hRef.current
    const vCanvas = vRef.current
    if (!hCanvas || !vCanvas) return

    const dpr = window.devicePixelRatio || 1
    const cssW = hCanvas.offsetWidth
    const cssH = vCanvas.offsetHeight
    if (cssW === 0 || cssH === 0) return

    // Set canvas buffer to match CSS size (×dpr for sharpness)
    hCanvas.width = Math.round(cssW * dpr)
    hCanvas.height = Math.round(RULER_SIZE * dpr)
    vCanvas.width = Math.round(RULER_SIZE * dpr)
    vCanvas.height = Math.round(cssH * dpr)

    const { minor, major } = pickInterval(zoom)

    // ── Horizontal ruler ─────────────────────────────────────────────────
    {
      const ctx = hCanvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, cssW, RULER_SIZE)
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, cssW, RULER_SIZE)
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, RULER_SIZE - 0.5)
      ctx.lineTo(cssW, RULER_SIZE - 0.5)
      ctx.stroke()

      // Convert page coord 0 to screen x
      const originScreenX = pageOriginX * zoom + panX

      // Range of page coords visible
      const startPage = Math.floor((0 - panX) / zoom - pageOriginX)
      const endPage = Math.ceil((cssW - panX) / zoom - pageOriginX)
      const startTick = Math.floor(startPage / minor) * minor
      const endTick = Math.ceil(endPage / minor) * minor

      ctx.strokeStyle = TICK_COLOR
      ctx.fillStyle = LABEL_COLOR
      ctx.font = '11px sans-serif'
      ctx.textBaseline = 'middle'

      for (let p = startTick; p <= endTick; p += minor) {
        const screenX = (p + pageOriginX) * zoom + panX
        if (screenX < RULER_SIZE || screenX > cssW) continue
        const isMajor = p % major === 0
        const tickH = isMajor ? RULER_SIZE * 0.55 : RULER_SIZE * 0.3
        ctx.lineWidth = isMajor ? 1 : 0.5
        ctx.beginPath()
        ctx.moveTo(screenX + 0.5, RULER_SIZE - tickH)
        ctx.lineTo(screenX + 0.5, RULER_SIZE)
        ctx.stroke()
        if (isMajor) {
          const label = String(p)
          const labelW = ctx.measureText(label).width
          const labelX = screenX + 2
          // Only draw if label fits before the next major tick
          if (labelX + labelW < cssW) {
            ctx.fillText(label, labelX, (RULER_SIZE - tickH) / 2)
          }
        }
      }

      // Origin marker
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(originScreenX + 0.5, 0)
      ctx.lineTo(originScreenX + 0.5, RULER_SIZE)
      ctx.stroke()
    }

    // ── Vertical ruler ────────────────────────────────────────────────────
    {
      const ctx = vCanvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, RULER_SIZE, cssH)
      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, RULER_SIZE, cssH)
      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(RULER_SIZE - 0.5, 0)
      ctx.lineTo(RULER_SIZE - 0.5, cssH)
      ctx.stroke()

      const originScreenY = pageOriginY * zoom + panY

      const startPage = Math.floor((0 - panY) / zoom - pageOriginY)
      const endPage = Math.ceil((cssH - panY) / zoom - pageOriginY)
      const startTick = Math.floor(startPage / minor) * minor
      const endTick = Math.ceil(endPage / minor) * minor

      ctx.strokeStyle = TICK_COLOR
      ctx.fillStyle = LABEL_COLOR
      ctx.font = '11px sans-serif'
      ctx.textBaseline = 'middle'

      for (let p = startTick; p <= endTick; p += minor) {
        const screenY = (p + pageOriginY) * zoom + panY
        if (screenY < RULER_SIZE || screenY > cssH) continue
        const isMajor = p % major === 0
        const tickW = isMajor ? RULER_SIZE * 0.55 : RULER_SIZE * 0.3
        ctx.lineWidth = isMajor ? 1 : 0.5
        ctx.beginPath()
        ctx.moveTo(RULER_SIZE - tickW, screenY + 0.5)
        ctx.lineTo(RULER_SIZE, screenY + 0.5)
        ctx.stroke()
        if (isMajor) {
          const label = String(p)
          const labelW = ctx.measureText(label).width
          ctx.save()
          ctx.translate((RULER_SIZE - tickW) / 2, screenY)
          ctx.rotate(-Math.PI / 2)
          ctx.fillText(label, -labelW / 2, 0)
          ctx.restore()
        }
      }

      // Origin marker
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, originScreenY + 0.5)
      ctx.lineTo(RULER_SIZE, originScreenY + 0.5)
      ctx.stroke()
    }
  }, [panX, panY, zoom, pageOriginX, pageOriginY])

  return (
    <>
      {/* Corner square */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: RULER_SIZE,
        height: RULER_SIZE,
        background: BG_COLOR,
        borderRight: `1px solid ${BORDER_COLOR}`,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        zIndex: 10,
      }} />
      {/* Horizontal ruler — no fixed width/height attrs; dynamically sized in effect */}
      <canvas
        ref={hRef}
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          width: `calc(100% - ${RULER_SIZE}px)`,
          height: RULER_SIZE,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
      {/* Vertical ruler */}
      <canvas
        ref={vRef}
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          width: RULER_SIZE,
          height: `calc(100% - ${RULER_SIZE}px)`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

export { RULER_SIZE }
