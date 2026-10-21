import { ThemeOptions } from '@mui/material/styles';
import { colors, cssVariables, font, gradients, radius, shadows } from './tokens';

/**
 * LIGHT THEME (the only one). Every value comes from tokens.ts.
 */
export const light: ThemeOptions = {
	palette: {
		mode: 'light',
		background: { default: colors.background, paper: colors.surface },
		primary: { main: colors.primary, dark: colors.primaryDark, light: colors.primaryTint, contrastText: '#FFFFFF' },
		secondary: { main: colors.text },
		success: { main: colors.success, light: colors.successBg },
		warning: { main: colors.warning, light: colors.warningBg },
		error: { main: colors.danger, light: colors.dangerBg },
		text: { primary: colors.text, secondary: colors.textSecondary, disabled: colors.textMuted },
		divider: colors.border,
	},
	shape: { borderRadius: 12 },
	typography: {
		fontFamily: font.family,
		h1: { fontFamily: font.heading, fontSize: 52, fontWeight: 700, letterSpacing: '-1.6px', lineHeight: 1.06 },
		h2: { fontFamily: font.heading, fontSize: 36, fontWeight: 700, letterSpacing: '-1px', lineHeight: 1.15 },
		h3: { fontFamily: font.heading, fontSize: 26, fontWeight: 700, letterSpacing: '-0.6px' },
		h4: { fontFamily: font.heading, fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' },
		h5: { fontFamily: font.heading, fontSize: 17, fontWeight: 600 },
		h6: { fontFamily: font.heading, fontSize: 15, fontWeight: 600 },
		body1: { fontSize: 15 },
		body2: { fontSize: 14 },
		caption: { fontSize: 12 },
		button: { fontSize: 14, fontWeight: 600, textTransform: 'none' },
	},
	components: {
		MuiCssBaseline: {
			styleOverrides: {
				':root': cssVariables,
				body: { background: colors.surface, color: colors.text },
				'h1, h2, h3, h4, h5': { fontFamily: font.heading, letterSpacing: '-0.02em' },
				p: { margin: 0 },
			},
		},
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: {
					height: 44,
					padding: '0 22px',
					borderRadius: radius.button,
					fontSize: 14,
					fontWeight: 600,
					whiteSpace: 'nowrap',
					transition: 'background-color .2s ease, box-shadow .2s ease, transform .15s ease, border-color .2s ease',
					'&:active': { transform: 'scale(0.98)' },
					'& .MuiButton-endIcon': { transition: 'transform .2s ease' },
					'&:hover .MuiButton-endIcon': { transform: 'translateX(3px)' },
				},
				sizeSmall: { height: 36, padding: '0 16px', fontSize: 13 },
				sizeLarge: { height: 50, fontSize: 15 },
				containedPrimary: {
					background: gradients.primary,
					boxShadow: shadows.button,
					'&:hover': { background: colors.primary, boxShadow: '0 12px 30px rgba(11, 122, 138, 0.38)' },
					'&.Mui-disabled': { background: colors.surfaceAlt, boxShadow: 'none' },
				},
				outlined: { borderColor: colors.border, color: colors.text, background: colors.surface },
				outlinedPrimary: {
					borderColor: colors.borderStrong,
					color: colors.text,
					'&:hover': { borderColor: colors.primary, background: colors.primaryTint },
				},
				containedError: { '&:hover': { background: '#A93226' } },
			},
		},
		MuiTextField: {
			defaultProps: { fullWidth: true },
		},
		MuiOutlinedInput: {
			styleOverrides: {
				root: {
					borderRadius: radius.field,
					background: colors.surface,
					fontSize: 14,
					'& .MuiOutlinedInput-notchedOutline': { borderColor: colors.borderStrong },
					'&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.textMuted },
					// Focus is the border alone (teal, a touch thicker) — no halo around the field.
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary, borderWidth: 1.5 },
					'&.Mui-error .MuiOutlinedInput-notchedOutline': { borderColor: colors.danger },
					// An icon in front of the text: the icon takes the left padding, the text none.
					'&.MuiInputBase-adornedStart': { paddingLeft: 14, '& .MuiOutlinedInput-input': { paddingLeft: 0 } },
					'& .MuiInputAdornment-root svg': { fontSize: 19, color: colors.textMuted },
				},
				input: { height: 48, padding: '0 14px', boxSizing: 'border-box' },
			},
		},
		MuiSelect: {
			styleOverrides: {
				// The outlined select is as tall as a text field; MUI's own min-height would win otherwise.
				select: {
					'&.MuiOutlinedInput-input': { height: 48, minHeight: 48, display: 'flex', alignItems: 'center' },
				},
			},
		},
		MuiFormHelperText: {
			styleOverrides: {
				root: { marginLeft: 0, fontSize: 12 },
				// Red 12px field errors
				contained: { '&.Mui-error': { color: colors.danger } },
			},
		},
		MuiChip: {
			styleOverrides: {
				root: { borderRadius: radius.pill, fontWeight: 600, fontSize: 13 },
				outlined: { borderColor: colors.borderStrong, color: colors.text },
			},
		},
		MuiTabs: {
			styleOverrides: {
				root: { minHeight: 44, borderBottom: `1px solid ${colors.border}` },
				indicator: {
					height: 3,
					borderRadius: 3,
					background: `linear-gradient(90deg, ${colors.primary}, ${colors.leaf})`,
				},
			},
		},
		MuiTab: {
			styleOverrides: {
				root: {
					minHeight: 44,
					minWidth: 0,
					padding: '0 0 12px',
					marginRight: 28,
					fontSize: 16,
					fontWeight: 500,
					color: colors.textSecondary,
					textTransform: 'none',
					'&.Mui-selected': { color: colors.text, fontWeight: 700 },
				},
			},
		},
		MuiCheckbox: {
			styleOverrides: { root: { color: colors.borderStrong, '&.Mui-checked': { color: colors.primary } } },
		},
		MuiMenu: {
			styleOverrides: {
				paper: { borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: shadows.menu },
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					margin: '2px 8px',
					borderRadius: 12,
					fontSize: 14,
					'&.Mui-selected': { background: colors.primaryTint },
					'&.Mui-selected:hover': { background: colors.primaryTint },
				},
			},
		},
		MuiCircularProgress: {
			defaultProps: { color: 'primary' },
		},
		MuiSkeleton: {
			styleOverrides: { root: { background: colors.surfaceAlt }, rounded: { borderRadius: radius.card } },
		},
		MuiPaginationItem: {
			styleOverrides: {
				root: {
					minWidth: 40,
					height: 40,
					borderRadius: radius.button,
					border: `1px solid ${colors.border}`,
					background: colors.surface,
					fontWeight: 600,
					color: colors.text,
					'&.Mui-selected': { background: colors.ink, borderColor: colors.ink, color: '#FFFFFF' },
					'&.Mui-selected:hover': { background: colors.primaryDark },
				},
				ellipsis: { border: 0, background: 'transparent' },
			},
		},
		MuiDialog: {
			styleOverrides: { paper: { borderRadius: radius.modal, boxShadow: shadows.modal } },
		},
		MuiBackdrop: {
			styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { background: colors.backdrop } } },
		},
	},
};
