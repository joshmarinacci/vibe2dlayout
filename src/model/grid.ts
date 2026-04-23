export type GridStyle = 'lines' | 'dots' | 'none'

export interface GridSettings {
  size: number              // grid spacing in px, default 10
  style: GridStyle          // visual representation
  snapEnabled: boolean      // whether snap-to-grid is active
  snapAlignment: boolean    // whether snap-to-shapes/guides is active
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  size: 10,
  style: 'lines',
  snapEnabled: false,
  snapAlignment: true,
}
