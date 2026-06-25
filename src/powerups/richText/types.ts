export interface RichTextStyleEntry {
    fontFamily: string
    fontSize: number
    fontWeight: number
    italic: boolean
    color: string
    lineHeight: number
    letterSpacing: number
}

export type StyleKey = 'body' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'code' | 'codeBlock' | 'link'

export interface RichTextStyleSet {
    id: string
    name: string
    styles: Record<StyleKey, RichTextStyleEntry>
}

export interface RichTextDocumentSettings {
    styleSets: RichTextStyleSet[]
    defaultStyleSetId: string
}
