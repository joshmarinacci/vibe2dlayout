import {useSyncExternalStore} from 'react'
import type {LogJsonValue, LogRecord} from './types'

const MAX_RECORDS = 1000

type Listener = () => void

let nextId = 1
let records: LogRecord[] = []
const listeners = new Set<Listener>()

function notify(): void {
    for (const listener of listeners) listener()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

function normalizeError(error: Error): LogJsonValue {
    const payload: Record<string, LogJsonValue> = {
        name: error.name,
        message: error.message,
    }
    if (error.stack) payload.stack = error.stack
    return payload
}

function normalizeValue(value: unknown, seen: WeakSet<object>, depth: number): LogJsonValue | undefined {
    if (value === undefined) return undefined
    if (value === null) return null
    const kind = typeof value
    if (kind === 'string' || kind === 'number' || kind === 'boolean') return value as LogJsonValue
    if (kind === 'bigint') return value.toString()
    if (kind === 'function') return `[Function ${(value as Function).name || 'anonymous'}]`
    if (kind === 'symbol') return value.toString()
    if (value instanceof Date) return value.toISOString()
    if (value instanceof Error) return normalizeError(value)
    if (Array.isArray(value)) {
        return value.map(item => normalizeValue(item, seen, depth + 1) ?? null)
    }
    if (kind !== 'object') return String(value)
    if (seen.has(value)) return '[Circular]'
    if (depth > 6) return '[MaxDepth]'
    seen.add(value)
    if (value instanceof Map) {
        return {
            type: 'Map',
            entries: [...value.entries()].map(([key, entryValue]) => ([
                normalizeValue(key, seen, depth + 1) ?? null,
                normalizeValue(entryValue, seen, depth + 1) ?? null,
            ])) as unknown as LogJsonValue,
        } as unknown as LogJsonValue
    }
    if (value instanceof Set) {
        return {
            type: 'Set',
            values: [...value.values()].map(item => normalizeValue(item, seen, depth + 1) ?? null),
        } as unknown as LogJsonValue
    }
    if (!isPlainObject(value)) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([, child]) => child !== undefined)
                .map(([key, child]) => [key, normalizeValue(child, seen, depth + 1) ?? null]),
        ) as LogJsonValue
    }
    const out: Record<string, LogJsonValue> = {}
    for (const [key, child] of Object.entries(value)) {
        const normalized = normalizeValue(child, seen, depth + 1)
        if (normalized !== undefined) out[key] = normalized
    }
    return out
}

export function normalizeLogPayload(payload: unknown): LogJsonValue | undefined {
    return normalizeValue(payload, new WeakSet<object>(), 0)
}

export function appendLogRecord(entry: Omit<LogRecord, 'id' | 'timestamp'> & { timestamp?: number }): LogRecord {
    const record: LogRecord = {
        id: nextId++,
        timestamp: entry.timestamp ?? Date.now(),
        level: entry.level,
        subsystem: entry.subsystem,
        message: entry.message,
        payload: entry.payload,
    }
    records = [...records, record].slice(-MAX_RECORDS)
    notify()
    return record
}

export function getLogRecords(): LogRecord[] {
    return records
}

export function clearLogRecords(): void {
    records = []
    notify()
}

export function subscribeLogRecords(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function useLogRecords(): LogRecord[] {
    return useSyncExternalStore(subscribeLogRecords, getLogRecords, getLogRecords)
}
