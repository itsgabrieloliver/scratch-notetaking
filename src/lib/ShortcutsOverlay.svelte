<script>
    import Icon from './Icon.svelte';

    let { close } = $props();

    const groups = [
        {
            name: 'Navigate',
            items: [
                ['⌘K', 'Open the quick switcher and search everything'],
                ['⌘\\', 'Show or hide the sidebar'],
                ['N', 'New top-level page (when not typing)'],
                ['?', 'Open this list'],
                ['Esc', 'Close any overlay']
            ]
        },
        {
            name: 'Write',
            items: [
                ['/', 'Open the block menu inside a block'],
                ['Enter', 'New block, continuing lists and to-dos'],
                ['Backspace', 'At the start: reset the type, then merge upward'],
                ['↑ ↓', 'Move the caret between blocks'],
                ['⌘⇧↑ / ⌘⇧↓', 'Move the current block up or down'],
                ['⌘↵', 'Toggle the current to-do']
            ]
        },
        {
            name: 'Format',
            items: [
                ['⌘B', 'Bold'],
                ['⌘I', 'Italic'],
                ['⌘E', 'Inline code'],
                ['⌘⇧X', 'Strikethrough'],
                ['⌘⇧K', 'Add a link']
            ]
        },
        {
            name: 'Markdown as you type',
            items: [
                ['# ## ###', 'Headings 1, 2 and 3'],
                ['- or *', 'Bulleted item'],
                ['1.', 'Numbered item'],
                ['[]', 'To-do'],
                ['>', 'Quote'],
                ['```', 'Code block'],
                ['---', 'Divider']
            ]
        }
    ];
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
    <button class="backdrop" aria-label="Close shortcuts" onclick={close}></button>
    <div class="panel">
        <header>
            <h2>Keyboard shortcuts</h2>
            <button class="icon-btn" aria-label="Close shortcuts" onclick={close}>
                <Icon name="close" size={18} />
            </button>
        </header>
        <div class="cols">
            {#each groups as g (g.name)}
                <section>
                    <h3>{g.name}</h3>
                    <dl>
                        {#each g.items as [key, desc] (key)}
                            <div class="pair">
                                <dt><kbd>{key}</kbd></dt>
                                <dd>{desc}</dd>
                            </div>
                        {/each}
                    </dl>
                </section>
            {/each}
        </div>
    </div>
</div>

<style>
    .overlay {
        position: fixed;
        inset: 0;
        z-index: 85;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--sp-4);
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
        width: min(760px, 100%);
        max-height: 86vh;
        overflow-y: auto;
        background: var(--surface-raised);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-3);
        padding: var(--sp-5);
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

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--sp-5);
    }

    h2 {
        margin: 0;
    }

    .cols {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: var(--sp-5) var(--sp-6);
    }

    h3 {
        margin: 0 0 var(--sp-2);
        font-family: var(--font-sans);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
    }

    dl {
        margin: 0;
    }

    .pair {
        display: flex;
        gap: var(--sp-3);
        align-items: baseline;
        padding: var(--sp-2) 0;
        border-bottom: 1px solid var(--border);
    }

    dt {
        flex: none;
        width: 104px;
    }

    dd {
        margin: 0;
        font-size: var(--fs-sm);
        line-height: 1.5;
        color: var(--text-muted);
    }

    kbd {
        display: inline-block;
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--surface-sunken);
        padding: 2px 6px;
    }

    @media (max-width: 600px) {
        .panel {
            padding: var(--sp-4);
        }
        dt {
            width: 88px;
        }
    }
</style>
