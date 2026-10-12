import { ReactNode } from 'react';
import Link from 'next/link';
import { Box, Stack } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

interface HomeSectionProps {
	id: string;
	title: string;
	text: string;
	link: { href: string; label: string };
	/** Alternate the background so the sections read as bands. */
	tone?: 'white' | 'tint';
	children: ReactNode;
}

/** One band of the landing page: a heading with a "See all" link, then its cards. */
const HomeSection = (props: HomeSectionProps) => {
	const { id, title, text, link, tone = 'white', children } = props;

	return (
		<Stack className={`home-section ${tone}`} component={'section'} aria-labelledby={`${id}-title`}>
			<Stack className={'container'}>
				<Box className={'section-head'}>
					<div>
						<h2 id={`${id}-title`}>{title}</h2>
						<p>{text}</p>
					</div>
					<Link href={link.href} className={'see-all'}>
						{link.label}
						<ArrowForwardRoundedIcon />
					</Link>
				</Box>
				{children}
			</Stack>
		</Stack>
	);
};

export default HomeSection;
