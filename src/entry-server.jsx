// @refresh reload
import { createHandler, StartServer } from "@solidjs/start/server";

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="description" content="Aplikasi Jadwal Sholat untuk Indonesia dengan waktu sholat akurat" />
          <meta name="theme-color" content="#14b8a6" />
          
          {/* PWA Manifest */}
          <link rel="manifest" href="/manifest.json" />
          
          {/* Icons */}
          <link rel="icon" href="/icon-192.png" />
          <link rel="apple-touch-icon" href="/icon-192.png" />
          
          {/* iOS PWA Support */}
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Jadwal Sholat" />
          
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
          <title>Jadwal Sholat</title>
          {assets}
        </head>
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
