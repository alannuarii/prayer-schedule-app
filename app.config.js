import { defineConfig } from "@solidjs/start/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    vite: {
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png', 'home-indicator.css'],
                manifest: {
                    name: 'Jadwal Sholat',
                    short_name: 'Jadwal Sholat',
                    description: 'Aplikasi Jadwal Sholat Harian',
                    theme_color: '#1A1A1A',
                    background_color: '#1A1A1A',
                    display: 'standalone',
                    start_url: '/',
                    scope: '/',
                    id: '/',
                    icons: [
                        {
                            src: '/icon-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: '/icon-192x192.png',
                            sizes: '192x192',
                            type: 'image/png',
                            purpose: 'maskable'
                        },
                        {
                            src: '/icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: '/icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable'
                        }
                    ]
                },
                devOptions: {
                    enabled: true
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
                }
            })
        ]
    }
});
