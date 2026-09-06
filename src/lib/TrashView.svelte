<script>
    import { app, trashed, restorePage, deleteForever, emptyTrash, toast, pagePreview } from './store.svelte.js';
    import Icon from './Icon.svelte';

    let { openPage } = $props();

    const items = $derived(trashed());

    function when(ts) {
        if (!ts) return 'recently';
        const days = Math.floor((Date.now() - ts) / 86400000);
        if (days === 0) return 'today';
        if (days === 1) return 'yesterday';
        return `${days} days ago`;
    }
</script>

<div class="trash">
    <header>
        <div>
            <h1>Trash</h1>
            <p>Deleted pages stay here until you remove them. Nothing is ever sent anywhere.</p>
        </div>
        <div class="acts">
            <button class="ghost" onclick={() => (app.view = 'page')}>Back to pages</button>
            {#if items.length}
                <button
                    class="ghost danger"
                    onclick={() => {
                        emptyTrash();
                        toast('Trash emptied');
                    }}><Icon name="trash" size={15} /> Empty trash</button
                >
            {/if}
        </div>
    </header>

    {#if items.length}
        <ul>
            {#each items as page (page.id)}
                <li>
                    <span class="icon" aria-hidden="true"><Icon name={page.icon} size={18} /></span>
                    <span class="body">
                        <span class="title">{page.title || 'Untitled'}</span>
                        <span class="sub">{pagePreview(page) || 'No text'} · deleted {when(page.trashedAt)}</span>
                    </span>
                    <span class="row-acts">
                        <button
                            class="ghost"
                            onclick={() => {
                                restorePage(page.id);
                                app.view = 'page';
                                openPage(page.id);
                                toast('Page restored');
                            }}
                        >
                            <Icon name="restore" size={15} /> Restore
                        </button>
                        <button
                            class="ghost danger"
                            onclick={() => {
                                deleteForever(page.id);
                                toast('Deleted for good');
                            }}
                        >
                            <Icon name="trash" size={15} /> Delete
                        </button>
                    </span>
                </li>
            {/each}
        </ul>
    {:else}
        <div class="empty">
            <span class="mark" aria-hidden="true"><Icon name="trash" size={26} /></span>
            <h2>Trash is empty</h2>
            <p>Pages you delete land here first, so a wrong click is never final.</p>
            <button class="primary" onclick={() => (app.view = 'page')}>Back to pages</button>
        </div>
    {/if}
</div>

<style>
    .trash {
        max-width: var(--measure);
        margin: 0 auto;
        padding: var(--sp-8) var(--sp-8) var(--sp-8);
    }

    header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--sp-4);
        flex-wrap: wrap;
        margin-bottom: var(--sp-6);
    }

    h1 {
        margin: 0 0 var(--sp-2);
    }

    header p {
        margin: 0;
        max-width: 52ch;
        color: var(--text-muted);
        font-size: var(--fs-sm);
        line-height: 1.6;
    }

    .acts {
        display: flex;
        gap: var(--sp-2);
    }

    .ghost.danger {
        color: var(--danger);
    }

    .ghost.danger:hover {
        background: var(--danger-soft);
        border-color: var(--danger);
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: var(--sp-2);
    }

    li {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-3) var(--sp-4);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface-raised);
        transition: border-color var(--dur) var(--ease);
    }

    li:hover {
        border-color: var(--border-strong);
    }

    .icon {
        display: inline-flex;
        flex: none;
        color: var(--text-faint);
    }

    .body {
        flex: 1;
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .title {
        font-size: var(--fs-sm);
        font-weight: 500;
    }

    .sub {
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .row-acts {
        display: flex;
        gap: var(--sp-2);
        flex: none;
    }

    .empty {
        text-align: center;
        padding: var(--sp-8) var(--sp-4);
    }

    .mark {
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

    .empty h2 {
        margin: 0 0 var(--sp-2);
    }

    .empty p {
        margin: 0 auto var(--sp-5);
        max-width: 42ch;
        color: var(--text-muted);
        font-size: var(--fs-sm);
        line-height: 1.6;
    }

    @media (max-width: 700px) {
        .trash {
            padding: var(--sp-5) var(--sp-4) var(--sp-8);
        }
        li {
            flex-wrap: wrap;
        }
        .body {
            flex-basis: 60%;
        }
        .row-acts {
            flex-basis: 100%;
        }
    }
</style>
