import {useEffect} from 'react'

/**
 * Dynamically injects a Google Fonts <link> tag for each font name.
 * Loads weights 400 and 700 to support the Normal/Bold toggle.
 * Tags are never removed — fonts remain cached for the session even if
 * the user removes the font from the document.
 */
export function useDynamicFonts(fontNames: string[]): void {
    useEffect(() => {
        for (const name of fontNames) {
            const encoded = name.trim().replace(/ /g, '+')
            const id = `gfont-${encoded}`
            if (!document.getElementById(id)) {
                const link = document.createElement('link')
                link.id = id
                link.rel = 'stylesheet'
                link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`
                document.head.appendChild(link)
            }
        }
    }, [fontNames])
}
