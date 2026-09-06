<script>
    import Icon from './Icon.svelte';

    let { x, y, run } = $props();

    const items = [
        { cmd: 'bold', label: 'Bold', icon: 'bold' },
        { cmd: 'italic', label: 'Italic', icon: 'italic' },
        { cmd: 'strikeThrough', label: 'Strikethrough', icon: 'strikethrough' },
        { cmd: 'code', label: 'Inline code', icon: 'code' },
        { cmd: 'link', label: 'Add link', icon: 'link' }
    ];

    const WIDTH = 186;
    const left = $derived(
        Math.max(8, Math.min(x - WIDTH / 2, (typeof window !== 'undefined' ? window.innerWidth : 1200) - WIDTH - 8))
    );
    const top = $derived(Math.max(8, y - 46));
</script>

<div class="bar" style="left: {left}px; top: {top}px" role="toolbar" aria-label="Text formatting">
    {#each items as item (item.cmd)}
        <button
            aria-label={item.label}
            title={item.label}
            onmousedown={(e) => {
                e.preventDefault();
                run(item.cmd);
            }}
        >
            <Icon name={item.icon} size={16} />
        </button>
    {/each}
</div>

<style>
    .bar {
        position: fixed;
        z-index: 75;
        display: flex;
        gap: 2px;
        padding: 4px;
        background: var(--tooltip-bg);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-2);
        animation: pop 120ms var(--ease);
    }

    @keyframes pop {
        from {
            opacity: 0;
            transform: translateY(3px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        padding: 0;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--tooltip-fg);
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    button:hover {
        background: var(--tooltip-hover);
        color: var(--tooltip-bg);
    }
</style>
