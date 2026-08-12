import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function normalizeBasePath(value?: string): string {
    if (!value) return ''

    const trimmed = value.trim()

    if (!trimmed) return ''

    const withLeadingSlash = trimmed.startsWith('/')
        ? trimmed
        : `/${trimmed}`

    return withLeadingSlash.replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    const basePath = normalizeBasePath(env.VITE_BASE_PATH)

    return {
        base: basePath ? `${basePath}/` : '/',
        plugins: [react()],
        optimizeDeps: {
            include: ['@ant-design/plots'],
        },
    }
})
