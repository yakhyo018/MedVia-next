import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { Button, MenuItem, Skeleton, Switch, TextField } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import withLayoutAdmin from '../../../libs/components/layout/LayoutAdmin';
import AdminPills from '../../../libs/components/admin/AdminPills';
import AdminPager from '../../../libs/components/admin/AdminPager';
import EmptyState from '../../../libs/components/common/EmptyState';
import { CATEGORY_LABEL } from '../../../libs/components/cs/csLabels';
import useUrlQuery from '../../../libs/hooks/useUrlQuery';
import { GET_NOTICES_BY_ADMIN } from '../../../apollo/admin/query';
import { CREATE_NOTICE, REMOVE_NOTICE, UPDATE_NOTICE } from '../../../apollo/admin/mutation';
import { Notice, NoticeTranslation } from '../../../libs/types/cs/cs';
import { InquiryCategory, NoticeCategory, NoticeStatus } from '../../../libs/enums/cs.enum';
import { Language } from '../../../libs/enums/common.enum';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../../libs/sweetAlert';
import { T } from '../../../libs/types/common';
import { ADMIN_I18N, ADMIN_NS } from '../../../libs/components/admin/adminText';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

const LIMIT = 10;
const TITLE_MAX = 200;
const CONTENT_MAX = 10000;

/** English is the base text; the other four are translations written by hand. */
const TRANSLATED = [Language.RU, Language.UZ, Language.KK, Language.KO];

interface NoticeForm {
	noticeCategory: NoticeCategory;
	noticeFaqCategory: InquiryCategory;
	noticePinned: boolean;
	/** One text per language; EN is the base. */
	texts: Partial<Record<Language, { title: string; content: string }>>;
}

const DEFAULT_INPUT: NoticeForm = {
	noticeCategory: NoticeCategory.NOTICE,
	noticeFaqCategory: InquiryCategory.BOOKING,
	noticePinned: false,
	texts: {},
};

const formOf = (notice: Notice): NoticeForm => ({
	noticeCategory: notice.noticeCategory,
	noticeFaqCategory: notice.noticeFaqCategory ?? InquiryCategory.BOOKING,
	noticePinned: notice.noticePinned,
	texts: {
		[Language.EN]: { title: notice.noticeTitle, content: notice.noticeContent ?? '' },
		...Object.fromEntries(
			(notice.noticeTranslations ?? []).map((item) => [item.lang, { title: item.title, content: item.content }]),
		),
	},
});

/** A translation counts only when both its title and its text are written. */
const filled = (text?: { title: string; content: string }) =>
	Boolean(text && text.title.trim().length >= 2 && text.content.trim());

/** Notices and FAQ entries: a list on the left, the editor on the right (new, or `?id=`). */
const AdminNotices: NextPage = () => {
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const url = useUrlQuery();
	const [form, setForm] = useState<NoticeForm>(DEFAULT_INPUT);
	const [lang, setLang] = useState<Language>(Language.EN);
	const [error, setError] = useState<boolean>(false);
	const category = url.get('tab') === 'faq' ? NoticeCategory.FAQ : NoticeCategory.NOTICE;
	const selectedId = url.get('id');

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_NOTICES_BY_ADMIN, {
		variables: { input: { page: url.page, limit: LIMIT, noticeCategory: category } },
		fetchPolicy: 'cache-and-network',
		skip: !url.ready,
	});
	const { data: noticeCount } = useQuery(GET_NOTICES_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, noticeCategory: NoticeCategory.NOTICE } },
		fetchPolicy: 'cache-and-network',
	});
	const { data: faqCount } = useQuery(GET_NOTICES_BY_ADMIN, {
		variables: { input: { page: 1, limit: 1, noticeCategory: NoticeCategory.FAQ } },
		fetchPolicy: 'cache-and-network',
	});
	const [createNotice, { loading: creating }] = useMutation(CREATE_NOTICE);
	const [updateNotice, { loading: updating }] = useMutation(UPDATE_NOTICE);
	const [removeNotice] = useMutation(REMOVE_NOTICE);
	const notices: Notice[] = (data?.getNoticesByAdmin?.list ?? []).filter(
		(notice: Notice) => notice.noticeStatus !== NoticeStatus.DELETE,
	);
	const total: number = data?.getNoticesByAdmin?.metaCounter?.[0]?.total ?? 0;
	const selected = notices.find((notice) => notice._id === selectedId);
	const base = form.texts[Language.EN] ?? { title: '', content: '' };
	const current = form.texts[lang] ?? { title: '', content: '' };
	const busy = creating || updating;

	/** LIFECYCLES **/
	useEffect(() => {
		// Picking a row fills the editor; "New" (no id) empties it for the current tab.
		setForm(selected ? formOf(selected) : { ...DEFAULT_INPUT, noticeCategory: category });
		setLang(Language.EN);
		setError(false);
	}, [selected?._id, category]); // eslint-disable-line react-hooks/exhaustive-deps

	/** HANDLERS **/
	const textHandler = (field: 'title' | 'content', value: string) => {
		setForm({ ...form, texts: { ...form.texts, [lang]: { ...current, [field]: value } } });
		setError(false);
	};

	const saveHandler = async (noticeStatus: NoticeStatus) => {
		if (!filled(base)) {
			setLang(Language.EN);
			setError(true);
			return;
		}
		const noticeTranslations: NoticeTranslation[] = TRANSLATED.filter((code) => filled(form.texts[code])).map(
			(code) => ({
				lang: code,
				title: (form.texts[code]?.title ?? '').trim(),
				content: (form.texts[code]?.content ?? '').trim(),
			}),
		);
		const common = {
			noticePinned: form.noticeCategory === NoticeCategory.NOTICE ? form.noticePinned : false,
			noticeTitle: base.title.trim(),
			noticeContent: base.content.trim(),
			noticeTranslations,
			noticeStatus,
		};
		try {
			if (selected) {
				await updateNotice({ variables: { input: { noticeId: selected._id, ...common } } });
			} else {
				const { data: created } = await createNotice({
					variables: {
						input: {
							noticeCategory: form.noticeCategory,
							...(form.noticeCategory === NoticeCategory.FAQ ? { noticeFaqCategory: form.noticeFaqCategory } : {}),
							...common,
						},
					},
				});
				await url.set({ tab: url.get('tab'), id: created?.createNotice?._id });
			}
			await refetch();
			await sweetTopSmallSuccessAlert(noticeStatus === NoticeStatus.ACTIVE ? t('Published') : t('Draft saved'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const removeHandler = async () => {
		if (!selected) return;
		const sure = await sweetDangerConfirmAlert(
			t('Remove “{{title}}”? Readers stop seeing it.', { title: selected.noticeTitle }),
			t('Remove'),
		);
		if (!sure) return;
		try {
			await removeNotice({ variables: { noticeId: selected._id } });
			await url.set({ tab: url.get('tab'), id: undefined });
			await refetch();
			await sweetTopSmallSuccessAlert(t('Removed'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const langLabel = (value: Language) => (value === Language.EN ? `EN (${t('base')})` : value);

	const languagesOf = (notice: Notice) =>
		['EN', ...(notice.noticeTranslations ?? []).map((item) => item.lang)].join(' ');

	return (
		<div id={'admin-notices'}>
			<AdminPills
				pills={[
					{ key: 'notice', label: t('Notices'), count: noticeCount?.getNoticesByAdmin?.metaCounter?.[0]?.total },
					{ key: 'faq', label: t('FAQ'), count: faqCount?.getNoticesByAdmin?.metaCounter?.[0]?.total },
				]}
				active={category === NoticeCategory.FAQ ? 'faq' : 'notice'}
				onChange={(key) => url.set({ tab: key === 'notice' ? undefined : key })}
				end={
					<Button
						variant={'contained'}
						endIcon={<AddRoundedIcon />}
						onClick={() => url.set({ tab: url.get('tab'), id: undefined })}
					>
						{category === NoticeCategory.FAQ ? t('New FAQ') : t('New notice')}
					</Button>
				}
			/>
			<div className={'admin-grid notices'}>
				<div className={'admin-table-card'}>
					{loading && !data ? (
						<Skeleton variant={'rectangular'} height={360} />
					) : notices.length === 0 ? (
						<EmptyState title={t('Nothing here yet.')} />
					) : (
						<div className={'admin-table-scroll'}>
							<table className={'admin-table clickable'}>
								<thead>
									<tr>
										<th>{t('Type')}</th>
										<th>{t('Title')}</th>
										<th>{t('Languages')}</th>
										<th>{t('Status')}</th>
										<th>{t('Views')}</th>
									</tr>
								</thead>
								<tbody>
									{notices.map((notice) => (
										<tr
											key={notice._id}
											className={notice._id === selectedId ? 'selected' : ''}
											onClick={() => url.set({ tab: url.get('tab'), id: notice._id, page: url.page })}
										>
											<td>
												{notice.noticeCategory === NoticeCategory.FAQ ? (
													t(CATEGORY_LABEL[notice.noticeFaqCategory ?? InquiryCategory.BOOKING])
												) : notice.noticePinned ? (
													<span className={'admin-badge danger'}>{t('Important')}</span>
												) : (
													t('Notice')
												)}
											</td>
											<td className={'strong wide'}>{notice.noticeTitle}</td>
											<td>{languagesOf(notice)}</td>
											<td>
												<span
													className={`admin-badge ${notice.noticeStatus === NoticeStatus.ACTIVE ? 'success' : 'neutral'}`}
												>
													{notice.noticeStatus === NoticeStatus.ACTIVE ? t('Published') : t('Draft')}
												</span>
											</td>
											<td>
												{notice.noticeStatus === NoticeStatus.ACTIVE ? notice.noticeViews.toLocaleString('en-US') : '—'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
					{total > 0 && (
						<AdminPager
							page={url.page}
							limit={LIMIT}
							total={total}
							shown={notices.length}
							onChange={(page) => url.set({ tab: url.get('tab'), page })}
						/>
					)}
				</div>

				<section className={'admin-card admin-editor'}>
					<h2>
						{selected
							? form.noticeCategory === NoticeCategory.FAQ
								? t('Edit FAQ')
								: t('Edit notice')
							: category === NoticeCategory.FAQ
								? t('New FAQ')
								: t('New notice')}
					</h2>
					<div className={'row'}>
						<TextField
							select
							label={t('Type')}
							value={form.noticeCategory}
							disabled={Boolean(selected)}
							onChange={(event) => setForm({ ...form, noticeCategory: event.target.value as NoticeCategory })}
						>
							<MenuItem value={NoticeCategory.NOTICE}>{t('Notice')}</MenuItem>
							<MenuItem value={NoticeCategory.FAQ}>{t('FAQ')}</MenuItem>
						</TextField>
						{form.noticeCategory === NoticeCategory.FAQ ? (
							<TextField
								select
								label={t('Topic')}
								value={form.noticeFaqCategory}
								disabled={Boolean(selected)}
								onChange={(event) => setForm({ ...form, noticeFaqCategory: event.target.value as InquiryCategory })}
							>
								{Object.values(InquiryCategory).map((item) => (
									<MenuItem key={item} value={item}>
										{t(CATEGORY_LABEL[item])}
									</MenuItem>
								))}
							</TextField>
						) : (
							<TextField
								label={t('Status')}
								value={selected?.noticeStatus === NoticeStatus.ACTIVE ? t('Published') : t('Draft')}
								disabled
							/>
						)}
					</div>
					<span className={'label'}>{t('Translations')}</span>
					<div className={'admin-lang-chips'}>
						{[Language.EN, ...TRANSLATED].map((code) => {
							const done = filled(form.texts[code]);
							return (
								<button
									key={code}
									type={'button'}
									className={`${done ? 'done' : ''} ${code === lang ? 'active' : ''}`}
									aria-pressed={code === lang}
									onClick={() => setLang(code)}
								>
									{code}
									{!done && ` · ${t('missing')}`}
								</button>
							);
						})}
					</div>
					<TextField
						label={`${t('Title')} · ${langLabel(lang)}`}
						value={current.title}
						error={error && lang === Language.EN && current.title.trim().length < 2}
						inputProps={{ maxLength: TITLE_MAX }}
						onChange={(event) => textHandler('title', event.target.value)}
					/>
					<TextField
						label={`${t('Text')} · ${langLabel(lang)}`}
						value={current.content}
						multiline
						minRows={5}
						error={error && lang === Language.EN && !current.content.trim()}
						helperText={
							error && lang === Language.EN
								? t('The English title and text are required.')
								: lang === Language.EN
									? undefined
									: t('Leave empty to show the English text.')
						}
						inputProps={{ maxLength: CONTENT_MAX }}
						onChange={(event) => textHandler('content', event.target.value)}
					/>
					{form.noticeCategory === NoticeCategory.NOTICE && (
						<label className={'admin-switch'}>
							<span>
								<strong>{t('Pin to top')}</strong>
								<span>{t('Shown first in Help center · Notices')}</span>
							</span>
							<Switch
								checked={form.noticePinned}
								onChange={(event) => setForm({ ...form, noticePinned: event.target.checked })}
							/>
						</label>
					)}
					<div className={'buttons'}>
						<Button variant={'outlined'} disabled={busy} onClick={() => saveHandler(NoticeStatus.HOLD)}>
							{selected?.noticeStatus === NoticeStatus.ACTIVE ? t('Unpublish') : t('Save draft')}
						</Button>
						<Button variant={'contained'} disabled={busy} onClick={() => saveHandler(NoticeStatus.ACTIVE)}>
							{selected?.noticeStatus === NoticeStatus.ACTIVE ? t('Save') : t('Publish')}
						</Button>
					</div>
					{selected && (
						<button type={'button'} className={'admin-text-danger'} onClick={removeHandler}>
							{t('Remove')}
						</button>
					)}
				</section>
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminNotices);
