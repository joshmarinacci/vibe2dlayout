import type {RichTextStyleSet} from './types'

export const DEFAULT_STYLE_SET_ID = 'default'

export const DEFAULT_STYLE_SET: RichTextStyleSet = {
    id: DEFAULT_STYLE_SET_ID,
    name: 'Default',
    styles: {
        body: {fontFamily: 'system-ui, sans-serif', fontSize: 15, fontWeight: 400, italic: false, color: '#1a1a1a', lineHeight: 1.6, letterSpacing: 0},
        h1:   {fontFamily: 'system-ui, sans-serif', fontSize: 32, fontWeight: 700, italic: false, color: '#111111', lineHeight: 1.2, letterSpacing: -0.5},
        h2:   {fontFamily: 'system-ui, sans-serif', fontSize: 24, fontWeight: 600, italic: false, color: '#111111', lineHeight: 1.3, letterSpacing: -0.3},
        h3:   {fontFamily: 'system-ui, sans-serif', fontSize: 18, fontWeight: 600, italic: false, color: '#111111', lineHeight: 1.4, letterSpacing: 0},
        blockquote: {fontFamily: 'system-ui, sans-serif', fontSize: 15, fontWeight: 400, italic: true, color: '#666666', lineHeight: 1.6, letterSpacing: 0},
        code:      {fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 400, italic: false, color: '#c7254e', lineHeight: 1.4, letterSpacing: 0},
        codeBlock: {fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 400, italic: false, color: '#333333', lineHeight: 1.5, letterSpacing: 0},
        link:      {fontFamily: 'system-ui, sans-serif', fontSize: 15, fontWeight: 400, italic: false, color: '#0066cc', lineHeight: 1.6, letterSpacing: 0},
    },
}
