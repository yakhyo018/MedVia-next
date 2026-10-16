import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Pagination, Skeleton, Switch } from '@mui/material';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_MY_ACCESS_LOGS } from '../../apollo/user/query';
import { SET_AI_CONSENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { AccessLog } from '../../libs/types/access-log/access-log';
import { AccessType } from '../../libs/enums/access-log.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { sweetConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** An audit log: page by page, so every entry stays reachable (a growing list stops at the API's 50). */
const PAGE_SIZE = 10;

/**
 * "Medical data & consent": the AI consent the patient can give or take back, and who opened their
 * questionnaire answers or its AI summary. The answers themselves live in each booking — the API
 * keeps no medical profile beyond them.
 */
const MedicalConsent: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const [page, setPage] = useState<number>(1);
	const isPatient = user.memberType === MemberType.USER;
	const agreed = Boolean(user.memberAiConsentAt);

	/** APOLLO REQUESTS **/
	const { data, previousData, loading } = useQuery(GET_MY_ACCESS_LOGS, {
		variables: { input: { page, limit: PAGE_SIZE } },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [setAiConsent, { loading: saving }] = useMutation(SET_AI_CONSENT);
	const logs: AccessLog[] = (data ?? previousData)?.getMyAccessLogs?.list ?? [];
	const total: number = (data ?? previousData)?.getMyAccessLogs?.metaCounter?.[0]?.total ?? 0;

	/** HANDLERS **/
	const consentHandler = async (next: boolean) => {
		try {
			if (!next) {
				const sure = await sweetConfirmAlert(
					t('Turn off AI? Chat messages will stay in the language they were written in.'),
					t('Turn off'),
				);
				if (!sure) return;
			}
			const result = await setAiConsent({ variables: { agreed: next } });
			const at = result.data?.setAiConsent?.memberAiConsentAt;
			userVar({ ...userVar(), memberAiConsentAt: at ? String(at) : '' });
			await sweetTopSmallSuccessAlert(next ? t('AI translation is on') : t('AI translation is off'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	let history: React.ReactNode;
	if (loading && logs.length === 0) {
		history = <Skeleton variant={'rounded'} height={200} />;
	} else if (logs.length === 0) {
		history = (
			<EmptyState
				title={t('Nobody has opened your data yet')}
				text={t('When a clinic or a doctor opens your answers for a booking, it is listed here.')}
			/>
		);
	} else {
		history = (
			<>
				<div className={'my-rows access-log'}>
					{logs.map((log) => (
						<div key={log._id} className={'access-row'}>
							<div className={'line'}>
								<strong>{log.readerName ?? (log.readerType === MemberType.DOCTOR ? t('Doctor') : t('Clinic'))}</strong>
								<time>{seoulTime(log.createdAt, router.locale)}</time>
							</div>
							<div className={'line tags'}>
								<span className={'kind'}>{log.readerType === MemberType.DOCTOR ? t('Doctor') : t('Clinic')}</span>
								<span className={`kind ${log.accessType === AccessType.AI_SUMMARY ? 'clinic' : 'answers'}`}>
									{log.accessType === AccessType.AI_SUMMARY ? t('AI summary') : t('Questionnaire answers')}
								</span>
								{log.bookingCode && <span className={'code'}>#{log.bookingCode}</span>}
							</div>
						</div>
					))}
				</div>
				{total > PAGE_SIZE && (
					<Pagination
						className={'pager'}
						count={Math.ceil(total / PAGE_SIZE)}
						page={page}
						onChange={(_, value) => setPage(value)}
						color={'primary'}
					/>
				)}
			</>
		);
	}

	return (
		<MyPageFrame
			title={t('Medical data & consent')}
			text={t(
				'Your questionnaire answers are shared only with the clinic of the booking you choose. Every time someone opens them, it is logged here.',
			)}
			className={'my-medical'}
		>
			<Box className={'card consent'}>
				<h2>{t('AI translation and summary')}</h2>
				<label className={'switch-row'}>
					<span className={'text'}>
						<strong>{t('Allow AI to translate chat and summarise my answers')}</strong>
						<span>
							{t('The doctor sees a short Korean summary plus your original answers.')}
							{agreed &&
								` ${t('Agreed on {{date}}.', { date: seoulTime(user.memberAiConsentAt, router.locale, false) })}`}
						</span>
					</span>
					<Switch checked={agreed} disabled={saving} onChange={(event) => consentHandler(event.target.checked)} />
				</label>
				<p className={'hint'}>
					{t('You can turn this off at any time. Chat messages will then stay in the language they were written in.')}
				</p>
			</Box>

			<Box className={'card info'}>
				<VerifiedUserOutlinedIcon />
				<p>
					<strong>{t('Booking consents')}</strong>{' '}
					{t('— sharing your answers and the booking terms — are given for each booking when you send the request.')}
				</p>
			</Box>

			<div className={'section-head'}>
				<h2>{t('Who opened my data')}</h2>
				<span>{t('Seoul time')}</span>
			</div>
			{history}
		</MyPageFrame>
	);
};

export default withLayoutBasic(MedicalConsent);
