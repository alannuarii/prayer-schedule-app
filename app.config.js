import { defineConfig } from "@solidjs/start/config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    vite: {
        plugins: [
            VitePWA({
                registerType: 'autoUpdate',
                manifest: {
                    name: 'Jadwal Sholat',
                    short_name: 'Jadwal Sholat',
                    description: 'Aplikasi Jadwal Sholat Harian',
                    theme_color: '#1A1A1A',
                    background_color: '#1A1A1A',
                    display: 'standalone',
                    start_url: '/',
                    icons: [
                        {
                            src: '/icon-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
                }
            })
        ]
    }
});
