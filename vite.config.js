import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Backend URL for the dev proxy. Override with API_PROXY_TARGET (e.g. when port 5000 is taken by macOS AirPlay).
var apiTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:5000';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
            '/storage': {
                target: apiTarget,
                changeOrigin: true,
                secure: false,
            },
        },
    },
});
