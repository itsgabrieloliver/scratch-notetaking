// Block type registry: labels, hints, icons, and the markdown prefixes that create them.

export const BLOCK_TYPES = [
    { type: 'paragraph', label: 'Text', hint: 'Plain paragraph', icon: 'type', keywords: 'text paragraph plain body' },
    { type: 'heading1', label: 'Heading 1', hint: 'Big section title', icon: 'heading-1', keywords: 'heading title h1 large' },
    { type: 'heading2', label: 'Heading 2', hint: 'Medium section title', icon: 'heading-2', keywords: 'heading h2 subtitle' },
    { type: 'heading3', label: 'Heading 3', hint: 'Small section title', icon: 'heading-3', keywords: 'heading h3 small' },
    { type: 'bulleted', label: 'Bulleted list', hint: 'Unordered item', icon: 'list', keywords: 'bullet list unordered ul dash' },
    { type: 'numbered', label: 'Numbered list', hint: 'Ordered item', icon: 'list-ordered', keywords: 'number ordered list ol steps' },
    { type: 'todo', label: 'To-do', hint: 'Checkbox item', icon: 'check-square', keywords: 'todo task checkbox check done' },
    { type: 'quote', label: 'Quote', hint: 'Set text apart', icon: 'quote', keywords: 'quote blockquote cite' },
    { type: 'callout', label: 'Callout', hint: 'Boxed note with an icon', icon: 'callout', keywords: 'callout note info box tip warning' },
    { type: 'code', label: 'Code', hint: 'Monospaced block', icon: 'code', keywords: 'code snippet pre mono' },
    { type: 'divider', label: 'Divider', hint: 'Horizontal rule', icon: 'minus', keywords: 'divider rule line separator hr' },
    { type: 'image', label: 'Image', hint: 'Pick one from this device', icon: 'image', keywords: 'image picture photo upload file' }
];

export const TYPE_LABEL = Object.fromEntries(BLOCK_TYPES.map((t) => [t.type, t.label]));

export const TEXTLESS = new Set(['divider', 'image']);

// Callouts carry a tone rather than a free emoji: each tone owns an icon and a color.
export const CALLOUT_TONES = [
    { tone: 'info', icon: 'info', label: 'Note' },
    { tone: 'idea', icon: 'bulb', label: 'Idea' },
    { tone: 'warning', icon: 'warning', label: 'Warning' },
    { tone: 'danger', icon: 'danger', label: 'Careful' },
    { tone: 'locked', icon: 'lock', label: 'Private' }
];

export const TONE_ICON = Object.fromEntries(CALLOUT_TONES.map((t) => [t.tone, t.icon]));
export const TONE_LABEL = Object.fromEntries(CALLOUT_TONES.map((t) => [t.tone, t.label]));

export function nextTone(tone) {
    const i = CALLOUT_TONES.findIndex((t) => t.tone === tone);
    return CALLOUT_TONES[(i + 1) % CALLOUT_TONES.length].tone;
}

// Markdown-style prefixes, checked longest-first.
export const MD_RULES = [
    { prefix: '```', type: 'code' },
    { prefix: '###', type: 'heading3' },
    { prefix: '##', type: 'heading2' },
    { prefix: '#', type: 'heading1' },
    { prefix: '[]', type: 'todo' },
    { prefix: '[ ]', type: 'todo' },
    { prefix: '1.', type: 'numbered' },
    { prefix: '>', type: 'quote' },
    { prefix: '-', type: 'bulleted' },
    { prefix: '*', type: 'bulleted' },
    { prefix: '---', type: 'divider' }
];

export function matchMarkdown(text) {
    // text is the content before the caret, expected to end with the trigger space.
    if (!text.endsWith(' ')) return null;
    const token = text.slice(0, -1);
    for (const rule of MD_RULES) {
        if (token === rule.prefix) return rule;
    }
    return null;
}

export function htmlToMarkdownInline(html) {
    return (html ?? '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<(b|strong)>(.*?)<\/\1>/gi, '**$2**')
        .replace(/<(i|em)>(.*?)<\/\1>/gi, '*$2*')
        .replace(/<(s|strike|del)>(.*?)<\/\1>/gi, '~~$2~~')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export function blockToMarkdown(block, index, numbering) {
    const text = htmlToMarkdownInline(block.text);
    switch (block.type) {
        case 'heading1':
            return `# ${text}`;
        case 'heading2':
            return `## ${text}`;
        case 'heading3':
            return `### ${text}`;
        case 'bulleted':
            return `- ${text}`;
        case 'numbered':
            return `${numbering}. ${text}`;
        case 'todo':
            return `- [${block.checked ? 'x' : ' '}] ${text}`;
        case 'quote':
            return `> ${text}`;
        case 'callout':
            return `> **${TONE_LABEL[block.tone] ?? 'Note'}:** ${text}`;
        case 'code':
            return '```' + (block.lang ?? '') + '\n' + text + '\n```';
        case 'divider':
            return '---';
        case 'image':
            return `![${block.alt ?? 'Image'}](${block.src ? 'embedded-image' : ''})`;
        default:
            return text;
    }
}

export function pageToMarkdown(page, blocksOverride) {
    const blocks = blocksOverride ?? page.blocks;
    const lines = [`# ${page.title || 'Untitled'}`, ''];
    let counter = 0;
    for (const block of blocks) {
        if (block.type === 'numbered') counter += 1;
        else counter = 0;
        lines.push(blockToMarkdown(block, 0, counter));
        if (block.type !== 'numbered' && block.type !== 'bulleted' && block.type !== 'todo') lines.push('');
    }
    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
