// Local id helper: kept here so seeding never imports back into the store.
function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function b(type, text = '', extra = {}) {
    return { id: uid(), type, text, checked: false, ...extra };
}

// Realistic starter workspace so a first-time visitor lands on something alive.
export function seedPages() {
    const home = uid();
    const guide = uid();
    const shortcuts = uid();
    const journal = uid();
    const week = uid();
    const recipes = uid();
    const now = Date.now();
    const day = 86400000;

    const mk = (id, parentId, title, icon, order, blocks, opts = {}) => ({
        id,
        parentId,
        title,
        icon,
        order,
        favorite: !!opts.favorite,
        collapsed: !!opts.collapsed,
        trashed: false,
        trashedAt: null,
        createdAt: now - (opts.age ?? 0),
        updatedAt: now - (opts.age ?? 0),
        blocks
    });

    return [
        mk(
            home,
            null,
            'Start here',
            'compass',
            0,
            [
                b('callout', 'Everything you write lives in this browser. No account, no server, no sync.', {
                    tone: 'locked'
                }),
                b('heading2', 'What this is'),
                b(
                    'paragraph',
                    'Scratch is a notes workspace that never leaves your device. Pages nest, blocks rearrange, and edits save themselves a moment after you stop typing.'
                ),
                b('heading2', 'Three things to try'),
                b('numbered', 'Type <b>/</b> on an empty line to pick a block type.'),
                b('numbered', 'Press <b>⌘K</b> to jump to any page by title or by text inside it.'),
                b('numbered', 'Press <b>?</b> to see every shortcut.'),
                b('divider'),
                b('quote', 'Write it down now, sort it out later.'),
                b(
                    'paragraph',
                    'When you want a copy outside the browser, open the page options menu to export Markdown or a JSON backup.'
                )
            ],
            { favorite: true }
        ),
        mk(guide, home, 'Editor basics', 'feather', 0, [
            b('paragraph', 'Markdown shortcuts transform a line as soon as you type the prefix and a space.'),
            b('heading3', 'Prefixes'),
            b('bulleted', '<code>#</code>, <code>##</code>, <code>###</code> for headings'),
            b('bulleted', '<code>-</code> or <code>*</code> for a bullet, <code>1.</code> for a numbered item'),
            b('bulleted', '<code>[]</code> for a to-do, <code>&gt;</code> for a quote, <code>```</code> for code'),
            b('heading3', 'Inline formatting'),
            b(
                'paragraph',
                'Select text and use <b>⌘B</b>, <b>⌘I</b>, <b>⌘E</b> for code, <b>⌘⇧X</b> for strikethrough, or <b>⌘⇧K</b> to add a link.'
            ),
            b('code', 'const note = { local: true, synced: false };\nsave(note); // stays here', { lang: 'js' })
        ]),
        mk(shortcuts, home, 'Keyboard map', 'keyboard', 1, [
            b('paragraph', 'The shortcuts worth memorising first.'),
            b('todo', 'Open the quick switcher with ⌘K', { checked: true }),
            b('todo', 'Insert a block with /'),
            b('todo', 'Collapse the sidebar with ⌘\\'),
            b('todo', 'Move a block with the drag handle on its left')
        ]),
        mk(
            journal,
            null,
            'Journal',
            'book',
            1,
            [
                b('paragraph', 'A page per week. Short entries beat perfect ones.'),
                b('divider'),
                b('paragraph', 'Sub-pages sit under this one in the sidebar.')
            ],
            { age: day }
        ),
        mk(
            week,
            journal,
            'Week of 12 May',
            'calendar',
            0,
            [
                b('heading2', 'Monday'),
                b('paragraph', 'Rewrote the onboarding copy. Cut it from four paragraphs to two.'),
                b('heading2', 'Wednesday'),
                b('todo', 'Draft the storage notes', { checked: true }),
                b('todo', 'Measure load time on a cold cache'),
                b('quote', 'Slow is smooth, smooth is fast.')
            ],
            { age: day }
        ),
        mk(
            recipes,
            null,
            'Sourdough log',
            'target',
            2,
            [
                b('callout', 'Starter doubles in about 5 hours at 24°C. Feed 1:2:2.', { tone: 'info' }),
                b('heading2', 'Timings that worked'),
                b('bulleted', 'Autolyse 45 minutes'),
                b('bulleted', 'Four sets of folds, 30 minutes apart'),
                b('bulleted', 'Cold retard overnight, 14 hours'),
                b('paragraph', 'The crumb was open but the base browned too fast. Try one shelf higher.')
            ],
            { age: 3 * day }
        )
    ];
}
