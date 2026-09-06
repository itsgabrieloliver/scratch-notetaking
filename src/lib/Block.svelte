<script>
    import { touch, save } from './store.svelte.js';
    import { matchMarkdown, TEXTLESS, BLOCK_TYPES, TYPE_LABEL, TONE_ICON, TONE_LABEL, nextTone } from './blocks.js';
    import Icon from './Icon.svelte';
    import FormatToolbar from './FormatToolbar.svelte';

    let {
        block,
        index,
        numbering = 1,
        pageId,
        focusRequest = $bindable(null),
        slash = $bindable(null),
        dragBlockId = $bindable(null),
        dropTarget = $bindable(null),
        insertAfter,
        removeBlock,
        focusNeighbour,
        mergeBackwards,
        moveBlock,
        onDrop
    } = $props();

    let el = $state(null);
    let menuOpen = $state(false);
    let hovered = $state(false);
    let toolbar = $state(null); // { x, y }
    let fileInput = $state(null);

    const placeholder = $derived(
        block.type === 'heading1'
            ? 'Heading 1'
            : block.type === 'heading2'
              ? 'Heading 2'
              : block.type === 'heading3'
                ? 'Heading 3'
                : block.type === 'code'
                  ? 'Code'
                  : block.type === 'quote'
                    ? 'Quote'
                    : block.type === 'callout'
                      ? 'Write a note'
                      : index === 0
                        ? 'Write something, or press / for blocks'
                        : 'Press / for blocks'
    );

    const tone = $derived(block.tone ?? 'info');

    // Keep the DOM in sync only when the value differs, so the caret never jumps mid-typing.
    $effect(() => {
        const html = block.text ?? '';
        if (el && el.innerHTML !== html && document.activeElement !== el) el.innerHTML = html;
    });

    $effect(() => {
        if (!focusRequest || focusRequest.id !== block.id || !el) return;
        const req = focusRequest;
        focusRequest = null;
        queueMicrotask(() => {
            el.focus();
            placeCaret(req.at, req.offset);
        });
    });

    function placeCaret(at, offset) {
        if (!el) return;
        const range = document.createRange();
        const sel = window.getSelection();
        if (at === 'start') {
            range.setStart(el, 0);
            range.collapse(true);
        } else if (at === 'merge' && typeof offset === 'number') {
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            let seen = 0;
            let node = walker.nextNode();
            let placed = false;
            while (node) {
                const len = node.textContent.length;
                if (seen + len >= offset) {
                    range.setStart(node, Math.max(0, offset - seen));
                    range.collapse(true);
                    placed = true;
                    break;
                }
                seen += len;
                node = walker.nextNode();
            }
            if (!placed) {
                range.selectNodeContents(el);
                range.collapse(false);
            }
        } else {
            range.selectNodeContents(el);
            range.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    }

    function caretAtStart() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return false;
        const range = sel.getRangeAt(0).cloneRange();
        range.selectNodeContents(el);
        range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
        return range.toString().length === 0;
    }

    function caretAtEnd() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return false;
        const range = sel.getRangeAt(0).cloneRange();
        range.selectNodeContents(el);
        range.setStart(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
        return range.toString().length === 0;
    }

    function textBeforeCaret() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return '';
        const range = sel.getRangeAt(0).cloneRange();
        range.selectNodeContents(el);
        range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset);
        return range.toString();
    }

    function sync() {
        block.text = el.innerHTML;
        touch(pageId);
    }

    function clearBlockText() {
        if (el) el.innerHTML = '';
        block.text = '';
    }

    function onInput() {
        const before = textBeforeCaret();

        // Markdown prefix transform
        const rule = matchMarkdown(before);
        if (rule && before === el.textContent.slice(0, before.length)) {
            const rest = el.textContent.slice(before.length);
            block.type = rule.type;
            if (rule.type === 'callout' && !block.tone) block.tone = 'info';
            if (TEXTLESS.has(rule.type)) {
                clearBlockText();
                touch(pageId);
                insertAfter(block.id, 'paragraph', rest);
                return;
            }
            el.innerHTML = rest;
            block.text = rest;
            touch(pageId);
            queueMicrotask(() => {
                el.focus();
                placeCaret('start');
            });
            return;
        }

        // Slash menu trigger
        if (before.endsWith('/')) {
            const rect = caretRect();
            slash = {
                blockId: block.id,
                x: rect.x,
                y: rect.y,
                query: '',
                clear: () => {
                    const text = el.textContent;
                    const at = text.lastIndexOf('/');
                    if (at !== -1) {
                        el.textContent = text.slice(0, at);
                        block.text = el.innerHTML;
                    }
                }
            };
        } else if (slash && slash.blockId === block.id) {
            const text = el.textContent;
            const at = text.lastIndexOf('/');
            if (at === -1) slash = null;
            else slash = { ...slash, query: text.slice(at + 1) };
        }

        sync();
    }

    function caretRect() {
        const sel = window.getSelection();
        if (sel && sel.rangeCount) {
            const r = sel.getRangeAt(0).getBoundingClientRect();
            if (r.width || r.height || r.top) return { x: r.left, y: r.bottom };
        }
        const r = el.getBoundingClientRect();
        return { x: r.left, y: r.bottom };
    }

    function onKeydown(e) {
        if (slash && slash.blockId === block.id) {
            if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab'].includes(e.key)) return; // SlashMenu handles these
            if (e.key === 'Escape') {
                slash = null;
                e.preventDefault();
                return;
            }
        }

        const mod = e.metaKey || e.ctrlKey;

        if (mod && !e.shiftKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            document.execCommand('bold');
            sync();
            return;
        }
        if (mod && !e.shiftKey && e.key.toLowerCase() === 'i') {
            e.preventDefault();
            document.execCommand('italic');
            sync();
            return;
        }
        if (mod && !e.shiftKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            wrapInline('code');
            return;
        }
        if (mod && e.shiftKey && e.key.toLowerCase() === 'x') {
            e.preventDefault();
            document.execCommand('strikeThrough');
            sync();
            return;
        }
        if (mod && e.shiftKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            addLink();
            return;
        }
        if (mod && e.shiftKey && e.key === 'ArrowUp') {
            e.preventDefault();
            moveBlock(block.id, -1);
            return;
        }
        if (mod && e.shiftKey && e.key === 'ArrowDown') {
            e.preventDefault();
            moveBlock(block.id, 1);
            return;
        }
        if (mod && e.key === 'Enter' && block.type === 'todo') {
            e.preventDefault();
            block.checked = !block.checked;
            touch(pageId);
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            if (block.type === 'code') return; // newlines inside code
            e.preventDefault();
            sync();
            const carry = ['bulleted', 'numbered', 'todo'].includes(block.type) ? block.type : 'paragraph';
            if (['bulleted', 'numbered', 'todo'].includes(block.type) && !el.textContent.trim()) {
                block.type = 'paragraph';
                touch(pageId);
                return;
            }
            insertAfter(block.id, carry);
            return;
        }

        if (e.key === 'Backspace') {
            if (block.type === 'code' && el.textContent.length) return;
            if (caretAtStart()) {
                if (block.type !== 'paragraph') {
                    e.preventDefault();
                    block.type = 'paragraph';
                    touch(pageId);
                    return;
                }
                e.preventDefault();
                if (index === 0) return;
                mergeBackwards(block.id, el.innerHTML);
            }
            return;
        }

        if (e.key === 'ArrowUp' && caretAtStart()) {
            e.preventDefault();
            focusNeighbour(block.id, -1, 'end');
            return;
        }
        if (e.key === 'ArrowDown' && caretAtEnd()) {
            e.preventDefault();
            focusNeighbour(block.id, 1, 'start');
            return;
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    ');
            sync();
        }
    }

    function wrapInline(tag) {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const text = sel.toString();
        document.execCommand('insertHTML', false, `<${tag}>${escapeHtml(text)}</${tag}>`);
        sync();
    }

    function escapeHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function addLink() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const url = prompt('Link URL');
        if (!url) return;
        const safe = /^(https?:|mailto:|#|\/)/i.test(url) ? url : `https://${url}`;
        document.execCommand('createLink', false, safe);
        sync();
    }

    function onPaste(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        sync();
    }

    function onSelect() {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !el.contains(sel.anchorNode)) {
            toolbar = null;
            return;
        }
        const r = sel.getRangeAt(0).getBoundingClientRect();
        toolbar = { x: r.left + r.width / 2, y: r.top };
    }

    function setType(type) {
        block.type = type;
        if (type === 'callout' && !block.tone) block.tone = 'info';
        if (TEXTLESS.has(type)) block.text = '';
        menuOpen = false;
        touch(pageId);
        if (!TEXTLESS.has(type)) focusRequest = { id: block.id, at: 'end' };
    }

    async function onFile(e) {
        const file = e.currentTarget.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = () => {
            block.src = reader.result;
            block.alt = file.name.replace(/\.[^.]+$/, '');
            touch(pageId);
        };
        reader.readAsDataURL(file);
    }

    function dragEdge(e) {
        const rect = e.currentTarget.getBoundingClientRect();
        return e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
    }
</script>

<div
    class="block-row type-{block.type} tone-{tone}"
    class:dragging={dragBlockId === block.id}
    class:drop-before={dropTarget?.id === block.id && dropTarget.edge === 'before'}
    class:drop-after={dropTarget?.id === block.id && dropTarget.edge === 'after'}
    role="presentation"
    onmouseenter={() => (hovered = true)}
    onmouseleave={() => (hovered = false)}
    ondragover={(e) => {
        if (!dragBlockId) return;
        e.preventDefault();
        dropTarget = { id: block.id, edge: dragEdge(e) };
    }}
    ondragleave={() => {
        if (dropTarget?.id === block.id) dropTarget = null;
    }}
    ondrop={(e) => {
        e.preventDefault();
        const edge = dropTarget?.edge ?? dragEdge(e);
        onDrop(block.id, edge);
    }}
>
    <div class="gutter" class:show={hovered || menuOpen}>
        <button
            class="handle"
            aria-label="Insert block below"
            title="Insert block below"
            onclick={() => insertAfter(block.id, 'paragraph')}
        >
            <Icon name="plus" size={15} />
        </button>
        <button
            class="handle grab"
            aria-label="Drag to reorder block"
            title="Drag to move, click for options"
            draggable="true"
            ondragstart={(e) => {
                dragBlockId = block.id;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/scratch-block', block.id);
            }}
            ondragend={() => {
                dragBlockId = null;
                dropTarget = null;
            }}
            onclick={() => (menuOpen = !menuOpen)}
        >
            <Icon name="grip" size={15} />
        </button>
    </div>

    {#if menuOpen}
        <button class="scrim" aria-label="Close block menu" onclick={() => (menuOpen = false)}></button>
        <div class="menu block-menu" role="menu">
            <p class="menu-title">Turn into</p>
            {#each BLOCK_TYPES as t (t.type)}
                <button role="menuitem" class:selected={t.type === block.type} onclick={() => setType(t.type)}>
                    <Icon name={t.icon} /> {t.label}
                </button>
            {/each}
            <div class="menu-sep"></div>
            <button
                role="menuitem"
                class="danger"
                onclick={() => {
                    menuOpen = false;
                    removeBlock(block.id);
                }}><Icon name="trash" /> Delete block</button
            >
        </div>
    {/if}

    <div class="content">
        {#if block.type === 'divider'}
            <hr />
        {:else if block.type === 'image'}
            {#if block.src}
                <figure>
                    <img src={block.src} alt={block.alt || 'Image saved in this browser'} />
                    <figcaption>{block.alt || 'Image stored in this browser'}</figcaption>
                </figure>
            {:else}
                <div class="file-drop">
                    <Icon name="image" size={20} />
                    <span>Pick an image from this device. It is stored inside your local notes, never uploaded.</span>
                    <input
                        bind:this={fileInput}
                        type="file"
                        accept="image/*"
                        onchange={onFile}
                        id="file-{block.id}"
                        class="visually-hidden"
                    />
                    <label class="ghost" for="file-{block.id}">Choose image</label>
                </div>
            {/if}
        {:else}
            <div class="line">
                {#if block.type === 'bulleted'}
                    <span class="marker" aria-hidden="true">•</span>
                {:else if block.type === 'numbered'}
                    <span class="marker num" aria-hidden="true">{numbering}.</span>
                {:else if block.type === 'todo'}
                    <input
                        class="check"
                        type="checkbox"
                        checked={block.checked}
                        aria-label="Mark to-do done"
                        onchange={(e) => {
                            block.checked = e.currentTarget.checked;
                            touch(pageId);
                        }}
                    />
                {:else if block.type === 'callout'}
                    <button
                        class="callout-icon"
                        aria-label="Callout style: {TONE_LABEL[tone]}. Click to change."
                        title="Callout style: {TONE_LABEL[tone]}"
                        onclick={() => {
                            block.tone = nextTone(tone);
                            touch(pageId);
                        }}
                    >
                        <Icon name={TONE_ICON[tone] ?? 'info'} size={17} />
                    </button>
                {/if}

                <div
                    bind:this={el}
                    class="editable"
                    class:done={block.type === 'todo' && block.checked}
                    class:empty={!block.text}
                    contenteditable="true"
                    role="textbox"
                    tabindex="0"
                    aria-label="{TYPE_LABEL[block.type]} block"
                    data-placeholder={placeholder}
                    oninput={onInput}
                    onkeydown={onKeydown}
                    onpaste={onPaste}
                    onmouseup={onSelect}
                    onkeyup={onSelect}
                    onblur={() => {
                        toolbar = null;
                        if (el) {
                            block.text = el.innerHTML;
                            save();
                        }
                    }}
                ></div>
            </div>
        {/if}
    </div>
</div>

{#if toolbar}
    <FormatToolbar
        x={toolbar.x}
        y={toolbar.y}
        run={(cmd) => {
            if (cmd === 'code') wrapInline('code');
            else if (cmd === 'link') addLink();
            else {
                document.execCommand(cmd);
                sync();
            }
        }}
    />
{/if}

<style>
    .block-row {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: var(--sp-1);
        margin-left: -56px;
        padding: 1px 0 1px 56px;
        border-radius: var(--radius-sm);
    }

    .block-row.dragging {
        opacity: 0.45;
    }

    .block-row.drop-before::before,
    .block-row.drop-after::after {
        content: '';
        position: absolute;
        left: 56px;
        right: 0;
        height: 2px;
        background: var(--accent);
        border-radius: 2px;
    }

    .block-row.drop-before::before {
        top: -1px;
    }

    .block-row.drop-after::after {
        bottom: -1px;
    }

    .gutter {
        position: absolute;
        left: 0;
        top: 2px;
        display: flex;
        gap: 1px;
        opacity: 0;
        transition: opacity var(--dur) var(--ease);
    }

    .gutter.show {
        opacity: 1;
    }

    .gutter:focus-within {
        opacity: 1;
    }

    .handle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 26px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-faint);
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
    }

    .handle.grab {
        cursor: grab;
    }

    .handle.grab:active {
        cursor: grabbing;
    }

    .handle:hover {
        background: var(--hover);
        color: var(--text);
    }

    .content {
        flex: 1;
        min-width: 0;
        padding: 2px 0;
    }

    .line {
        display: flex;
        align-items: flex-start;
        gap: var(--sp-2);
    }

    .marker {
        flex: none;
        width: 18px;
        text-align: right;
        color: var(--text-muted);
        line-height: var(--lh-md);
        font-variant-numeric: tabular-nums;
    }

    /* Fully custom so no browser blue ever appears in either theme. */
    .check {
        flex: none;
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        width: 16px;
        height: 16px;
        margin: 6px 0 0;
        border: 1.5px solid var(--border-strong);
        border-radius: var(--radius-sm);
        background: var(--surface-raised);
        cursor: pointer;
        transition: background var(--dur) var(--ease), border-color var(--dur) var(--ease);
    }

    .check:hover {
        border-color: var(--accent);
    }

    .check:checked {
        background: var(--accent);
        border-color: var(--accent);
    }

    .check:checked::after {
        content: '';
        position: absolute;
        left: 4.5px;
        top: 1px;
        width: 4px;
        height: 8px;
        border: solid var(--accent-fg);
        border-width: 0 2px 2px 0;
        transform: rotate(43deg);
    }

    .callout-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: none;
        width: 24px;
        height: 24px;
        margin-top: 1px;
        border: 0;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--accent);
        cursor: pointer;
        transition: background var(--dur-fast) var(--ease);
    }

    .callout-icon:hover {
        background: var(--hover);
    }

    .editable {
        flex: 1;
        min-width: 0;
        min-height: 1.65em;
        padding: 1px 2px;
        font-size: var(--fs-md);
        line-height: var(--lh-md);
        outline: none;
        word-break: break-word;
    }

    .editable.empty::before {
        content: attr(data-placeholder);
        color: var(--text-faint);
        pointer-events: none;
    }

    .editable.done {
        color: var(--text-faint);
        text-decoration: line-through;
    }

    .editable :global(code) {
        font-family: var(--font-mono);
        font-size: 0.88em;
        background: var(--code-bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 1px 4px;
    }

    .editable :global(a) {
        color: var(--accent);
        text-underline-offset: 2px;
    }

    .type-heading1 .editable {
        font-family: var(--font-display);
        font-size: var(--fs-2xl);
        font-weight: 600;
        letter-spacing: var(--ls-2xl);
        line-height: var(--lh-2xl);
        margin-top: var(--sp-5);
    }

    .type-heading2 .editable {
        font-family: var(--font-display);
        font-size: var(--fs-xl);
        font-weight: 600;
        letter-spacing: var(--ls-xl);
        line-height: var(--lh-xl);
        margin-top: var(--sp-4);
    }

    .type-heading3 .editable {
        font-size: var(--fs-lg);
        font-weight: 600;
        line-height: var(--lh-lg);
        margin-top: var(--sp-3);
    }

    .type-quote .content {
        border-left: 3px solid var(--border-strong);
        padding-left: var(--sp-4);
        margin: var(--sp-1) 0;
    }

    .type-quote .editable {
        font-family: var(--font-display);
        font-size: var(--fs-lg);
        line-height: 1.55;
        color: var(--text-muted);
    }

    .type-callout .content {
        position: relative;
        background: var(--callout-bg);
        border: 1px solid var(--border);
        border-left: 3px solid var(--accent);
        border-radius: var(--radius-lg);
        padding: var(--sp-4);
        margin: var(--sp-2) 0;
    }

    .type-callout.tone-warning .content {
        border-left-color: var(--warning);
    }

    .type-callout.tone-warning .callout-icon {
        color: var(--warning);
    }

    .type-callout.tone-danger .content {
        border-left-color: var(--danger);
        background: var(--danger-soft);
    }

    .type-callout.tone-danger .callout-icon {
        color: var(--danger);
    }

    .type-code .content {
        background: var(--code-bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: var(--sp-4);
        margin: var(--sp-2) 0;
    }

    .type-code .editable {
        font-family: var(--font-mono);
        font-size: 13.5px;
        line-height: 1.6;
        white-space: pre-wrap;
    }

    hr {
        border: 0;
        border-top: 1px solid var(--border-strong);
        margin: var(--sp-4) 0;
    }

    figure {
        margin: var(--sp-3) 0;
    }

    img {
        max-width: 100%;
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        display: block;
    }

    figcaption {
        margin-top: var(--sp-2);
        font-size: var(--fs-xs);
        letter-spacing: var(--ls-xs);
        color: var(--text-faint);
    }

    .file-drop {
        display: flex;
        align-items: center;
        gap: var(--sp-3);
        padding: var(--sp-4);
        border: 1px dashed var(--border-strong);
        border-radius: var(--radius-lg);
        color: var(--text-muted);
        font-size: var(--fs-sm);
        line-height: 1.5;
    }

    .file-drop span {
        flex: 1;
        min-width: 0;
    }

    label.ghost {
        display: inline-flex;
        align-items: center;
        flex: none;
        min-height: 34px;
        padding: 0 var(--sp-3);
        border: 1px solid var(--border-strong);
        border-radius: var(--radius-md);
        background: var(--surface-raised);
        color: var(--text);
        font-size: var(--fs-sm);
        cursor: pointer;
        transition: background var(--dur) var(--ease);
    }

    label.ghost:hover {
        background: var(--hover);
    }

    .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }

    .scrim {
        position: fixed;
        inset: 0;
        z-index: 40;
        border: 0;
        background: transparent;
        cursor: default;
    }

    .block-menu {
        left: 0;
        right: auto;
        top: 30px;
        max-height: 340px;
        overflow-y: auto;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-3);
    }

    .menu-title {
        margin: var(--sp-1) var(--sp-2) var(--sp-1);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
    }

    .block-menu button.selected {
        background: var(--accent-soft);
        color: var(--accent);
    }

    @media (max-width: 860px) {
        .block-row {
            margin-left: 0;
            padding-left: 0;
        }
        .block-row.drop-before::before,
        .block-row.drop-after::after {
            left: 0;
        }
        .gutter {
            display: none;
        }
    }
</style>
