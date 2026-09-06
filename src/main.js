import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';

// Offline shell. Registered only for the built app: in dev the service worker
// would sit in front of Vite's module graph and defeat hot reloading.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // No offline cache available (private mode, unsupported browser).
            // The app still runs; notes live in IndexedDB either way.
        });
    });
}

export default mount(App, { target: document.getElementById('app') });
