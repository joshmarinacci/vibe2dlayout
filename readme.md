# Vibe 2D Layout

A visual drawing and layout program for 2D shapes, UI mockups, slide decks, and box diagrams.

## Getting Started

```bash
npm install
npm run dev        # start dev server at http://localhost:5173
npm test           # run unit tests
npm run build      # production build
```

## Features

- **Shape types**: Rectangle, Circle, Line/Connector, Text, Image, Button, Panel, Slider, Page
- **Canvas**: Pan (scroll or H tool), zoom (Ctrl+scroll), select, move, resize
- **Connectors**: Lines that attach to shapes and move with them
- **Nested shapes**: Shapes can contain children; parent optionally clips children
- **Pages**: Multiple pages in one document; select active page in tree
- **Undo/Redo**: Full history with Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z
- **Save/Load**: Export and import JSON documents via the toolbar

## UI Layout

- **Left sidebar**: Document tree — add/delete/reorder shapes, toggle visibility and lock
- **Canvas** (center): Draw and manipulate shapes; double-click to edit text inline
- **Right panel**: Properties editor for the selected shape

## Tools (Toolbar)

| Icon | Mode | Description |
|------|------|-------------|
| ↖ | Select | Select, move, resize shapes |
| ✋ | Pan | Pan the canvas |
| ▭ | Rectangle | Draw a rectangle |
| ○ | Circle | Draw a circle |
| / | Line | Draw a connector line |
| T | Text | Add a text shape |
| 🖼 | Image | Add an image (upload after placing) |
| ⬜ | Button | Add a button UI component |
| ⊡ | Panel | Add a panel UI component |
| ⊟ | Slider | Add a slider UI component |
| 📄 | Page | Add a nested page |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Cmd/Ctrl+Z | Undo |
| Cmd/Ctrl+Shift+Z | Redo |
| Cmd/Ctrl+A | Select all |
| Delete / Backspace | Delete selected shapes |
| Escape | Deselect / stop text edit |
| Arrow keys | Nudge 1px (Shift: 10px) |

## File Format

Documents are saved as JSON (`.vibe.json`). Images are embedded as base64 with mimeType.

## Architecture

- **`src/model/`** — Pure TypeScript types: shapes, document tree, transforms, connectors
- **`src/store/`** — App state via React context + useReducer; undo/redo history
- **`src/components/`** — React components: canvas, tree panel, properties panel, toolbar
- **`src/utils/`** — Geometry helpers, connector routing, serialization, shape factory
- **`src/hooks/`** — Canvas pointer handling, pan/zoom, keyboard shortcuts
- **`tests/`** — Vitest unit tests for model, store, and utilities
