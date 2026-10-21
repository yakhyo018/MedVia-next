/**
 * The one source of MedVia's look (from MedVia-design). The MUI theme reads these
 * values directly; SCSS and SweetAlert read them as CSS custom properties, which
 * `cssVariables` below writes onto :root through MUI's CssBaseline.
 */
export const colors = {
	primary: '#0B7A8A',
	primaryHover: '#168390',
	primaryDark: '#086170',
	primaryTint: '#E4F3F0',
	primarySoft: '#CBE7DF',

	/** Decoration only (aurora, dots, sparklines) — never under text: white on it fails contrast. */
	mint: '#3DB39A',
	leaf: '#5FAE6E',
	leafTint: '#E6F4E6',
	coral: '#FF7E6B',

	text: '#0F2A2A',
	textSecondary: '#566B68',
	textMuted: '#8A9C98',

	border: '#E1EAE6',
	borderStrong: '#D6E2DD',
	background: '#F5F8F7',
	surface: '#FFFFFF',
	surfaceAlt: '#EDF3F1',

	/** Dark surfaces: the admin side menu, the footer, dark cards. */
	ink: '#0F2A2A',
	inkLine: '#1F3B39',
	inkText: '#9BB3AE',

	success: '#15803D',
	successBg: '#E7F6EC',
	warning: '#B45309',
	warningBg: '#FEF3E2',
	danger: '#C0392B',
	dangerBg: '#FDECEA',
	star: '#F5A524',

	glass: 'rgba(255, 255, 255, 0.66)',
	backdrop: 'rgba(15, 42, 42, 0.45)',
} as const;

export const radius = {
	button: 999,
	field: 14,
	card: 22,
	modal: 24,
	pill: 999,
} as const;

export const shadows = {
	card: '0 1px 2px rgba(15, 42, 42, 0.04), 0 14px 36px rgba(15, 42, 42, 0.07)',
	menu: '0 16px 40px rgba(15, 42, 42, 0.12)',
	modal: '0 24px 56px rgba(15, 42, 42, 0.18)',
	glass: '0 24px 50px rgba(15, 42, 42, 0.12)',
	button: '0 10px 26px rgba(11, 122, 138, 0.3)',
} as const;

export const font = {
	family: "'Inter', 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif",
	/** Headings: Onest has Latin and Cyrillic (Uzbek, Russian, Kazakh). */
	heading: "'Onest', 'Inter', 'Segoe UI', sans-serif",
};

/** Text-bearing gradient: both stops keep white text above 4.5:1. */
export const gradients = {
	primary: 'linear-gradient(135deg, #086170, #0B7A8A)',
	text: 'linear-gradient(90deg, #0B7A8A, #5FAE6E, #FF7E6B, #0B7A8A)',
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
	'--mv-font-heading': font.heading,
	'--mv-gradient-primary': gradients.primary,
	'--mv-gradient-text': gradients.text,
	'--mv-container': `${layout.container}px`,
	'--mv-header-height': `${layout.headerHeight}px`,
};
