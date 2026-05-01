import {resolve} from 'path'
import {defineConfig} from 'vitest/config'

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        globals: true,
    },
    resolve: {
        alias: {
            '@model': resolve(__dirname, 'src/model'),
            '@store': resolve(__dirname, 'src/store'),
            '@components': resolve(__dirname, 'src/components'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@hooks': resolve(__dirname, 'src/hooks'),
        },
    },
})
