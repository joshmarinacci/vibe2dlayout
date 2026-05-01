import type {CustomFont} from '@model/document'
import {buildGoogleFontHref} from '@utils/fontFeatures'
import {useEffect} from 'react'

/**
 * Dynamically injects a Google Fonts <link> tag for each custom font.
 * Once variable metadata is known, the link is upgraded to request the full
 * axis design space so `font-variation-settings` can take effect in the UI.
 * Tags are never removed — fonts remain cached for the session even if
 * the user removes the font from the document.
 */
export function useDynamicFonts(fonts: CustomFont[]): void {
    useEffect(() => {
        for (const font of fonts) {
            const encoded = font.name.trim().replace(/ /g, '+')
            const id = `gfont-${encoded}`
            const href = buildGoogleFontHref(font)
            const existing = document.getElementById(id) as HTMLLinkElement | null

            if (existing) {
                if (existing.href !== href) existing.href = href
                continue
            }

            const link = document.createElement('link')
            link.id = id
            link.rel = 'stylesheet'
            link.href = href
            document.head.appendChild(link)
        }
    }, [fonts])
}
