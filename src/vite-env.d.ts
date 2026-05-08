/// <reference types="vite/client" />

declare module '*.module.css' {
    const classes: Record<string, string>
    export default classes
}

interface Window {
    __TAURI_INTERNALS__?: unknown
}
