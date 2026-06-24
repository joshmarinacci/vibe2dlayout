import type {RichTextStyleEntry, RichTextStyleSet} from './types'

function entryToProps(e: RichTextStyleEntry): string {
    return [
        `font-family: ${e.fontFamily}`,
        `font-size: ${e.fontSize}px`,
        `font-weight: ${e.fontWeight}`,
        `font-style: ${e.italic ? 'italic' : 'normal'}`,
        `color: ${e.color}`,
        `line-height: ${e.lineHeight}`,
        `letter-spacing: ${e.letterSpacing}px`,
    ].join('; ')
}

export function styleSetToCSS(s: RichTextStyleSet, scopeClass: string): string {
    const sel = `.${scopeClass}`
    return `
${sel} { all: initial; display: block; box-sizing: border-box; overflow: hidden; }
${sel} p { ${entryToProps(s.styles.body)}; margin: 0 0 0.75em 0; display: block; }
${sel} h1 { ${entryToProps(s.styles.h1)}; margin: 0 0 0.5em 0; display: block; }
${sel} h2 { ${entryToProps(s.styles.h2)}; margin: 0 0 0.5em 0; display: block; }
${sel} h3 { ${entryToProps(s.styles.h3)}; margin: 0 0 0.4em 0; display: block; }
${sel} blockquote { ${entryToProps(s.styles.blockquote)}; margin: 0 0 0.75em 1em; padding-left: 0.75em; border-left: 3px solid #ccc; display: block; }
${sel} code { ${entryToProps(s.styles.code)}; background: rgba(0,0,0,0.06); padding: 0.1em 0.35em; border-radius: 3px; }
${sel} pre { ${entryToProps(s.styles.codeBlock)}; background: rgba(0,0,0,0.05); padding: 0.75em 1em; border-radius: 4px; margin: 0 0 0.75em 0; display: block; white-space: pre-wrap; }
${sel} pre code { background: none; padding: 0; color: inherit; font-family: inherit; font-size: inherit; }
${sel} a { ${entryToProps(s.styles.link)}; text-decoration: underline; }
${sel} ul, ${sel} ol { ${entryToProps(s.styles.body)}; margin: 0 0 0.75em 1.5em; padding: 0; display: block; }
${sel} li { ${entryToProps(s.styles.body)}; margin-bottom: 0.2em; display: list-item; }
${sel} strong { font-weight: 700; }
${sel} em { font-style: italic; }
`.trim()
}
