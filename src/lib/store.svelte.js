import { idbGet, idbSet } from './idb.js';
import { seedPages } from './seed.js';

const KEY = 'workspace';
const SCHEMA = 1;

export const app = $state({
    ready: false,
    pages: [],
    currentId: null,
    view: 'page', // 'page' | 'trash'
    theme: 'dark', // 'dark' | 'light' | 'system'
    sidebarCollapsed: false,
    toast: '',
    savedAt: null,
    saving: false
});

export function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function newBlock(type = 'paragraph', text = '', extra = {}) {
    return { id: uid(), type, text, checked: false, ...extra };
}

/* ---------- persistence ---------- */

let saveTimer = null;
let toastTimer = null;

function snapshot() {
    return {
        schema: SCHEMA,
        savedAt: Date.now(),
        currentId: app.currentId,
        theme: app.theme,
        sidebarCollapsed: app.sidebarCollapsed,
        pages: app.pages.map((p) => ({
            id: p.id,
            parentId: p.parentId,
            title: p.title,
            icon: p.icon,
            order: p.order,
            favorite: !!p.favorite,
            collapsed: !!p.collapsed,
            trashed: !!p.trashed,
            trashedAt: p.trashedAt ?? null,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            blocks: p.blocks.map((b) => ({ ...b }))
        }))
    };
}

export function save() {
    app.saving = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
        try {
            await idbSet(KEY, snapshot());
            app.savedAt = Date.now();
        } catch {
            // Storage refused the write (private mode, quota). The session stays
            // usable in memory and the next edit retries the save.
        } finally {
            app.saving = false;
        }
    }, 350);
}

export function toast(message) {
    app.toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (app.toast = ''), 2400);
}

export function applyTheme() {
    const dark =
        app.theme === 'dark' ||
        (app.theme === 'system' &&
            typeof matchMedia !== 'undefined' &&
            matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function setTheme(theme) {
    app.theme = theme;
    try {
        localStorage.setItem('scratch:theme', theme);
    } catch {
        /* private mode: theme just won't persist */
    }
    applyTheme();
    save();
}

export async function init() {
    let data = null;
    try {
        data = await idbGet(KEY);
    } catch {
        data = null;
    }

    if (data && Array.isArray(data.pages) && data.pages.length) {
        hydrate(data);
    } else {
        app.pages = seedPages();
        app.currentId = app.pages[0].id;
        save();
    }

    try {
        const t = localStorage.getItem('scratch:theme');
        if (t) app.theme = t;
    } catch {
        /* ignore */
    }
    applyTheme();

    if (typeof matchMedia !== 'undefined') {
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (app.theme === 'system') applyTheme();
        });
    }

    app.ready = true;
}

// Callout blocks used to carry a free pictograph; they now carry a named tone.
function toneOf(block) {
    if (typeof block.tone === 'string') return block.tone;
    return block.type === 'callout' ? 'info' : null;
}

export function hydrate(data) {
    app.pages = data.pages.map((p) => ({
        id: p.id ?? uid(),
        parentId: p.parentId ?? null,
        title: p.title ?? '',
        icon: p.icon ?? 'file-text',
        order: typeof p.order === 'number' ? p.order : 0,
        favorite: !!p.favorite,
        collapsed: !!p.collapsed,
        trashed: !!p.trashed,
        trashedAt: p.trashedAt ?? null,
        createdAt: p.createdAt ?? Date.now(),
        updatedAt: p.updatedAt ?? Date.now(),
        blocks:
            Array.isArray(p.blocks) && p.blocks.length
                ? p.blocks.map((b) => ({
                      id: b.id ?? uid(),
                      type: b.type ?? 'paragraph',
                      text: b.text ?? '',
                      checked: !!b.checked,
                      ...(b.lang ? { lang: b.lang } : {}),
                      ...(b.src ? { src: b.src } : {}),
                      ...(b.alt ? { alt: b.alt } : {}),
                      ...(toneOf(b) ? { tone: toneOf(b) } : {})
                  }))
                : [newBlock()]
    }));
    const live = app.pages.filter((p) => !p.trashed);
    app.currentId = live.some((p) => p.id === data.currentId) ? data.currentId : (live[0]?.id ?? null);
    if (typeof data.sidebarCollapsed === 'boolean') app.sidebarCollapsed = data.sidebarCollapsed;
    if (data.theme) app.theme = data.theme;
}

/* ---------- queries ---------- */

export function pageById(id) {
    return app.pages.find((p) => p.id === id) ?? null;
}

export function childrenOf(parentId) {
    return app.pages
        .filter((p) => !p.trashed && p.parentId === parentId)
        .sort((a, b) => a.order - b.order);
}

export function favorites() {
    return app.pages.filter((p) => !p.trashed && p.favorite).sort((a, b) => a.order - b.order);
}

export function trashed() {
    return app.pages.filter((p) => p.trashed).sort((a, b) => (b.trashedAt ?? 0) - (a.trashedAt ?? 0));
}

export function ancestorsOf(id) {
    const chain = [];
    let page = pageById(id);
    let guard = 0;
    while (page?.parentId && guard++ < 50) {
        const parent = pageById(page.parentId);
        if (!parent) break;
        chain.unshift(parent);
        page = parent;
    }
    return chain;
}

export function descendantIds(id) {
    const out = [];
    const walk = (pid) => {
        for (const p of app.pages) {
            if (p.parentId === pid) {
                out.push(p.id);
                walk(p.id);
            }
        }
    };
    walk(id);
    return out;
}

export function isDescendant(candidateId, ofId) {
    return descendantIds(ofId).includes(candidateId);
}

export function blockPlainText(block) {
    const raw = (block.text ?? '').replace(/<[^>]*>/g, ' ');
    const el = typeof document !== 'undefined' ? document.createElement('textarea') : null;
    if (!el) return raw;
    el.innerHTML = raw;
    return el.value.replace(/\s+/g, ' ').trim();
}

export function pagePreview(page) {
    for (const b of page.blocks) {
        if (b.type === 'divider' || b.type === 'image') continue;
        const t = blockPlainText(b);
        if (t) return t;
    }
    return '';
}

/* ---------- mutations ---------- */

function nextOrder(parentId) {
    const siblings = childrenOf(parentId);
    return siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0;
}

export function createPage(parentId = null, fields = {}) {
    const page = {
        id: uid(),
        parentId,
        title: '',
        icon: fields.icon ?? 'file-text',
        order: nextOrder(parentId),
        favorite: false,
        collapsed: false,
        trashed: false,
        trashedAt: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: [newBlock()],
        ...fields
    };
    app.pages.push(page);
    if (parentId) {
        const parent = pageById(parentId);
        if (parent) parent.collapsed = false;
    }
    save();
    return page.id;
}

export function touch(id) {
    const p = pageById(id);
    if (p) p.updatedAt = Date.now();
    save();
}

export function renamePage(id, title) {
    const p = pageById(id);
    if (!p) return;
    p.title = title;
    p.updatedAt = Date.now();
    save();
}

export function setIcon(id, icon) {
    const p = pageById(id);
    if (!p) return;
    p.icon = icon;
    p.updatedAt = Date.now();
    save();
}

export function toggleFavorite(id) {
    const p = pageById(id);
    if (!p) return;
    p.favorite = !p.favorite;
    save();
}

export function toggleCollapse(id) {
    const p = pageById(id);
    if (!p) return;
    p.collapsed = !p.collapsed;
    save();
}

export function duplicatePage(id, parentIdOverride) {
    const source = pageById(id);
    if (!source) return null;
    const parentId = parentIdOverride === undefined ? source.parentId : parentIdOverride;
    const copyId = uid();
    app.pages.push({
        ...structuredCloneSafe(source),
        id: copyId,
        parentId,
        title: source.title ? `${source.title} copy` : 'Untitled copy',
        favorite: false,
        order: nextOrder(parentId),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        blocks: source.blocks.map((b) => ({ ...b, id: uid() }))
    });
    for (const child of childrenOf(id)) duplicatePage(child.id, copyId);
    save();
    return copyId;
}

function structuredCloneSafe(page) {
    return JSON.parse(JSON.stringify(page));
}

export function trashPage(id) {
    const ids = [id, ...descendantIds(id)];
    const now = Date.now();
    for (const pid of ids) {
        const p = pageById(pid);
        if (p) {
            p.trashed = true;
            p.trashedAt = now;
            p.favorite = false;
        }
    }
    if (ids.includes(app.currentId)) {
        const next = app.pages.find((p) => !p.trashed);
        app.currentId = next?.id ?? null;
    }
    save();
}

export function restorePage(id) {
    const ids = [id, ...descendantIds(id)];
    for (const pid of ids) {
        const p = pageById(pid);
        if (p) {
            p.trashed = false;
            p.trashedAt = null;
        }
    }
    // If the parent is still in the trash, lift this page to the top level.
    const page = pageById(id);
    if (page?.parentId) {
        const parent = pageById(page.parentId);
        if (!parent || parent.trashed) page.parentId = null;
    }
    save();
    return id;
}

export function deleteForever(id) {
    const ids = new Set([id, ...descendantIds(id)]);
    app.pages = app.pages.filter((p) => !ids.has(p.id));
    if (ids.has(app.currentId)) {
        const next = app.pages.find((p) => !p.trashed);
        app.currentId = next?.id ?? null;
    }
    save();
}

export function emptyTrash() {
    app.pages = app.pages.filter((p) => !p.trashed);
    save();
}

export function movePage(dragId, targetId, position) {
    // position: 'before' | 'after' | 'inside'
    const dragged = pageById(dragId);
    if (!dragged || dragId === targetId) return;
    if (targetId && isDescendant(targetId, dragId)) return;

    if (position === 'inside') {
        const target = pageById(targetId);
        if (!target) return;
        dragged.parentId = targetId;
        dragged.order = nextOrder(targetId);
        target.collapsed = false;
        save();
        return;
    }

    const target = targetId ? pageById(targetId) : null;
    const parentId = target ? target.parentId : null;
    dragged.parentId = parentId;

    const siblings = childrenOf(parentId).filter((p) => p.id !== dragId);
    const idx = target ? siblings.findIndex((s) => s.id === targetId) : siblings.length;
    const at = position === 'after' ? idx + 1 : idx;
    const ordered = [...siblings.slice(0, at), dragged, ...siblings.slice(at)];
    ordered.forEach((p, i) => (p.order = i));
    save();
}

export function searchAll(query) {
    const q = query.trim().toLowerCase();
    const live = app.pages.filter((p) => !p.trashed);
    if (!q) {
        return live
            .slice()
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 12)
            .map((p) => ({ page: p, snippet: pagePreview(p), score: 0 }));
    }
    const results = [];
    for (const p of live) {
        const title = (p.title || 'Untitled').toLowerCase();
        let score = 0;
        let snippet = '';
        if (title.includes(q)) score += title.startsWith(q) ? 120 : 80;
        for (const b of p.blocks) {
            const text = blockPlainText(b);
            const at = text.toLowerCase().indexOf(q);
            if (at !== -1) {
                score += 20;
                if (!snippet) {
                    const start = Math.max(0, at - 32);
                    snippet = (start > 0 ? '…' : '') + text.slice(start, start + 120);
                }
            }
        }
        if (score > 0) results.push({ page: p, snippet: snippet || pagePreview(p), score });
    }
    return results.sort((a, b) => b.score - a.score || b.page.updatedAt - a.page.updatedAt).slice(0, 20);
}
