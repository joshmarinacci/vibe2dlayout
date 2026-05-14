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
- **Save/Load**: Save and open `.vibe2d` documents (native file dialog in Tauri; localStorage in browser)
- **Export**: Export the active page as PNG, PDF (all pages), or a self-contained HTML file

## UI Layout

- **Left sidebar**: Document tree — add/delete/reorder shapes, toggle visibility and lock
- **Canvas** (center): Draw and manipulate shapes; double-click to edit text inline
- **Right panel**: Properties editor for the selected shape

## Tools (Toolbar)

| Icon | Mode      | Description                         |
|------|-----------|-------------------------------------|
| ↖    | Select    | Select, move, resize shapes         |
| ✋    | Pan       | Pan the canvas                      |
| ▭    | Rectangle | Draw a rectangle                    |
| ○    | Circle    | Draw a circle                       |
| /    | Line      | Draw a connector line               |
| T    | Text      | Add a text shape                    |
| 🖼   | Image     | Add an image (upload after placing) |
| ⬜    | Button    | Add a button UI component           |
| ⊡    | Panel     | Add a panel UI component            |
| ⊟    | Slider    | Add a slider UI component           |
| 📄   | Page      | Add a nested page                   |

## Keyboard Shortcuts

| Key                | Action                    |
|--------------------|---------------------------|
| Cmd/Ctrl+Z         | Undo                      |
| Cmd/Ctrl+Shift+Z   | Redo                      |
| Cmd/Ctrl+A         | Select all                |
| Delete / Backspace | Delete selected shapes    |
| Escape             | Deselect / stop text edit |
| Arrow keys         | Nudge 1px (Shift: 10px)   |

## Exporting

The active page must have a **fixed size** set (width + height in the properties panel) for PNG and HTML export.

| Format | How to trigger | Output |
|--------|---------------|--------|
| PNG    | File → Export PNG… | Raster image of the active page |
| PDF    | File → Export PDF… | All fixed-size pages as a multi-page PDF |
| HTML   | File → Export HTML… or right-click a page in the tree | Self-contained `.html` file with inline CSS |

The HTML export reproduces all shape types with their fill, stroke, transform, and text styling (including variable font axes). Font families are auto-imported from Google Fonts; images are embedded as base64 data URIs.

## File Format

Documents are saved as `.vibe2d` JSON files. Images are embedded as base64 data URIs.

## Architecture

- **`src/model/`** — Pure TypeScript types: shapes, document tree, transforms, connectors
- **`src/store/`** — App state via React context + useReducer; undo/redo history
- **`src/components/`** — React components: canvas, tree panel, properties panel, toolbar
- **`src/utils/`** — Geometry helpers, connector routing, serialization, shape factory
- **`src/hooks/`** — Canvas pointer handling, pan/zoom, keyboard shortcuts
- **`tests/`** — Vitest unit tests for model, store, and utilities
