import type {CustomFont} from '@model/document'
import type {AppAction} from '@store/types'
import {detectVariableAxes} from '@utils/fontFeatures'
import type {Dispatch} from 'react'
import {useEffect, useRef} from 'react'

const CURRENT_FONT_METADATA_VERSION = 6

export function useLibraryFontMetadataEnrichment(
    fonts: CustomFont[],
    dispatch: Dispatch<AppAction>,
): void {
    const inFlight = useRef(new Set<string>())

    useEffect(() => {
        for (const font of fonts) {
            if (font.metadataVersion === CURRENT_FONT_METADATA_VERSION && font.isVariable !== null) continue
            if (inFlight.current.has(font.name)) continue
            inFlight.current.add(font.name)

            detectVariableAxes(font.name).then(axes => {
                inFlight.current.delete(font.name)
                if (axes === null) return
                dispatch({
                    type: 'UPDATE_LIBRARY_FONT',
                    font: {
                        ...font,
                        metadataVersion: CURRENT_FONT_METADATA_VERSION,
                        isVariable: axes.length > 0,
                        axes,
                    },
                })
            })
        }
    }, [fonts, dispatch])
}
