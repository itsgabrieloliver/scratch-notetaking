<script>
    import { onMount } from 'svelte';
    import {
        app,
        init,
        createPage,
        ancestorsOf,
        toggleFavorite,
        duplicatePage,
        trashPage,
        setTheme,
        toast
    } from './lib/store.svelte.js';
    import { downloadPageMarkdown, downloadAllMarkdown, downloadBackup, pickAndImport } from './lib/exchange.js';
    import Sidebar from './lib/Sidebar.svelte';
    import Editor from './lib/Editor.svelte';
    import TrashView from './lib/TrashView.svelte';
    import QuickSwitcher from './lib/QuickSwitcher.svelte';
    import ShortcutsOverlay from './lib/ShortcutsOverlay.svelte';
    import Icon from './lib/Icon.svelte';

    let switcherOpen = $state(false);
    let helpOpen = $state(false);
    let navOpen = $state(false);
    let pageMenuOpen = $state(false);

    const page = $derived(app.pages.find((p) => p.id === app.currentId && !p.trashed) ?? null);
    const crumbs = $derived(page ? ancestorsOf(page.id) : []);

    onMount(() => {
        init();
    });

    function isTyping(el) {
        if (!el) return false;
        return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
    }

    function onKeydown(e) {
        const mod = e.metaKey || e.ctrlKey;
        if (mod && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            switcherOpen = !switcherOpen;
            return;
        }
        if (mod && e.key === '\\') {
            e.preventDefault();
            app.sidebarCollapsed = !app.sidebarCollapsed;
            return;
        }
        if (e.key === 'Escape') {
            switcherOpen = false;
            helpOpen = false;
            navOpen = false;
            pageMenuOpen = false;
            return;
        }
        if (isTyping(e.target)) return;
        if (e.key === '?') {
            e.preventDefault();
            helpOpen = true;
            return;
        }
        if (e.key === 'n' && !mod) {
            e.preventDefault();
            newTopLevelPage();
        }
    }

    function newTopLevelPage() {
        const id = createPage(null);
        app.currentId = id;
        app.view = 'page';
        navOpen = false;
    }

    function openPage(id) {
        app.currentId = id;
        app.view = 'page';
        navOpen = false;
    }

    const THEME_LABEL = { dark: 'Dark', light: 'Light', system: 'System' };

    function cycleTheme() {
        const next = app.theme === 'dark' ? 'light' : app.theme === 'light' ? 'system' : 'dark';
        setTheme(next);
        toast(`Theme set to ${THEME_LABEL[next].toLowerCase()}`);
    }

    async function doImport() {
        const result = await pickAndImport();
        toast(result);
    }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell" class:collapsed={app.sidebarCollapsed} class:nav-open={navOpen}>
    <Sidebar
        {openPage}
        openSwitcher={() => (switcherOpen = true)}
        openHelp={() => (helpOpen = true)}
        closeNav={() => (navOpen = false)}
    />

    {#if navOpen}
        <button class="scrim" aria-label="Close navigation" onclick={() => (navOpen = false)}></button>
    {/if}

    <div class="main">
        <header class="topbar">
            <button
                class="icon-btn only-mobile"
                aria-label="Open sidebar"
                onclick={() => (navOpen = true)}
            >
                <Icon name="menu" size={18} />
            </button>
            {#if app.sidebarCollapsed}
                <button
                    class="icon-btn only-desktop"
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    onclick={() => (app.sidebarCollapsed = false)}
                >
                    <Icon name="sidebar" size={18} />
                </button>
            {/if}

            <nav class="crumbs" aria-label="Breadcrumb">
                {#if app.view === 'trash'}
                    <span class="crumb current"><Icon name="trash" size={15} /> Trash</span>
                {:else if page}
                    {#each crumbs as c (c.id)}
                        <button class="crumb" onclick={() => openPage(c.id)}>
                            <Icon name={c.icon} size={15} />
                            <span class="crumb-label">{c.title || 'Untitled'}</span>
                        </button>
                        <span class="sep" aria-hidden="true">/</span>
                    {/each}
                    <span class="crumb current">
                        <Icon name={page.icon} size={15} />
                        <span class="crumb-label">{page.title || 'Untitled'}</span>
                    </span>
                {:else}
                    <span class="crumb current">Scratch</span>
                {/if}
            </nav>

            <div class="topbar-actions">
                <button
                    class="icon-btn only-desktop"
                    aria-label="Search pages"
                    title="Search pages (Cmd K)"
                    onclick={() => (switcherOpen = true)}
                >
                    <Icon name="search" size={18} />
                </button>
                <button
                    class="icon-btn"
                    aria-label="Theme: {THEME_LABEL[app.theme] ?? 'Dark'}"
                    title="Theme: {THEME_LABEL[app.theme] ?? 'Dark'}"
                    onclick={cycleTheme}
                >
                    <Icon name={app.theme === 'dark' ? 'moon' : app.theme === 'light' ? 'sun' : 'monitor'} size={18} />
                </button>
                {#if page && app.view === 'page'}
                    <button
                        class="icon-btn"
                        class:starred={page.favorite}
                        aria-label={page.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        title={page.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        onclick={() => toggleFavorite(page.id)}
                    >
                        <Icon name={page.favorite ? 'star-filled' : 'star'} size={18} />
                    </button>
                    <div class="menu-wrap">
                        <button
                            class="icon-btn"
                            aria-label="Page options"
                            title="Page options"
                            aria-expanded={pageMenuOpen}
                            onclick={() => (pageMenuOpen = !pageMenuOpen)}
                        >
                            <Icon name="dots-horizontal" size={18} />
                        </button>
                        {#if pageMenuOpen}
                            <button class="menu-scrim" aria-label="Close menu" onclick={() => (pageMenuOpen = false)}
                            ></button>
                            <div class="menu" role="menu">
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        openPage(duplicatePage(page.id));
                                        pageMenuOpen = false;
                                    }}
                                >
                                    <Icon name="copy" /> Duplicate page
                                </button>
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        openPage(createPage(page.id));
                                        pageMenuOpen = false;
                                    }}
                                >
                                    <Icon name="plus" /> Add sub-page
                                </button>
                                <div class="menu-sep"></div>
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        downloadPageMarkdown(page.id);
                                        pageMenuOpen = false;
                                        toast('Page exported as Markdown');
                                    }}
                                >
                                    <Icon name="download" /> Export this page (.md)
                                </button>
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        downloadAllMarkdown();
                                        pageMenuOpen = false;
                                        toast('All pages exported as Markdown');
                                    }}
                                >
                                    <Icon name="download" /> Export all pages (.md)
                                </button>
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        downloadBackup();
                                        pageMenuOpen = false;
                                        toast('Backup saved as JSON');
                                    }}
                                >
                                    <Icon name="archive" /> Download JSON backup
                                </button>
                                <button
                                    role="menuitem"
                                    onclick={() => {
                                        pageMenuOpen = false;
                                        doImport();
                                    }}
                                >
                                    <Icon name="upload" /> Import JSON backup
                                </button>
                                <div class="menu-sep"></div>
                                <button
                                    role="menuitem"
                                    class="danger"
                                    onclick={() => {
                                        trashPage(page.id);
                                        pageMenuOpen = false;
                                        toast('Moved to trash');
                                    }}
                                >
                                    <Icon name="trash" /> Move to trash
                                </button>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </header>

        <main class="canvas">
            {#if !app.ready}
                <div class="loading" aria-live="polite">
                    <div class="skeleton title"></div>
                    <div class="skeleton line"></div>
                    <div class="skeleton line short"></div>
                </div>
            {:else if app.view === 'trash'}
                <TrashView {openPage} />
            {:else if page}
                {#key page.id}
                    <Editor {page} {openPage} />
                {/key}
            {:else}
                <div class="empty-canvas">
                    <span class="empty-mark" aria-hidden="true"><Icon name="file-text" size={28} /></span>
                    <h1>Nothing open</h1>
                    <p>
                        Pick a page in the sidebar, jump to one with Cmd K, or start a fresh one. Everything you
                        write is saved on this device only.
                    </p>
                    <button class="primary" onclick={newTopLevelPage}>
                        <Icon name="plus" /> New page
                    </button>
                </div>
            {/if}
        </main>
    </div>
</div>

{#if switcherOpen}
    <QuickSwitcher close={() => (switcherOpen = false)} {openPage} />
{/if}
{#if helpOpen}
    <ShortcutsOverlay close={() => (helpOpen = false)} />
{/if}

{#if app.toast}
    <div class="toast" role="status">{app.toast}</div>
{/if}

<style>
    .shell {
        display: flex;
        height: 100dvh;
        overflow: hidden;
        background: var(--bg);
        color: var(--text);
    }

    /* On phones the sidebar is an off-canvas drawer: hidden until nav-open. */
    @media (max-width: 860px) {
        .shell :global(.sidebar) {
            margin-left: calc(var(--sidebar-w) * -1);
        }

        .shell.nav-open :global(.sidebar) {
            margin-left: 0;
        }
    }

    .main {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
    }

    .topbar {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        height: 52px;
        padding: 0 var(--sp-3);
        border-bottom: 1px solid var(--border);
        background: var(--bg);
        flex: none;
    }

    .crumbs {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        min-width: 0;
        flex: 1;
        overflow: hidden;
    }

    .crumb {
        display: inline-flex;
        align-items: center;
        gap: var(--sp-2);
        min-width: 0;
        max-width: 220px;
        height: 28px;
        padding: 0 var(--sp-2);
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        font-family: inherit;
        font-size: var(--fs-sm);
        letter-spacing: var(--ls-sm);
        white-space: nowrap;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .crumb-label {
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .crumb:hover {
        background: var(--hover);
        color: var(--text);
    }

    .crumb.current {
        color: var(--text);
        font-weight: 500;
        cursor: default;
    }

    .sep {
        color: var(--text-faint);
        font-size: var(--fs-sm);
    }

    .topbar-actions {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: none;
    }

    .starred {
        color: var(--accent);
    }

    .menu-wrap {
        position: relative;
    }

    .menu-scrim {
        position: fixed;
        inset: 0;
        z-index: 40;
        border: 0;
        background: transparent;
        cursor: default;
    }

    .canvas {
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
    }

    .scrim {
        display: none;
    }

    .empty-canvas {
        max-width: 34rem;
        margin: 16vh auto 0;
        padding: 0 var(--sp-5);
        text-align: center;
    }

    .empty-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        margin-bottom: var(--sp-4);
        border-radius: var(--radius-lg);
        background: var(--surface);
        color: var(--text-faint);
    }

    .empty-canvas h1 {
        margin: 0 0 var(--sp-2);
    }

    .empty-canvas p {
        color: var(--text-muted);
        margin: 0 auto var(--sp-5);
        max-width: 42ch;
        font-size: var(--fs-md);
        line-height: var(--lh-md);
    }

    .loading {
        max-width: var(--measure);
        margin: var(--sp-8) auto;
        padding: 0 var(--sp-6);
        display: grid;
        gap: var(--sp-3);
    }

    .skeleton {
        background: var(--surface-sunken);
        border-radius: var(--radius-sm);
        height: 16px;
        animation: pulse 1.2s ease-in-out infinite;
    }

    .skeleton.title {
        height: 40px;
        width: 55%;
        margin-bottom: var(--sp-3);
    }

    .skeleton.short {
        width: 60%;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.45;
        }
    }

    .toast {
        position: fixed;
        left: 50%;
        bottom: var(--sp-6);
        transform: translateX(-50%);
        background: var(--tooltip-bg);
        color: var(--tooltip-fg);
        padding: 10px var(--sp-4);
        border-radius: var(--radius-md);
        font-size: var(--fs-sm);
        font-weight: 500;
        box-shadow: var(--shadow-2);
        z-index: 90;
        animation: rise var(--dur) var(--ease);
    }

    @keyframes rise {
        from {
            opacity: 0;
            transform: translate(-50%, 6px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }

    @media (max-width: 860px) {
        .scrim {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            border: 0;
            background: var(--scrim);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .toast,
        .skeleton {
            animation: none;
        }
    }
</style>
