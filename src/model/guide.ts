export interface CanvasGuide {
  id: string
  orientation: 'h' | 'v'  // 'h' = horizontal line (snaps y axis), 'v' = vertical line (snaps x axis)
  position: number          // canvas-space coordinate (x for 'v', y for 'h')
}
