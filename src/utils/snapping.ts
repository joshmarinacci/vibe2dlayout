import type { GridSettings } from '@model/grid'
import type { Shape } from '@model/shapes'

/** Snap a value to the nearest grid line */
export function snapToGrid(value: number, size: number): number {
  return Math.round(value / size) * size
}

/**
 * Returns the effective grid settings for the currently active page,
 * merging document-level defaults with any page-level overrides.
 */
export function getEffectiveGridSettings(
  pageId: string | null,
  shapes: Record<string, Shape>,
  docSettings: GridSettings,
): GridSettings {
  if (!pageId) return docSettings
  const page = shapes[pageId]
  if (!page || page.type !== 'page' || !page.gridSettings) return docSettings
  return { ...docSettings, ...page.gridSettings }
}
