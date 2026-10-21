import Link from 'next/link';
import { Box } from '@mui/material';

interface LogoProps {
	/** white: on the teal panel of the login page */
	variant?: 'default' | 'white';
	href?: string | null;
}

/** The MedVia mark (a heart with a pulse line) + the word. Same drawing as public/img/logo/logo-mark.svg. */
const Logo = (props: LogoProps) => {
	const { variant = 'default', href = '/' } = props;
	const white = variant === 'white';

	const mark = (
		<Box component={'span'} className={`mv-logo ${variant}`}>
			<svg className={'mark'} viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
				{/* The heart runs from the brand teal into mint (tokens: primary → mint). */}
				<defs>
					<linearGradient id={'mv-logo-heart'} x1={'0'} y1={'0'} x2={'1'} y2={'1'}>
						<stop offset={'0'} stopColor={'#0B7A8A'} />
						<stop offset={'1'} stopColor={'#3DB39A'} />
					</linearGradient>
				</defs>
				<path
					className={'heart'}
					d="M18 32S3 23 3 12.5A7.5 7.5 0 0 1 18 9a7.5 7.5 0 0 1 15 3.5C33 23 18 32 18 32z"
					fill={white ? '#FFFFFF' : 'url(#mv-logo-heart)'}
				/>
				<path
					className={'pulse'}
					d="M7 17h6l2.5-4 3.5 8 2.5-4H29"
					fill="none"
					stroke={white ? '#0B7A8A' : '#FFFFFF'}
					strokeWidth="2.4"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
			<span className={'word'}>
				Med<b>Via</b>
			</span>
		</Box>
	);

	return href ? (
		<Link href={href} aria-label={'MedVia'}>
			{mark}
		</Link>
	) : (
		mark
	);
};

export default Logo;
