import { app, pageById, childrenOf, hydrate, save } from './store.svelte.js';
import { pageToMarkdown } from './blocks.js';

function download(filename, text, mime = 'text/plain') {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slug(title) {
    return (title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'untitled';
}

export function downloadPageMarkdown(id) {
    const page = pageById(id);
    if (!page) return;
    download(`${slug(page.title)}.md`, pageToMarkdown(page), 'text/markdown');
}

export function downloadAllMarkdown() {
    const parts = [];
    const walk = (parentId, depth) => {
        for (const page of childrenOf(parentId)) {
            parts.push('#'.repeat(Math.min(depth, 5)) + ' ' + (page.title || 'Untitled'));
            parts.push('');
            parts.push(pageToMarkdown(page).split('\n').slice(1).join('\n').trim());
            parts.push('');
            walk(page.id, depth + 1);
        }
    };
    walk(null, 1);
    download('scratch-pages.md', parts.join('\n').trim() + '\n', 'text/markdown');
}

export function downloadBackup() {
    const data = {
        schema: 1,
        exportedAt: new Date().toISOString(),
        pages: app.pages.map((p) => ({ ...p, blocks: p.blocks.map((b) => ({ ...b })) }))
    };
    download(`scratch-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
}

export function pickAndImport() {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json,.json';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                resolve('Import cancelled');
                return;
            }
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data || !Array.isArray(data.pages)) {
                    resolve('That file has no pages array, so nothing was imported');
                    return;
                }
                hydrate(data);
                save();
                resolve(`Imported ${data.pages.length} pages`);
            } catch (err) {
                resolve('That file could not be read as JSON');
            }
        };
        input.click();
    });
}
