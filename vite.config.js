// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        {
            name: 'reload-html',
            configureServer(server) {
                const { ws, watcher } = server;
                watcher.on('change', (file) => {
                    if (file.endsWith('.html')) {
                        ws.send({ type: 'full-reload' });
                    }
                });
            },
        },
    ],
});
