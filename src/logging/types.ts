export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogJsonPrimitive = string | number | boolean | null

export type LogJsonValue = LogJsonPrimitive | LogJsonObject | LogJsonValue[]

export interface LogJsonObject {
    [key: string]: LogJsonValue
}

export interface LogRecord {
    id: number
    timestamp: number
    level: LogLevel
    subsystem: string
    message: string
    payload?: LogJsonValue
}

export interface Logger {
    subsystem: string
    debug(message: string, payload?: unknown): void
    info(message: string, payload?: unknown): void
    warn(message: string, payload?: unknown): void
    error(message: string, payload?: unknown): void
    child(subsystem: string): Logger
}
