import { useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { AppAction } from '@store/types'
import type { CustomFont } from '@model/document'
import { detectVariableAxes } from '@utils/fontFeatures'

/**
 * Watches customFonts for entries where isVariable === null (not yet detected).
 * For each, fetches the font file via opentype.js and dispatches UPDATE_CUSTOM_FONT_META
 * with the detected variable status and axes.
 * Uses a ref to avoid duplicate in-flight requests across re-renders.
 */
export function useFontMetadataEnrichment(
  customFonts: CustomFont[],
  dispatch: Dispatch<AppAction>,
): void {
  const inFlight = useRef(new Set<string>())

  useEffect(() => {
    for (const font of customFonts) {
      if (font.isVariable !== null) continue
      if (inFlight.current.has(font.name)) continue
      inFlight.current.add(font.name)

      detectVariableAxes(font.name).then(axes => {
        inFlight.current.delete(font.name)
        if (axes === null) {
          // Detection failed (WOFF2-only or network) — leave isVariable as null
          return
        }
        dispatch({
          type: 'UPDATE_CUSTOM_FONT_META',
          fontName: font.name,
          patch: {
            isVariable: axes.length > 0,
            axes,
          },
        })
      })
    }
  }, [customFonts, dispatch])
}
