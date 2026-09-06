<script>
    import { newBlock, touch, renamePage, setIcon, createPage, childrenOf } from './store.svelte.js';
    import Block from './Block.svelte';
    import IconPicker from './IconPicker.svelte';
    import SlashMenu from './SlashMenu.svelte';
    import Icon from './Icon.svelte';
    import { TEXTLESS } from './blocks.js';

    let { page, openPage } = $props();

    let focusRequest = $state(null); // { id, at: 'start' | 'end' }
    let slash = $state(null); // { blockId, x, y, query }
    let pickerOpen = $state(false);
    let dragBlockId = $state(null);
    let dropTarget = $state(null); // { id, edge }

    const subpages = $derived(childrenOf(page.id));
    const updated = $derived(new Date(page.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }));

    function indexOf(id) {
        return page.blocks.findIndex((b) => b.id === id);
    }

    // Position of a numbered item within its consecutive run.
    function numberFor(i) {
        let n = 0;
        for (let k = i; k >= 0; k--) {
            if (page.blocks[k].type === 'numbered') n++;
            else break;
        }
        return n;
    }

    function insertAfter(id, type = 'paragraph', text = '') {
        const i = indexOf(id);
        const block = newBlock(type, text);
        page.blocks.splice(i + 1, 0, block);
        touch(page.id);
        focusRequest = { id: block.id, at: 'start' };
        return block.id;
    }

    function removeBlock(id) {
        const i = indexOf(id);
        if (i === -1) return;
        page.blocks.splice(i, 1);
        if (!page.blocks.length) page.blocks.push(newBlock());
        touch(page.id);
    }

    function focusNeighbour(id, dir, at = dir > 0 ? 'start' : 'end') {
        const i = indexOf(id);
        const next = page.blocks[i + dir];
        if (next) focusRequest = { id: next.id, at };
    }

    function mergeBackwards(id, html) {
        const i = indexOf(id);
        if (i <= 0) return;
        const prev = page.blocks[i - 1];
        if (TEXTLESS.has(prev.type)) {
            page.blocks.splice(i - 1, 1);
            touch(page.id);
            return;
        }
        const prevLen = prev.text.length;
        prev.text = prev.text + html;
        page.blocks.splice(i, 1);
        touch(page.id);
        focusRequest = { id: prev.id, at: prevLen ? 'merge' : 'start', offset: prevLen };
    }

    function moveBlock(id, dir) {
        const i = indexOf(id);
        const j = i + dir;
        if (i === -1 || j < 0 || j >= page.blocks.length) return;
        const [b] = page.blocks.splice(i, 1);
        page.blocks.splice(j, 0, b);
        touch(page.id);
        focusRequest = { id, at: 'end' };
    }

    function onBlockDrop(targetId, edge) {
        if (!dragBlockId || dragBlockId === targetId) return;
        const from = indexOf(dragBlockId);
        const [moved] = page.blocks.splice(from, 1);
        let to = indexOf(targetId);
        if (edge === 'after') to += 1;
        page.blocks.splice(to, 0, moved);
        touch(page.id);
        dragBlockId = null;
        dropTarget = null;
    }

    function onTitleKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = page.blocks[0];
            if (first && !first.text && !TEXTLESS.has(first.type)) focusRequest = { id: first.id, at: 'start' };
            else {
                const block = newBlock();
                page.blocks.unshift(block);
                touch(page.id);
                focusRequest = { id: block.id, at: 'start' };
            }
        } else if (e.key === 'ArrowDown') {
            const first = page.blocks[0];
            if (first) focusRequest = { id: first.id, at: 'start' };
        }
    }

    function clickBelow() {
        const last = page.blocks[page.blocks.length - 1];
        if (last && !TEXTLESS.has(last.type) && !last.text.trim()) {
            focusRequest = { id: last.id, at: 'end' };
            return;
        }
        const block = newBlock();
        page.blocks.push(block);
        touch(page.id);
        focusRequest = { id: block.id, at: 'start' };
    }
</script>

<article class="doc">
    <div class="doc-inner">
        <div class="icon-row">
            <button
                class="page-icon"
                aria-label="Change page icon"
                title="Change page icon"
                onclick={() => (pickerOpen = !pickerOpen)}
            >
                <Icon name={page.icon} size={30} strokeWidth={1.4} />
            </button>
            {#if pickerOpen}
                <button class="scrim" aria-label="Close icon picker" onclick={() => (pickerOpen = false)}></button>
                <IconPicker
                    pick={(name) => {
                        setIcon(page.id, name);
                        pickerOpen = false;
                    }}
                />
            {/if}
        </div>

        <h1 class="title">
            <input
                class="title-input page-title"
                value={page.title}
                placeholder="Untitled"
                aria-label="Page title"
                oninput={(e) => renamePage(page.id, e.currentTarget.value)}
                onkeydown={onTitleKeydown}
            />
            <span class="visually-hidden">{page.title || 'Untitled'}</span>
        </h1>

        <p class="meta">Last edited {updated} · saved on this device</p>

        <div class="blocks">
            {#each page.blocks as block, i (block.id)}
                <Block
                    {block}
                    index={i}
                    numbering={numberFor(i)}
                    bind:focusRequest
                    bind:slash
                    bind:dragBlockId
                    bind:dropTarget
                    {insertAfter}
                    {removeBlock}
                    {focusNeighbour}
                    {mergeBackwards}
                    {moveBlock}
                    onDrop={onBlockDrop}
                    pageId={page.id}
                />
            {/each}
        </div>

        <button class="below" aria-label="Add a block at the end" onclick={clickBelow}>
            <span>Click to keep writing, or press / for a block</span>
        </button>

        <section class="subpages">
            <h2>Sub-pages</h2>
            {#if subpages.length}
                <ul>
                    {#each subpages as sp (sp.id)}
                        <li>
                            <button onclick={() => openPage(sp.id)}>
                                <Icon name={sp.icon} size={16} />
                                <span class="sp-title">{sp.title || 'Untitled'}</span>
                                <Icon name="chevron-right" size={15} />
                            </button>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p class="sub-empty">No sub-pages under this one yet.</p>
            {/if}
            <button class="ghost" onclick={() => openPage(createPage(page.id))}>
                <Icon name="plus" size={15} /> Add a sub-page
            </button>
        </section>
    </div>
</article>

{#if slash}
    <SlashMenu
        state={slash}
        close={() => (slash = null)}
        apply={(type) => {
            const target = page.blocks.find((b) => b.id === slash.blockId);
            if (target) {
                slash.clear?.();
                target.type = type;
                if (TEXTLESS.has(type)) target.text = '';
                if (type === 'callout' && !target.tone) target.tone = 'info';
                touch(page.id);
                if (TEXTLESS.has(type)) {
                    const id = insertAfter(target.id, 'paragraph');
                    focusRequest = { id, at: 'start' };
                } else {
                    focusRequest = { id: target.id, at: 'end' };
                }
            }
            slash = null;
        }}
    />
{/if}

<style>
    .doc {
        min-height: 100%;
        padding-bottom: var(--sp-8);
    }

    .doc-inner {
        max-width: var(--measure);
        margin: 0 auto;
        padding: var(--sp-8) var(--sp-8) 0;
    }

    .icon-row {
        position: relative;
        margin-bottom: var(--sp-3);
    }

    .page-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px;
        height: 52px;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        background: var(--surface);
        color: var(--accent);
        cursor: pointer;
        transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
    }

    .page-icon:hover {
        background: var(--hover);
        border-color: var(--border-strong);
    }

    .scrim {
        position: fixed;
        inset: 0;
        z-index: 40;
        border: 0;
        background: transparent;
        cursor: default;
    }

    .title {
        margin: 0;
        display: flex;
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .title-input {
        width: 100%;
        border: 0;
        background: transparent;
        color: var(--text);
        padding: 0;
    }

    .title-input:focus {
        outline: none;
    }

    .title-input::placeholder {
        color: var(--text-faint);
    }

    .meta {
        margin: var(--sp-2) 0 var(--sp-6);
        font-size: var(--fs-xs);
        line-height: var(--lh-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
    }

    .blocks {
        display: flow-root;
    }

    .below {
        display: block;
        width: 100%;
        min-height: 96px;
        margin-top: var(--sp-2);
        padding: var(--sp-3) 0;
        border: 0;
        background: transparent;
        color: transparent;
        font-family: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        cursor: text;
    }

    .below span {
        transition: color var(--dur) var(--ease);
    }

    .below:hover span,
    .below:focus-visible span {
        color: var(--text-faint);
    }

    .subpages {
        margin-top: var(--sp-6);
        padding-top: var(--sp-5);
        border-top: 1px solid var(--border);
    }

    .subpages h2 {
        margin: 0 0 var(--sp-3);
        font-family: var(--font-sans);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
    }

    .subpages ul {
        list-style: none;
        margin: 0 0 var(--sp-3);
        padding: 0;
        display: grid;
        gap: var(--sp-1);
    }

    .subpages li button {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        width: 100%;
        min-height: 44px;
        padding: 0 var(--sp-3);
        border: 1px solid transparent;
        border-radius: var(--radius-md);
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        cursor: pointer;
        transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
    }

    .subpages li button:hover {
        background: var(--hover);
        border-color: var(--border);
    }

    .sp-title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .sub-empty {
        margin: 0 0 var(--sp-3);
        font-size: var(--fs-sm);
        color: var(--text-faint);
    }

    @media (max-width: 900px) {
        .doc-inner {
            padding: var(--sp-6) var(--sp-5) 0;
        }
    }

    @media (max-width: 600px) {
        .doc-inner {
            padding: var(--sp-5) var(--sp-4) 0;
        }
        .title-input {
            font-size: var(--fs-2xl);
            line-height: var(--lh-2xl);
        }
    }
</style>
