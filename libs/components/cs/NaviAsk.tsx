import { FormEvent, Fragment, ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useLazyQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, CircularProgress, TextField } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ASK_NAVI } from '../../../apollo/user/query';
import { userVar } from '../../../apollo/store';
import { NaviAnswer, NaviSource } from '../../types/navi/navi';
import { sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../../sweetAlert';

/** Questions a patient can click instead of typing — each one is answered by MedVia's guides. */
const EXAMPLES = [
	'How far ahead can I book a treatment?',
	'How long does the clinic have to confirm my booking?',
	'What should I bring on the day of my visit?',
];

/** "…60 days ahead [1]." → the text with every [n] as a small badge pointing at source n. */
const withCitations = (answer: string): ReactNode[] =>
	answer.split(/(\[\d+\])/g).map((part, index) => {
		const match = part.match(/^\[(\d+)\]$/);
		return match ? (
			<sup key={index} className={'cite'}>
				{match[1]}
			</sup>
		) : (
			<Fragment key={index}>{part}</Fragment>
		);
	});

/**
 * "Ask MedVia Navi": a question in any of the site's languages → an answer from MedVia's own
 * content (guides, FAQ, clinics, treatments), with the sources it used. Navi refuses what the
 * content does not hold. Signed-in members only — MedVia limits each member per minute.
 */
const NaviAsk = () => {
	const { t } = useTranslation('common');
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const [question, setQuestion] = useState<string>('');
	const [result, setResult] = useState<NaviAnswer | null>(null);

	/** APOLLO REQUESTS **/
	const [askNavi, { loading }] = useLazyQuery(ASK_NAVI, { fetchPolicy: 'no-cache' });

	/** HANDLERS **/
	const askHandler = async (text: string) => {
		const value = text.trim();
		if (value.length < 2) return;
		if (!user._id) {
			if (await sweetLoginConfirmAlert(t('Log in to ask MedVia Navi'))) await router.push('/account/join');
			return;
		}
		setQuestion(value);
		setResult(null);
		const response = await askNavi({ variables: { input: { question: value } } });
		if (response.error) {
			await sweetMixinErrorAlert(t(response.error.message));
			return;
		}
		setResult(response.data?.askNavi ?? null);
	};

	const submitHandler = (event: FormEvent) => {
		event.preventDefault();
		askHandler(question);
	};

	const sources: NaviSource[] = result
		? [...result.sources].sort((a, b) => Number(b.cited) - Number(a.cited) || a.index - b.index)
		: [];

	return (
		<Box className={'card navi-ask'}>
			<div className={'head'}>
				<span className={'mark'}>
					<AutoAwesomeRoundedIcon />
				</span>
				<div>
					<h2>{t('Ask MedVia Navi')}</h2>
					<p>{t('Answers from MedVia’s own guides, FAQ and clinic pages — with the sources.')}</p>
				</div>
			</div>
			<form className={'ask'} onSubmit={submitHandler}>
				<TextField
					value={question}
					onChange={(event) => setQuestion(event.target.value)}
					placeholder={t('Ask in your language…')}
					inputProps={{ maxLength: 500, 'aria-label': t('Your question') }}
					size={'small'}
					fullWidth
				/>
				<Button type={'submit'} variant={'contained'} disabled={loading || question.trim().length < 2}>
					{loading ? <CircularProgress size={18} color={'inherit'} /> : t('Ask')}
				</Button>
			</form>
			{!result && !loading && (
				<div className={'examples'}>
					{EXAMPLES.map((example) => (
						<button key={example} type={'button'} onClick={() => askHandler(t(example))}>
							{t(example)}
						</button>
					))}
				</div>
			)}
			{loading && <p className={'thinking'}>{t('Navi is reading MedVia’s content…')}</p>}
			{result && (
				<div className={`answer ${result.refused ? 'refused' : ''}`} aria-live={'polite'}>
					<p className={'text'}>{withCitations(result.answer)}</p>
					{result.refused ? (
						<p className={'next'}>
							{t('Try the questions below, or send a 1:1 inquiry — a person answers it.')}
						</p>
					) : (
						sources.length > 0 && (
							<div className={'sources'}>
								<small>{t('Sources')}</small>
								{sources.map((source) => {
									const label = (
										<>
											<b>{source.index}</b>
											<span>{source.heading || source.title}</span>
											{source.url && <NorthEastRoundedIcon />}
										</>
									);
									const className = `source ${source.cited ? 'cited' : ''}`;
									return source.url ? (
										<Link key={source.index} href={source.url} className={className}>
											{label}
										</Link>
									) : (
										<span key={source.index} className={className}>
											{label}
										</span>
									);
								})}
							</div>
						)
					)}
					<p className={'disclaimer'}>
						<InfoOutlinedIcon />
						{t('Answers come from MedVia’s own content and may be incomplete. This is not medical advice.')}
					</p>
				</div>
			)}
		</Box>
	);
};

export default NaviAsk;
