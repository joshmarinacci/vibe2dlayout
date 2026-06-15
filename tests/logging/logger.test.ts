import {beforeEach, describe, expect, it} from 'vitest'
import {clearLogRecords, createLogger, createPowerUpLogger, getLogRecords} from '../../src/logging'

beforeEach(() => {
    clearLogRecords()
})

describe('logging store', () => {
    it('records structured payloads with subsystem metadata', () => {
        const logger = createLogger('importer')
        logger.info('Imported document', {rootNodes: 2, meta: {source: 'disk'}})

        const [record] = getLogRecords()
        expect(record.subsystem).toBe('importer')
        expect(record.level).toBe('info')
        expect(record.message).toBe('Imported document')
        expect(record.payload).toEqual({rootNodes: 2, meta: {source: 'disk'}})
    })

    it('keeps the log buffer bounded', () => {
        const logger = createLogger('renderer')
        for (let i = 0; i < 1001; i++) {
            logger.debug(`Render pass ${i}`, {index: i})
        }

        const records = getLogRecords()
        expect(records).toHaveLength(1000)
        expect(records[0].payload).toEqual({index: 1})
        expect(records[999].payload).toEqual({index: 1000})
    })

    it('preserves power-up subsystem names', () => {
        const logger = createPowerUpLogger('physics')
        logger.warn('Power-up warning', {step: 'load'})

        expect(getLogRecords()[0].subsystem).toBe('powerup.physics')
    })
})
