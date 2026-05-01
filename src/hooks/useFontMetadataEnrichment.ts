import type {CustomFont} from '@model/document'
import type {AppAction} from '@store/types'
import {detectVariableAxes} from '@utils/fontFeatures'
import type {Dispatch} from 'react'
import {useEffect, useRef} from 'react'

const CURRENT_FONT_METADATA_VERSION = 6

/**
 * Watches customFonts for entries whose metadata is missing or outdated.
 * For each, uses Google Fonts CSS probing plus font parsing to discover the
 * available variable axes, with CSS inspection as a fallback.
 * Uses a ref to avoid duplicate in-flight requests across re-renders.
 */
export function useFontMetadataEnrichment(
    customFonts: CustomFont[],
    dispatch: Dispatch<AppAction>,
): void {
    const inFlight = useRef(new Set<string>())

    useEffect(() => {
        for (const font of customFonts) {
            if (font.metadataVersion === CURRENT_FONT_METADATA_VERSION && font.isVariable !== null) continue
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
                        metadataVersion: CURRENT_FONT_METADATA_VERSION,
                        isVariable: axes.length > 0,
                        axes,
                    },
                })
            })
        }
    }, [customFonts, dispatch])
}
