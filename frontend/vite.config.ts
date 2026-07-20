import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/', // Ensures assets are served from the root
    plugins: [
        react(),
        tailwindcss(),
    ],
    build: {
        outDir: '../dist', // Standard output for root-level Vercel deployment
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    logLevel: 'info',
})
