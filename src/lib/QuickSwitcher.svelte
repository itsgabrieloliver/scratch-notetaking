<script>
    import { searchAll, createPage, ancestorsOf } from './store.svelte.js';
    import Icon from './Icon.svelte';

    let { close, openPage } = $props();

    let query = $state('');
    let active = $state(0);
    let inputEl = $state(null);

    const results = $derived(searchAll(query));

    $effect(() => {
        query;
        active = 0;
    });

    $effect(() => {
        inputEl?.focus();
    });

    function pathOf(page) {
        const chain = ancestorsOf(page.id);
        return chain.length ? chain.map((c) => c.title || 'Untitled').join(' / ') : 'Top level';
    }

    function choose(id) {
        openPage(id);
        close();
    }

    function onKeydown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            active = results.length ? (active + 1) % results.length : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            active = results.length ? (active - 1 + results.length) % results.length : 0;
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[active]) choose(results[active].page.id);
            else if (query.trim()) choose(createPage(null, { title: query.trim() }));
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Search pages">
    <button class="backdrop" aria-label="Close search" onclick={close}></button>
    <div class="panel">
        <div class="q-row">
            <span class="q-icon" aria-hidden="true"><Icon name="search" size={18} /></span>
            <input
                bind:this={inputEl}
                bind:value={query}
                class="q"
                type="text"
                placeholder="Search page titles and text"
                aria-label="Search query"
                autocomplete="off"
                onkeydown={onKeydown}
            />
        </div>

        <div class="results" role="listbox" aria-label="Search results">
            {#if results.length}
                {#if !query.trim()}
                    <p class="group">Recently edited</p>
                {/if}
                {#each results as r, i (r.page.id)}
                    <button
                        role="option"
                        aria-selected={i === active}
                        class:active={i === active}
                        onmouseenter={() => (active = i)}
                        onclick={() => choose(r.page.id)}
                    >
                        <span class="icon"><Icon name={r.page.icon} size={17} /></span>
                        <span class="body">
                            <span class="title">{r.page.title || 'Untitled'}</span>
                            <span class="sub">{r.snippet || pathOf(r.page)}</span>
                        </span>
                        <span class="path">{pathOf(r.page)}</span>
                    </button>
                {/each}
            {:else}
                <div class="none">
                    <span class="none-mark" aria-hidden="true"><Icon name="search" size={22} /></span>
                    <p>Nothing found for “{query}”.</p>
                    <button class="primary" onclick={() => choose(createPage(null, { title: query.trim() || '' }))}>
                        <Icon name="plus" /> Create “{query.trim() || 'Untitled'}”
                    </button>
                </div>
            {/if}
        </div>

        <div class="foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
            <span><kbd>↵</kbd> open</span>
            <span><kbd>esc</kbd> close</span>
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        z-index: 80;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 12vh var(--sp-4) var(--sp-4);
    }

    .backdrop {
        position: absolute;
        inset: 0;
        border: 0;
        background: var(--scrim);
        cursor: default;
    }

    .panel {
        position: relative;
        width: min(640px, 100%);
        background: var(--surface-raised);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-3);
        overflow: hidden;
        animation: drop 160ms var(--ease);
    }

    @keyframes drop {
        from {
            opacity: 0;
            transform: translateY(-6px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .q-row {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: 0 var(--sp-4);
        border-bottom: 1px solid var(--border);
    }

    .q-icon {
        display: inline-flex;
        color: var(--text-faint);
        flex: none;
    }

    .q {
        flex: 1;
        min-width: 0;
        height: 56px;
        border: 0;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: var(--fs-lg);
    }

    .q::placeholder {
        color: var(--text-faint);
    }

    .q:focus {
        outline: none;
    }

    .results {
        max-height: 46vh;
        overflow-y: auto;
        padding: var(--sp-1);
    }

    .group {
        margin: var(--sp-2) var(--sp-2) var(--sp-1);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
    }

    .results button[role='option'] {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        width: 100%;
        min-height: 52px;
        padding: var(--sp-2);
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text);
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease);
    }

    .results button.active {
        background: var(--hover);
    }

    .icon {
        display: inline-flex;
        flex: none;
        color: var(--text-muted);
        transition: color var(--dur-fast) var(--ease);
    }

    .results button.active .icon {
        color: var(--accent);
    }

    .body {
        flex: 1;
        min-width: 0;
        display: grid;
        gap: 1px;
    }

    .title {
        font-size: var(--fs-sm);
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub {
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .path {
        flex: none;
        max-width: 30%;
        font-size: var(--fs-xs);
        color: var(--text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .none {
        padding: var(--sp-6) var(--sp-4);
        text-align: center;
    }

    .none-mark {
        display: inline-flex;
        color: var(--text-faint);
        margin-bottom: var(--sp-3);
    }

    .none p {
        margin: 0 0 var(--sp-4);
        color: var(--text-muted);
        font-size: var(--fs-sm);
    }

    .foot {
        display: flex;
        gap: var(--sp-4);
        padding: var(--sp-2) var(--sp-4);
        border-top: 1px solid var(--border);
        background: var(--surface-sunken);
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
    }

    kbd {
        font-family: var(--font-mono);
        font-size: 10.5px;
        border: 1px solid var(--border-strong);
        border-radius: 4px;
        padding: 1px 4px;
        margin-right: 3px;
    }

    @media (max-width: 600px) {
        .path {
            display: none;
        }
        .overlay {
            padding: var(--sp-5) var(--sp-3) var(--sp-3);
        }
    }
</style>
