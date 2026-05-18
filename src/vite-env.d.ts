/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __BUILD_TIME__: string

declare module '*.module.css' {
    const classes: Record<string, string>
    export default classes
}

interface Window {
    __TAURI_INTERNALS__?: unknown
}
