import createDebug from 'debug'
import {appendLogRecord, normalizeLogPayload} from './store'
import type {Logger, LogLevel} from './types'

const APP_NAMESPACE = 'limn'

function formatMessage(message: string, payload: unknown): [string, unknown?] {
    const normalized = normalizeLogPayload(payload)
    return normalized === undefined ? [message] : [message, normalized]
}

function emit(subsystem: string, level: LogLevel, message: string, payload?: unknown): void {
    const normalized = normalizeLogPayload(payload)
    appendLogRecord({subsystem, level, message, payload: normalized})

    const debugLogger = createDebug(`${APP_NAMESPACE}:${subsystem}`)
    if (debugLogger.enabled) {
        const [text, arg] = formatMessage(message, payload)
        if (arg === undefined) {
            debugLogger(text)
        } else {
            debugLogger(text, arg)
        }
    }
}

export function createLogger(subsystem: string): Logger {
    return {
        subsystem,
        debug(message: string, payload?: unknown) {
            emit(subsystem, 'debug', message, payload)
        },
        info(message: string, payload?: unknown) {
            emit(subsystem, 'info', message, payload)
        },
        warn(message: string, payload?: unknown) {
            emit(subsystem, 'warn', message, payload)
        },
        error(message: string, payload?: unknown) {
            emit(subsystem, 'error', message, payload)
        },
        child(childSubsystem: string) {
            return createLogger(`${subsystem}.${childSubsystem}`)
        },
    }
}

export const appLogger = createLogger('app')
export const rendererLogger = createLogger('renderer')
export const importerLogger = createLogger('importer')
export const exporterLogger = createLogger('exporter')

export function createPowerUpLogger(powerUpId: string): Logger {
    return createLogger(`powerup.${powerUpId}`)
}
