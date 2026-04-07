export type Anchor =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  x: number       // top-left x in parent-local coords
  y: number       // top-left y in parent-local coords
  width: number
  height: number
  rotation: number  // degrees, around bbox center
}
