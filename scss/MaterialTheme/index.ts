import { ThemeOptions } from '@mui/material/styles';
import { colors, cssVariables, font, radius, shadows } from './tokens';

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
	shape: { borderRadius: radius.button },
	typography: {
		fontFamily: font.family,
		h1: { fontSize: 48, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15 },
		h2: { fontSize: 34, fontWeight: 800, letterSpacing: '-0.6px', lineHeight: 1.25 },
		h3: { fontSize: 26, fontWeight: 800, letterSpacing: '-0.4px' },
		h4: { fontSize: 20, fontWeight: 700 },
		h5: { fontSize: 17, fontWeight: 700 },
		h6: { fontSize: 15, fontWeight: 700 },
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
				p: { margin: 0 },
			},
		},
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: {
					height: 42,
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
					'&:hover': { background: colors.primaryHover, boxShadow: '0 8px 20px rgba(11, 122, 138, 0.25)' },
				},
				outlined: { borderColor: colors.borderStrong, color: colors.text, background: colors.surface },
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
					'&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary, borderWidth: 1 },
					'&.Mui-focused': { boxShadow: `0 0 0 3px ${colors.primaryTint}` },
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
				indicator: { height: 2, background: colors.primary },
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
					'&.Mui-selected': { color: colors.primary, fontWeight: 800 },
				},
			},
		},
		MuiCheckbox: {
			styleOverrides: { root: { color: colors.borderStrong, '&.Mui-checked': { color: colors.primary } } },
		},
		MuiMenu: {
			styleOverrides: {
				paper: { borderRadius: 14, border: `1px solid ${colors.border}`, boxShadow: shadows.menu },
			},
		},
		MuiMenuItem: {
			styleOverrides: {
				root: {
					margin: '2px 8px',
					borderRadius: 10,
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
		MuiDialog: {
			styleOverrides: { paper: { borderRadius: radius.modal, boxShadow: shadows.modal } },
		},
		MuiBackdrop: {
			styleOverrides: { root: { '&:not(.MuiBackdrop-invisible)': { background: colors.backdrop } } },
		},
	},
};
