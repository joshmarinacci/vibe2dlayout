import react from '@vitejs/plugin-react'
import {readFileSync} from 'fs'
import {resolve} from 'path'
import {defineConfig} from 'vite'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
        port: 1420,
        strictPort: true,
    },
    define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        __BUILD_TIME__: JSON.stringify(buildTime),
    },
    resolve: {
        alias: {
            '@model': resolve(__dirname, 'src/model'),
            '@store': resolve(__dirname, 'src/store'),
            '@components': resolve(__dirname, 'src/components'),
            '@utils': resolve(__dirname, 'src/utils'),
            '@hooks': resolve(__dirname, 'src/hooks'),
            '@logging': resolve(__dirname, 'src/logging'),
            '@powerups': resolve(__dirname, 'src/powerups'),
        },
    },
})
