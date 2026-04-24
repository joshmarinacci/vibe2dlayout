export interface PixelAsset {
  id: string
  name: string
  width: number     // pixel count (default 16)
  height: number
  pixels: number[]  // flat RGBA, length = width * height * 4; alpha 0 = transparent
}

export function createEmptyPixelAsset(id: string, name: string, w = 16, h = 16): PixelAsset {
  return { id, name, width: w, height: h, pixels: new Array(w * h * 4).fill(0) }
}

/** Get/set a single pixel's RGBA values by (col, row). */
export function getPixel(asset: PixelAsset, col: number, row: number): [number, number, number, number] {
  const i = (row * asset.width + col) * 4
  return [asset.pixels[i], asset.pixels[i + 1], asset.pixels[i + 2], asset.pixels[i + 3]]
}

export function setPixel(pixels: number[], width: number, col: number, row: number, r: number, g: number, b: number, a: number): void {
  const i = (row * width + col) * 4
  pixels[i]     = r
  pixels[i + 1] = g
  pixels[i + 2] = b
  pixels[i + 3] = a
}

/** Parse a CSS hex color (#rrggbb or #rrggbbaa) to RGBA components 0-255. */
export function hexToRgba(hex: string): [number, number, number, number] {
  const h = hex.replace('#', '')
  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      255,
    ]
  }
  if (h.length === 8) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      parseInt(h.slice(6, 8), 16),
    ]
  }
  return [0, 0, 0, 255]
}
