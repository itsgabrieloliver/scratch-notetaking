<script>
    import { app, childrenOf, favorites, trashed, createPage, movePage } from './store.svelte.js';
    import PageNode from './PageNode.svelte';
    import Icon from './Icon.svelte';

    let { openPage, openSwitcher, openHelp, closeNav } = $props();

    let dragId = $state(null);
    let rootDrop = $state(false);
    let favOpen = $state(true);

    const roots = $derived(childrenOf(null));
    const favs = $derived(favorites());
    const trashCount = $derived(trashed().length);
    const savedLabel = $derived(
        app.saving ? 'Saving' : app.savedAt ? `Saved ${new Date(app.savedAt).toLocaleTimeString()}` : 'Saved locally'
    );

    function newPage() {
        const id = createPage(null);
        openPage(id);
    }

    function onRootDrop(e) {
        e.preventDefault();
        rootDrop = false;
        const id = e.dataTransfer.getData('text/scratch-page') || dragId;
        if (id) movePage(id, null, 'after');
        dragId = null;
    }
</script>

<aside class="sidebar" class:collapsed={app.sidebarCollapsed}>
    <div class="head">
        <div class="brand">
            <span class="mark" aria-hidden="true"><Icon name="feather" size={16} /></span>
            <span class="name">Scratch</span>
        </div>
        <button
            class="icon-btn"
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Cmd \)"
            onclick={() => {
                app.sidebarCollapsed = true;
                closeNav();
            }}
        >
            <Icon name="sidebar" size={18} />
        </button>
    </div>

    <div class="quick">
        <button class="quick-btn" onclick={openSwitcher}>
            <Icon name="search" size={17} />
            <span>Search</span>
            <kbd>⌘K</kbd>
        </button>
        <button class="quick-btn" onclick={newPage}>
            <Icon name="plus" size={17} />
            <span>New page</span>
            <kbd>N</kbd>
        </button>
    </div>

    <nav class="tree" aria-label="Pages">
        {#if favs.length}
            <div class="section">
                <button class="section-head" aria-expanded={favOpen} onclick={() => (favOpen = !favOpen)}>
                    <span class="chev" class:open={favOpen}><Icon name="chevron-right" size={12} /></span>
                    Favorites
                </button>
                {#if favOpen}
                    <ul class="list">
                        {#each favs as page (page.id)}
                            <li>
                                <PageNode {page} depth={0} {openPage} flat bind:dragId />
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/if}

        <div class="section">
            <div class="section-head static">
                <span>Pages</span>
                <button class="icon-btn tiny" aria-label="New page" title="New page" onclick={newPage}>
                    <Icon name="plus" size={15} />
                </button>
            </div>

            {#if roots.length}
                <ul class="list">
                    {#each roots as page (page.id)}
                        <li>
                            <PageNode {page} depth={0} {openPage} bind:dragId />
                        </li>
                    {/each}
                </ul>
            {:else}
                <div class="empty">
                    <span class="empty-mark" aria-hidden="true"><Icon name="file-text" size={20} /></span>
                    <p>No pages yet. The first one saves to this device as you type.</p>
                    <button class="ghost full" onclick={newPage}>
                        <Icon name="plus" size={15} /> New page
                    </button>
                </div>
            {/if}

            <div
                class="root-drop"
                class:over={rootDrop}
                role="presentation"
                ondragover={(e) => {
                    e.preventDefault();
                    rootDrop = true;
                }}
                ondragleave={() => (rootDrop = false)}
                ondrop={onRootDrop}
            ></div>
        </div>
    </nav>

    <div class="foot">
        <button
            class="foot-btn"
            class:active={app.view === 'trash'}
            onclick={() => {
                app.view = 'trash';
                closeNav();
            }}
        >
            <Icon name="trash" size={17} />
            <span>Trash</span>
            {#if trashCount}<span class="count">{trashCount}</span>{/if}
        </button>
        <button class="foot-btn" onclick={openHelp}>
            <Icon name="keyboard" size={17} />
            <span>Shortcuts</span>
            <kbd>?</kbd>
        </button>
        <p class="status" aria-live="polite">{savedLabel} · on this device</p>
    </div>
</aside>

<style>
    .sidebar {
        width: var(--sidebar-w);
        flex: none;
        display: flex;
        flex-direction: column;
        background: var(--bg-sidebar);
        border-right: 1px solid var(--border);
        transition: margin-left var(--dur-slow) var(--ease);
    }

    .sidebar.collapsed {
        margin-left: calc(var(--sidebar-w) * -1);
    }

    .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-2);
        height: 52px;
        padding: 0 var(--sp-2) 0 var(--sp-3);
        flex: none;
    }

    .brand {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        min-width: 0;
    }

    .mark {
        display: inline-flex;
        color: var(--accent);
    }

    .name {
        font-family: var(--font-display);
        font-weight: 600;
        font-size: var(--fs-lg);
        letter-spacing: -0.01em;
    }

    .quick {
        padding: 0 var(--sp-2) var(--sp-2);
        display: grid;
        gap: 1px;
    }

    .quick-btn {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        width: 100%;
        min-height: 32px;
        padding: 0 var(--sp-2);
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        font-family: inherit;
        font-size: var(--fs-sm);
        font-weight: 500;
        letter-spacing: var(--ls-sm);
        text-align: left;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .quick-btn span {
        flex: 1;
    }

    .quick-btn:hover {
        background: var(--hover);
        color: var(--text);
    }

    kbd {
        font-family: var(--font-mono);
        font-size: 11px;
        line-height: 1.4;
        color: var(--text-faint);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        padding: 1px 5px;
    }

    .tree {
        flex: 1;
        overflow-y: auto;
        padding: var(--sp-2) var(--sp-2) var(--sp-6);
    }

    .section + .section {
        margin-top: var(--sp-5);
    }

    .section-head {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        width: 100%;
        min-height: 26px;
        padding: 0 var(--sp-2);
        border: 0;
        background: transparent;
        color: var(--text-faint);
        font-family: inherit;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
    }

    .section-head.static {
        justify-content: space-between;
        cursor: default;
    }

    .chev {
        display: inline-flex;
        transition: transform var(--dur) var(--ease);
    }

    .chev.open {
        transform: rotate(90deg);
    }

    .icon-btn.tiny {
        width: 24px;
        height: 24px;
    }

    .list {
        list-style: none;
        margin: var(--sp-1) 0 0;
        padding: 0;
    }

    .empty {
        padding: var(--sp-4) var(--sp-2) var(--sp-2);
        text-align: center;
    }

    .empty-mark {
        display: inline-flex;
        color: var(--text-faint);
        margin-bottom: var(--sp-2);
    }

    .empty p {
        margin: 0 0 var(--sp-3);
        color: var(--text-faint);
        font-size: var(--fs-xs);
        line-height: 1.55;
    }

    .ghost.full {
        width: 100%;
    }

    .root-drop {
        height: 28px;
        margin-top: var(--sp-1);
        border-radius: var(--radius-sm);
        border: 1px dashed transparent;
        transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
    }

    .root-drop.over {
        border-color: var(--accent);
        background: var(--accent-soft);
    }

    .foot {
        flex: none;
        padding: var(--sp-2);
        border-top: 1px solid var(--border);
    }

    .foot-btn {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        width: 100%;
        min-height: 32px;
        padding: 0 var(--sp-2);
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        font-family: inherit;
        font-size: var(--fs-sm);
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .foot-btn span {
        flex: 1;
    }

    .foot-btn:hover {
        background: var(--hover);
        color: var(--text);
    }

    .foot-btn.active {
        background: var(--active);
        color: var(--text);
    }

    .count {
        flex: none !important;
        font-size: var(--fs-xs);
        color: var(--text-faint);
    }

    .status {
        margin: var(--sp-3) var(--sp-2) var(--sp-1);
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
    }

    @media (max-width: 860px) {
        .sidebar {
            position: fixed;
            inset: 0 auto 0 0;
            z-index: 35;
            box-shadow: var(--shadow-2);
        }
    }
</style>
