<script>
    import Icon from './Icon.svelte';

    let { pick, align = 'left' } = $props();

    let query = $state('');
    let inputEl = $state(null);

    // A curated line-glyph set. Each entry carries search words so filtering
    // works on meaning rather than on the icon's internal name only.
    const GLYPHS = [
        { name: 'file-text', words: 'note page document text draft' },
        { name: 'book', words: 'journal notebook diary log reading' },
        { name: 'folder', words: 'folder group project collection' },
        { name: 'star', words: 'favorite starred important' },
        { name: 'flag', words: 'flag milestone marker goal' },
        { name: 'bulb', words: 'idea bulb thought spark' },
        { name: 'target', words: 'target goal aim focus' },
        { name: 'map', words: 'map plan route roadmap' },
        { name: 'calendar', words: 'calendar week schedule date planning' },
        { name: 'check-square', words: 'tasks todo checklist done' },
        { name: 'inbox', words: 'inbox capture incoming' },
        { name: 'compass', words: 'compass direction explore' },
        { name: 'feather', words: 'writing draft essay prose' },
        { name: 'lock', words: 'private secret secure' },
        { name: 'code', words: 'code snippet dev engineering' },
        { name: 'image', words: 'image photo gallery visual' },
        { name: 'quote', words: 'quote clipping reference' },
        { name: 'archive', words: 'archive storage old backup' },
        { name: 'search', words: 'research search lookup' },
        { name: 'keyboard', words: 'shortcuts keys reference' },
        { name: 'info', words: 'info reference about notes' },
        { name: 'monitor', words: 'work screen desk setup' }
    ];

    const filtered = $derived.by(() => {
        const q = query.trim().toLowerCase();
        if (!q) return GLYPHS;
        return GLYPHS.filter((g) => g.words.includes(q) || g.name.includes(q));
    });

    $effect(() => {
        inputEl?.focus();
    });
</script>

<div class="picker" class:right={align === 'right'}>
    <label class="sr-only" for="icon-filter">Filter icons</label>
    <input
        bind:this={inputEl}
        bind:value={query}
        id="icon-filter"
        class="filter"
        type="text"
        placeholder="Filter icons"
        autocomplete="off"
    />
    <div class="scroll">
        {#if filtered.length}
            <div class="grid">
                {#each filtered as glyph (glyph.name)}
                    <button
                        class="cell"
                        onclick={() => pick(glyph.name)}
                        aria-label="Use the {glyph.name.replace('-', ' ')} icon"
                        title={glyph.name.replace('-', ' ')}
                    >
                        <Icon name={glyph.name} size={18} />
                    </button>
                {/each}
            </div>
        {:else}
            <p class="none">No icon matches that word.</p>
        {/if}
    </div>
</div>

<style>
    .picker {
        position: absolute;
        z-index: 50;
        top: calc(100% + 6px);
        left: 0;
        width: 252px;
        padding: var(--sp-2);
        background: var(--surface-raised);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-2);
        animation: pop 140ms var(--ease);
    }

    .picker.right {
        left: auto;
        right: 0;
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

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .filter {
        width: 100%;
        height: 32px;
        padding: 0 var(--sp-2);
        border: 0;
        border-bottom: 1px solid var(--border);
        border-radius: 0;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: var(--fs-sm);
    }

    .filter::placeholder {
        color: var(--text-faint);
    }

    .filter:focus {
        outline: none;
        border-bottom-color: var(--accent);
    }

    .scroll {
        max-height: 216px;
        overflow-y: auto;
        margin-top: var(--sp-2);
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 2px;
    }

    .cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .cell:hover {
        background: var(--hover);
        color: var(--accent);
    }

    .none {
        margin: var(--sp-3) var(--sp-1) var(--sp-2);
        font-size: var(--fs-sm);
        color: var(--text-faint);
    }
</style>
