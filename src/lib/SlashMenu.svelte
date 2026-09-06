<script>
    import { BLOCK_TYPES } from './blocks.js';
    import Icon from './Icon.svelte';

    let { state: menuState, close, apply } = $props();

    let active = $state(0);

    const results = $derived.by(() => {
        const q = (menuState.query ?? '').trim().toLowerCase();
        if (!q) return BLOCK_TYPES;
        return BLOCK_TYPES.filter(
            (t) => t.label.toLowerCase().includes(q) || t.keywords.includes(q) || t.type.includes(q)
        );
    });

    $effect(() => {
        // Reset the highlight whenever the filter changes.
        menuState.query;
        active = 0;
    });

    const pos = $derived.by(() => {
        const width = 300;
        const height = Math.min(340, 46 * results.length + 40);
        const x = Math.min(menuState.x, window.innerWidth - width - 12);
        const below = menuState.y + 8;
        const y = below + height > window.innerHeight - 12 ? Math.max(12, menuState.y - height - 24) : below;
        return { x: Math.max(12, x), y };
    });

    function onKeydown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            active = results.length ? (active + 1) % results.length : 0;
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            active = results.length ? (active - 1 + results.length) % results.length : 0;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (!results.length) return;
            e.preventDefault();
            e.stopPropagation();
            apply(results[active].type);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="slash" style="left: {pos.x}px; top: {pos.y}px" role="listbox" aria-label="Insert block">
    <p class="head">Blocks{menuState.query ? ` matching “${menuState.query}”` : ''}</p>
    {#if results.length}
        {#each results as t, i (t.type)}
            <button
                role="option"
                aria-selected={i === active}
                class:active={i === active}
                onmouseenter={() => (active = i)}
                onclick={() => apply(t.type)}
            >
                <span class="glyph"><Icon name={t.icon} size={17} /></span>
                <span class="text">
                    <span class="label">{t.label}</span>
                    <span class="hint">{t.hint}</span>
                </span>
            </button>
        {/each}
    {:else}
        <p class="none">No block matches that word. Press Escape to keep typing.</p>
    {/if}
</div>

<style>
    .slash {
        position: fixed;
        z-index: 70;
        width: 300px;
        max-width: calc(100vw - 24px);
        max-height: 340px;
        overflow-y: auto;
        padding: var(--sp-1);
        background: var(--surface-raised);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-3);
        animation: pop 140ms var(--ease);
    }

    @keyframes pop {
        from {
            opacity: 0;
            transform: translateY(-4px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .head {
        margin: var(--sp-2) var(--sp-2) var(--sp-1);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
    }

    button {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        width: 100%;
        min-height: 44px;
        padding: 0 var(--sp-2);
        border: 0;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text);
        font-family: inherit;
        text-align: left;
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease);
    }

    button.active {
        background: var(--hover);
    }

    .glyph {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        flex: none;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg);
        color: var(--text-muted);
        transition: color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease);
    }

    button.active .glyph {
        color: var(--accent);
        border-color: var(--border-strong);
    }

    .text {
        display: grid;
        min-width: 0;
    }

    .label {
        font-size: var(--fs-sm);
        font-weight: 500;
    }

    .hint {
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .none {
        margin: 0;
        padding: var(--sp-3);
        font-size: var(--fs-sm);
        color: var(--text-faint);
    }
</style>
