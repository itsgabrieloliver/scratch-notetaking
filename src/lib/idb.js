// Tiny persistence layer: IndexedDB when available, localStorage as fallback.
// No network, no accounts. Everything stays in this browser profile.

const DB_NAME = 'scratch';
const STORE = 'kv';
const LS_KEY = 'scratch:kv:';

let dbPromise = null;

function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        let req;
        try {
            req = indexedDB.open(DB_NAME, 1);
        } catch (err) {
            reject(err);
            return;
        }
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB open failed'));
        req.onblocked = () => reject(new Error('IndexedDB blocked'));
    }).catch((err) => {
        dbPromise = null;
        throw err;
    });
    return dbPromise;
}

export async function idbGet(key) {
    try {
        const db = await openDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readonly');
            const req = tx.objectStore(STORE).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    } catch {
        const raw = localStorage.getItem(LS_KEY + key);
        return raw ? JSON.parse(raw) : undefined;
    }
}

export async function idbSet(key, value) {
    try {
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch {
        try {
            localStorage.setItem(LS_KEY + key, JSON.stringify(value));
        } catch {
            // Storage full or blocked: keep the session usable in memory.
        }
    }
}

export function storageKind() {
    return typeof indexedDB !== 'undefined' ? 'IndexedDB' : 'localStorage';
}
