/**
 * The one source of MedVia's look (from MedVia-design). The MUI theme reads these
 * values directly; SCSS and SweetAlert read them as CSS custom properties, which
 * `cssVariables` below writes onto :root through MUI's CssBaseline.
 */
export const colors = {
	primary: '#0B7A8A',
	primaryHover: '#168390',
	primaryDark: '#086170',
	primaryTint: '#E4F3F5',
	primarySoft: '#CBE7EB',

	text: '#0F2A3D',
	textSecondary: '#52667A',
	textMuted: '#8A9BAB',

	border: '#E3EAF0',
	borderStrong: '#D3DDE5',
	background: '#F4F8FA',
	surface: '#FFFFFF',
	surfaceAlt: '#EEF4F7',

	success: '#15803D',
	successBg: '#E7F6EC',
	warning: '#B45309',
	warningBg: '#FEF3E2',
	danger: '#C0392B',
	dangerBg: '#FDECEA',
	star: '#F5A524',

	backdrop: 'rgba(15, 42, 61, 0.45)',
} as const;

export const radius = {
	button: 10,
	field: 10,
	card: 16,
	modal: 16,
	pill: 999,
} as const;

export const shadows = {
	card: '0 1px 2px rgba(15, 42, 61, 0.04), 0 12px 32px rgba(15, 42, 61, 0.07)',
	menu: '0 12px 32px rgba(15, 42, 61, 0.12)',
	modal: '0 24px 48px rgba(15, 42, 61, 0.16)',
} as const;

export const font = {
	family: "'Plus Jakarta Sans', 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif",
} as const;

export const layout = {
	container: 1200,
	headerHeight: 80,
} as const;

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** `--mv-primary: #0B7A8A; --mv-radius-button: 10px; …` */
export const cssVariables: Record<string, string> = {
	...Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--mv-${kebab(k)}`, v])),
	...Object.fromEntries(Object.entries(radius).map(([k, v]) => [`--mv-radius-${kebab(k)}`, `${v}px`])),
	...Object.fromEntries(Object.entries(shadows).map(([k, v]) => [`--mv-shadow-${kebab(k)}`, v])),
	'--mv-font': font.family,
	'--mv-container': `${layout.container}px`,
	'--mv-header-height': `${layout.headerHeight}px`,
};
