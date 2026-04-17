export interface Theme {
  id: string
  name: string
  isBuiltIn?: boolean      // cannot be deleted; shown as read-only in editor
  foreground: string       // default text color
  background: string       // default fill/background color
  border: string           // default stroke color
  borderWidth: number      // default stroke width (px)
  borderRadius: number     // default corner radius (px)
  handDrawn: boolean       // true = RoughJS, false = plain CSS
  fontFamily: string       // default font family
  fontSize: number         // default font size (px)
}

export const BUILT_IN_THEMES: Theme[] = [
  {
    id: 'hand-drawn',
    name: 'Hand Drawn',
    isBuiltIn: true,
    foreground: '#333333',
    background: '#ffffff',
    border: '#333333',
    borderWidth: 1.5,
    borderRadius: 4,
    handDrawn: true,
    fontFamily: 'Caveat, cursive',
    fontSize: 16,
  },
  {
    id: 'plain-light',
    name: 'Plain Light',
    isBuiltIn: true,
    foreground: '#111111',
    background: '#ffffff',
    border: '#d1d5db',
    borderWidth: 1,
    borderRadius: 6,
    handDrawn: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
  },
  {
    id: 'plain-dark',
    name: 'Plain Dark',
    isBuiltIn: true,
    foreground: '#f3f4f6',
    background: '#1f2937',
    border: '#374151',
    borderWidth: 1,
    borderRadius: 6,
    handDrawn: false,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
  },
]

export function getActiveTheme(doc: { themes?: Theme[]; activeThemeId?: string }): Theme {
  const themes = doc.themes ?? BUILT_IN_THEMES
  const activeId = doc.activeThemeId ?? 'hand-drawn'
  return themes.find(t => t.id === activeId) ?? BUILT_IN_THEMES[0]
}
