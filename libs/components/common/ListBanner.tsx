import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface ListBannerProps {
	/** The breadcrumb's last item. */
	crumb: string;
	/** An optional middle item, e.g. My Page above "My Reviews". */
	parent?: { href: string; label: string };
	title: string;
	text?: string;
}

/** The teal band on top of the public lists, with the logo's heart beating faintly on the right. */
const ListBanner = (props: ListBannerProps) => {
	const { crumb, parent, title, text } = props;
	const { t } = useTranslation('common');

	return (
		<Stack className={'list-banner'}>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<ChevronRightRoundedIcon />
					{parent && (
						<>
							<Link href={parent.href}>{parent.label}</Link>
							<ChevronRightRoundedIcon />
						</>
					)}
					<span>{crumb}</span>
				</nav>
				<h1>{title}</h1>
				{text && <p>{text}</p>}
			</Stack>
		</Stack>
	);
};

export default ListBanner;
