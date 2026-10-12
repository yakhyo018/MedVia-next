import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { Stack } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

interface ListBannerProps {
	/** The breadcrumb's last item. */
	crumb: string;
	title: string;
	text: string;
}

/** The teal band on top of the public lists, with the logo's heart beating faintly on the right. */
const ListBanner = (props: ListBannerProps) => {
	const { crumb, title, text } = props;
	const { t } = useTranslation('common');

	return (
		<Stack className={'list-banner'}>
			<Stack className={'container'}>
				<nav className={'crumbs'} aria-label={t('Breadcrumb')}>
					<Link href={'/'}>{t('Home')}</Link>
					<ChevronRightRoundedIcon />
					<span>{crumb}</span>
				</nav>
				<h1>{title}</h1>
				<p>{text}</p>
			</Stack>
		</Stack>
	);
};

export default ListBanner;
