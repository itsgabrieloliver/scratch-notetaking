<script>
    import {
        app,
        childrenOf,
        toggleCollapse,
        createPage,
        renamePage,
        duplicatePage,
        trashPage,
        toggleFavorite,
        movePage,
        setIcon,
        toast
    } from './store.svelte.js';
    import Icon from './Icon.svelte';
    import IconPicker from './IconPicker.svelte';
    import Self from './PageNode.svelte';

    let { page, depth = 0, openPage, flat = false, dragId = $bindable(null) } = $props();

    let menuOpen = $state(false);
    let renaming = $state(false);
    let draft = $state('');
    let dropZone = $state(null); // 'before' | 'inside' | 'after'
    let pickerOpen = $state(false);
    let inputEl = $state(null);

    const kids = $derived(flat ? [] : childrenOf(page.id));
    const isCurrent = $derived(app.currentId === page.id && app.view === 'page');

    function startRename() {
        draft = page.title;
        renaming = true;
        menuOpen = false;
        queueMicrotask(() => inputEl?.select());
    }

    function commitRename() {
        if (!renaming) return;
        renaming = false;
        renamePage(page.id, draft.trim());
    }

    function onDragStart(e) {
        dragId = page.id;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/scratch-page', page.id);
    }

    function zoneFor(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        if (y < rect.height * 0.28) return 'before';
        if (y > rect.height * 0.72) return 'after';
        return 'inside';
    }

    function onDragOver(e) {
        if (flat) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropZone = zoneFor(e);
    }

    function onDrop(e) {
        if (flat) return;
        e.preventDefault();
        e.stopPropagation();
        const id = e.dataTransfer.getData('text/scratch-page') || dragId;
        const zone = dropZone;
        dropZone = null;
        dragId = null;
        if (id && id !== page.id) movePage(id, page.id, zone ?? 'after');
    }
</script>

<div
    class="row"
    class:current={isCurrent}
    class:dragging={dragId === page.id}
    class:drop-before={dropZone === 'before'}
    class:drop-after={dropZone === 'after'}
    class:drop-inside={dropZone === 'inside'}
    style="--depth: {depth}"
    role="presentation"
    draggable={!renaming}
    ondragstart={onDragStart}
    ondragend={() => {
        dragId = null;
        dropZone = null;
    }}
    ondragover={onDragOver}
    ondragleave={() => (dropZone = null)}
    ondrop={onDrop}
>
    {#if !flat}
        <button
            class="twist"
            class:open={!page.collapsed}
            class:hidden={!kids.length}
            aria-label={page.collapsed ? 'Expand sub-pages' : 'Collapse sub-pages'}
            tabindex={kids.length ? 0 : -1}
            onclick={(e) => {
                e.stopPropagation();
                toggleCollapse(page.id);
            }}
        >
            <Icon name="chevron-right" size={13} />
        </button>
    {:else}
        <span class="twist hidden" aria-hidden="true"></span>
    {/if}

    <button
        class="glyph"
        aria-label="Change page icon"
        title="Change page icon"
        onclick={(e) => {
            e.stopPropagation();
            pickerOpen = !pickerOpen;
        }}
    >
        <Icon name={page.icon} size={15} />
    </button>

    {#if renaming}
        <input
            class="rename"
            bind:this={inputEl}
            bind:value={draft}
            onblur={commitRename}
            onkeydown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                } else if (e.key === 'Escape') {
                    renaming = false;
                }
            }}
            aria-label="Page title"
        />
    {:else}
        <button class="label" onclick={() => openPage(page.id)} ondblclick={startRename}>
            {page.title || 'Untitled'}
        </button>
    {/if}

    <span class="row-actions">
        <button
            class="icon-btn tiny"
            aria-label="Page actions"
            title="Page actions"
            aria-expanded={menuOpen}
            onclick={(e) => {
                e.stopPropagation();
                menuOpen = !menuOpen;
            }}
        >
            <Icon name="dots-horizontal" size={15} />
        </button>
        {#if !flat}
            <button
                class="icon-btn tiny"
                aria-label="Add sub-page"
                title="Add sub-page"
                onclick={(e) => {
                    e.stopPropagation();
                    openPage(createPage(page.id));
                }}
            >
                <Icon name="plus" size={15} />
            </button>
        {/if}
    </span>

    {#if pickerOpen}
        <button class="scrim" aria-label="Close icon picker" onclick={() => (pickerOpen = false)}></button>
        <IconPicker
            pick={(name) => {
                setIcon(page.id, name);
                pickerOpen = false;
            }}
        />
    {/if}

    {#if menuOpen}
        <button class="scrim" aria-label="Close menu" onclick={() => (menuOpen = false)}></button>
        <div class="menu left" role="menu">
            <button role="menuitem" onclick={startRename}><Icon name="pencil" /> Rename</button>
            <button
                role="menuitem"
                onclick={() => {
                    toggleFavorite(page.id);
                    menuOpen = false;
                }}
            >
                <Icon name={page.favorite ? 'star-filled' : 'star'} />
                {page.favorite ? 'Remove from favorites' : 'Add to favorites'}
            </button>
            <button
                role="menuitem"
                onclick={() => {
                    openPage(duplicatePage(page.id));
                    menuOpen = false;
                }}><Icon name="copy" /> Duplicate</button
            >
            <button
                role="menuitem"
                onclick={() => {
                    openPage(createPage(page.id));
                    menuOpen = false;
                }}><Icon name="plus" /> Add sub-page</button
            >
            <div class="menu-sep"></div>
            <button
                role="menuitem"
                class="danger"
                onclick={() => {
                    trashPage(page.id);
                    menuOpen = false;
                    toast('Moved to trash');
                }}><Icon name="trash" /> Move to trash</button
            >
        </div>
    {/if}
</div>

{#if !flat && !page.collapsed && kids.length}
    <ul class="children">
        {#each kids as kid (kid.id)}
            <li>
                <Self page={kid} depth={depth + 1} {openPage} bind:dragId />
            </li>
        {/each}
    </ul>
{/if}

<style>
    .row {
        position: relative;
        display: flex;
        align-items: center;
        gap: 2px;
        min-height: 32px;
        padding-right: var(--sp-1);
        padding-left: calc(var(--sp-1) + var(--depth) * 14px);
        border-radius: var(--radius-sm);
        color: var(--text-muted);
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .row:hover {
        background: var(--hover);
        color: var(--text);
    }

    .row.current {
        background: var(--active);
        color: var(--text);
        font-weight: 500;
        box-shadow: inset 2px 0 0 var(--accent);
    }

    .row.dragging {
        opacity: 0.5;
    }

    .row.drop-before::before,
    .row.drop-after::after {
        content: '';
        position: absolute;
        left: calc(var(--depth) * 14px);
        right: 0;
        height: 2px;
        background: var(--accent);
        border-radius: 2px;
    }

    .row.drop-before::before {
        top: -1px;
    }

    .row.drop-after::after {
        bottom: -1px;
    }

    .row.drop-inside {
        background: var(--accent-soft);
        outline: 1px dashed var(--accent);
        outline-offset: -1px;
    }

    .twist {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 24px;
        flex: none;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-faint);
        cursor: pointer;
        transition: transform var(--dur) var(--ease), color var(--dur-fast) var(--ease);
    }

    .twist:hover {
        color: var(--text);
    }

    .twist.open {
        transform: rotate(90deg);
    }

    .twist.hidden {
        visibility: hidden;
    }

    .glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        flex: none;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .glyph:hover {
        background: var(--active);
        color: var(--accent);
    }

    .label {
        flex: 1;
        min-width: 0;
        min-height: 30px;
        padding: 0 var(--sp-1);
        border: 0;
        background: transparent;
        color: inherit;
        font-family: inherit;
        font-size: var(--fs-sm);
        font-weight: inherit;
        letter-spacing: var(--ls-sm);
        text-align: left;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
    }

    .rename {
        flex: 1;
        min-width: 0;
        height: 26px;
        padding: 0 var(--sp-1);
        border: 1px solid var(--accent);
        border-radius: var(--radius-sm);
        background: var(--surface-raised);
        color: var(--text);
        font-family: inherit;
        font-size: var(--fs-sm);
    }

    .rename:focus {
        outline: none;
    }

    .row-actions {
        display: none;
        gap: 0;
        flex: none;
    }

    .row:hover .row-actions,
    .row:focus-within .row-actions {
        display: flex;
    }

    .icon-btn.tiny {
        width: 24px;
        height: 24px;
    }

    .scrim {
        position: fixed;
        inset: 0;
        z-index: 40;
        border: 0;
        background: transparent;
        cursor: default;
    }

    .menu.left {
        left: var(--sp-4);
        right: auto;
    }

    .children {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    @media (max-width: 860px) {
        .row {
            min-height: 40px;
        }
        .row-actions {
            display: flex;
        }
    }
</style>
