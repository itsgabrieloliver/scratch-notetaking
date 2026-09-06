import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
    plugins: [svelte()],
    server: { host: '0.0.0.0', strictPort: false, allowedHosts: true },
    preview: { host: '0.0.0.0', strictPort: false, allowedHosts: true }
});
