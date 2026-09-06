<script module>
    // Stroke-based icon set. Every glyph is drawn on a 24x24 box, inherits
    // currentColor, and uses the token stroke width so it matches the type.
    export const ICONS = {
        // --- navigation / chrome ---
        menu: 'M4 7h16M4 12h16M4 17h16',
        sidebar: 'M4.5 6A1.5 1.5 0 016 4.5h12A1.5 1.5 0 0119.5 6v12a1.5 1.5 0 01-1.5 1.5H6A1.5 1.5 0 014.5 18zM10 4.5v15',
        'chevron-right': 'M9.5 5.5l6.5 6.5-6.5 6.5',
        'chevron-down': 'M5.5 9.5l6.5 6.5 6.5-6.5',
        search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM16.1 16.1L21 21',
        command:
            'M9 9h6v6H9zM9 9V7.4A2.6 2.6 0 106.4 10H9zM15 9h1.6A2.6 2.6 0 1014 6.4V9zM9 15H7.4A2.6 2.6 0 1010 17.6V15zM15 15v1.6a2.6 2.6 0 102.6-2.6H15z',
        plus: 'M12 5v14M5 12h14',
        'dots-horizontal': 'M5.2 12h.01M12 12h.01M18.8 12h.01',
        grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
        close: 'M6 6l12 12M18 6L6 18',
        check: 'M5 12.5l4.5 4.5L19 7',
        link: 'M10.5 13.5a4 4 0 006 .4l2-2a4 4 0 00-5.7-5.7l-1.1 1.1M13.5 10.5a4 4 0 00-6-.4l-2 2a4 4 0 005.7 5.7l1.1-1.1',
        keyboard:
            'M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5zM7 10h.01M11 10h.01M15 10h.01M8 13.6h8',

        // --- page actions ---
        trash: 'M4 7h16M9 7V4.6h6V7M6.6 7l.9 12.1a1 1 0 001 .9h7a1 1 0 001-.9L17.4 7M10 11v5M14 11v5',
        copy: 'M9 9.5A1.5 1.5 0 0110.5 8h7A1.5 1.5 0 0119 9.5v7a1.5 1.5 0 01-1.5 1.5h-7A1.5 1.5 0 019 16.5zM5.5 16A1.5 1.5 0 014 14.5v-8A1.5 1.5 0 015.5 5h8A1.5 1.5 0 0115 6.5',
        pencil: 'M4.5 19.5h4L19.4 8.6a2.1 2.1 0 00-3-3L5.5 16.5l-1 3zM15 6.5l3 3',
        star: 'M12 3.6l2.6 5.35 5.9.86-4.25 4.14 1 5.87L12 17.05l-5.25 2.77 1-5.87L3.5 9.81l5.9-.86z',
        'star-filled': 'M12 3.6l2.6 5.35 5.9.86-4.25 4.14 1 5.87L12 17.05l-5.25 2.77 1-5.87L3.5 9.81l5.9-.86z',
        download: 'M12 4v11M8 11.5l4 4 4-4M4.5 20h15',
        upload: 'M12 20V9M8 12.5l4-4 4 4M4.5 4h15',
        archive: 'M3.5 5.5h17V9h-17zM5.2 9v9.5a1 1 0 001 1h11.6a1 1 0 001-1V9M10 12.8h4',
        restore: 'M4 9h10.5a5 5 0 010 10H10M4 9l4-4M4 9l4 4',

        // --- theme ---
        sun: 'M12 8.2a3.8 3.8 0 100 7.6 3.8 3.8 0 000-7.6zM12 3.2v1.9M12 19.9v1.9M3.2 12h1.9M18.9 12h1.9M5.9 5.9l1.4 1.4M16.7 16.7l1.4 1.4M18.1 5.9l-1.4 1.4M7.3 16.7l-1.4 1.4',
        moon: 'M20 14.2A8.4 8.4 0 019.8 4 8.4 8.4 0 1020 14.2z',
        monitor: 'M3.5 6A1.5 1.5 0 015 4.5h14A1.5 1.5 0 0120.5 6v9a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 15zM9 20h6M12 16.5V20',

        // --- block types ---
        type: 'M5 7.2V5.5h14v1.7M12 5.5V18.5M9 18.5h6',
        heading: 'M5 5.5v13M13 5.5v13M5 12h8M17.5 18.5V9.6l-2 1.6',
        'heading-1': 'M4.5 5.5v13M11.5 5.5v13M4.5 12h7M18 18.5V9.6l-2 1.6',
        'heading-2': 'M4.5 5.5v13M11.5 5.5v13M4.5 12h7M15.4 11.6a2.4 2.4 0 114 1.8l-4 5.1h4.3',
        'heading-3': 'M4.5 5.5v13M11.5 5.5v13M4.5 12h7M15.5 10.4a2.2 2.2 0 113.5 2.6 2.3 2.3 0 01-3.3 4.6',
        list: 'M9 6.5h11M9 12h11M9 17.5h11M4.6 6.5h.01M4.6 12h.01M4.6 17.5h.01',
        'list-ordered': 'M9 6.5h11M9 12h11M9 17.5h11M5.2 8.4V4.6l-1.4 1M3.6 19.6h3M3.6 19.6c1.7-1.5 2.6-2.2 2.6-3.1a1.3 1.3 0 00-2.5-.4',
        'check-square':
            'M4.5 6.5A2 2 0 016.5 4.5h11a2 2 0 012 2v11a2 2 0 01-2 2h-11a2 2 0 01-2-2zM8.4 12l2.4 2.4 4.8-4.8',
        quote: 'M9.6 7.6A5 5 0 005 12.5V16.4h4.6v-4.6H7.2M19.2 7.6a5 5 0 00-4.6 4.9v3.9h4.6v-4.6h-2.4',
        code: 'M8.4 8.4L4.5 12l3.9 3.6M15.6 8.4L19.5 12l-3.9 3.6M13.6 5.2l-3.2 13.6',
        minus: 'M4.5 12h15',
        image: 'M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v11a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5zM4 15.4l3.9-3.4 3.6 3.1 3.1-2.6L20 16.4M9.6 9.4a.9.9 0 11-1.8 0 .9.9 0 011.8 0',
        callout: 'M9.6 16.6h4.8M10.2 19.4h3.6M9.5 15.6a5.6 5.6 0 115 0',
        bold: 'M7 5.5h5.6a3.2 3.2 0 010 6.5H7zM7 12h6.4a3.2 3.2 0 010 6.5H7z',
        italic: 'M14.5 5.5h-4M13.5 18.5h-4M13.5 5.5l-3 13',
        strikethrough: 'M4.5 12h15M16.2 7.4A4 4 0 0012.4 5.4C10 5.4 8.3 6.7 8.3 8.6c0 1.4.9 2.4 2.6 3M8 16.3a4.2 4.2 0 003.9 2.3c2.7 0 4.4-1.3 4.4-3.3 0-1-.3-1.8-1-2.4',

        // --- page glyphs ---
        'file-text': 'M6 3.6h7l5 5v11.8H6zM13 3.6V9h5M9.2 13h5.6M9.2 16.4h3.6',
        book: 'M4.6 5.6A2 2 0 016.6 3.6H19v13.8H6.6a2 2 0 00-2 2zM19 17.4v3H6.6',
        folder: 'M3.6 7A1.5 1.5 0 015.1 5.5h3.8l2 2.6h8A1.5 1.5 0 0120.4 9.6v7.9a1.5 1.5 0 01-1.5 1.5H5.1a1.5 1.5 0 01-1.5-1.5z',
        flag: 'M6 20.5V4M6 5h11.4l-2.1 3.6 2.1 3.6H6',
        bulb: 'M9.5 15.6a5.6 5.6 0 115 0v1.4h-5zM9.6 19.6h4.8',
        target: 'M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zM12 8.1a3.9 3.9 0 100 7.8 3.9 3.9 0 000-7.8zM12 11.6h.01',
        map: 'M9 4.6L3.6 7v12.4L9 17l6 2.4 5.4-2.4V4.6L15 7zM9 4.6V17M15 7v12.4',
        calendar:
            'M4 7.6A1.5 1.5 0 015.5 6.1h13A1.5 1.5 0 0120 7.6v10.9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5zM4 10.6h16M8.4 4v4.2M15.6 4v4.2',
        lock: 'M6 11.4h12v8.2H6zM8.6 11.4V8.2a3.4 3.4 0 016.8 0v3.2',
        feather: 'M19.6 4.4c-7 0-11.6 4-11.6 9.5v2.5L4 20.5M8 16.4h4.6c4 0 7-3.2 7-7.6zM10.5 14h5',
        compass: 'M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zM14.9 9.1l-1.6 4.2-4.2 1.6 1.6-4.2z',
        inbox: 'M3.6 12.6L6 5.5h12l2.4 7.1v5.4a1.5 1.5 0 01-1.5 1.5H5.1a1.5 1.5 0 01-1.5-1.5zM3.6 12.6h4.2l1.2 2.4h6l1.2-2.4h4.2',
        info: 'M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zM12 11v5.6M12 7.7h.01',
        warning: 'M12 4.4L21 19.6H3zM12 10v3.9M12 16.8h.01',
        danger: 'M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zM8.8 8.8l6.4 6.4M15.2 8.8l-6.4 6.4'
    };

    // Workspaces saved before the line-glyph set existed stored a pictograph in
    // page.icon. Anything that is not a known glyph name falls back to the
    // default page mark, so an upgraded workspace never shows a broken icon.
    export function iconName(value) {
        if (typeof value !== 'string' || !ICONS[value]) return 'file-text';
        return value;
    }
</script>

<script>
    let { name, size = 16, strokeWidth = null } = $props();
    const resolved = $derived(iconName(name));
    const filled = $derived(resolved === 'star-filled');
</script>

<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    stroke-width={strokeWidth ?? (resolved === 'dots-horizontal' || resolved === 'grip' ? 2.4 : 1.5)}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
>
    <path d={ICONS[resolved]} />
</svg>

<style>
    svg {
        display: block;
        flex: none;
        overflow: visible;
    }
</style>
