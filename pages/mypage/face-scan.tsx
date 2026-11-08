import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, CircularProgress, Skeleton } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MyPageFrame from '../../libs/components/mypage/MyPageFrame';
import FaceCamera from '../../libs/components/face-scan/FaceCamera';
import FaceScanResult from '../../libs/components/face-scan/FaceScanResult';
import useFaceScan from '../../libs/hooks/useFaceScan';
import { GET_MY_FACE_SCANS } from '../../apollo/user/query';
import { DELETE_FACE_SCAN, SET_AI_CONSENT } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { FaceScan } from '../../libs/types/face-scan/face-scan';
import { FaceScanStatus } from '../../libs/enums/face-scan.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { sweetDangerConfirmAlert, sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { seoulTime } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

/** The API returns at most this many per page; five scans a day keeps the list short. */
const HISTORY_INPUT = { page: 1, limit: 10 };

/**
 * "Face scan": a photo of the face → a cosmetic reading of the skin and the clinics that treat it.
 * The AI consent comes first (a face photo is health data). The photo is not stored anywhere;
 * only the reading is, and the patient can delete it.
 */
const FaceScanPage: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const isPatient = user.memberType === MemberType.USER;
	const consented = Boolean(user.memberAiConsentAt);
	const [result, setResult] = useState<FaceScan | null>(null);
	const [preview, setPreview] = useState<string>('');
	const { scan, scanning } = useFaceScan();

	/** APOLLO REQUESTS **/
	const { data, loading, refetch } = useQuery(GET_MY_FACE_SCANS, {
		variables: { input: HISTORY_INPUT },
		fetchPolicy: 'cache-and-network',
		skip: !isPatient,
	});
	const [setAiConsent, { loading: consenting }] = useMutation(SET_AI_CONSENT);
	const [deleteFaceScan] = useMutation(DELETE_FACE_SCAN);
	const history: FaceScan[] = (data?.getMyFaceScans?.list ?? []).filter(
		(item: FaceScan) => item.faceScanStatus === FaceScanStatus.DONE && item._id !== result?._id,
	);

	/** LIFECYCLES **/
	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	/** HANDLERS **/
	const consentHandler = async () => {
		try {
			const response = await setAiConsent({ variables: { agreed: true } });
			const at = response.data?.setAiConsent?.memberAiConsentAt;
			userVar({ ...userVar(), memberAiConsentAt: at ? String(at) : new Date().toISOString() });
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const photoHandler = async (photo: Blob, url: string) => {
		setPreview(url);
		try {
			const reading = await scan(photo);
			setResult(reading);
			await refetch();
		} catch (err) {
			setPreview('');
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	const retakeHandler = () => {
		setResult(null);
		setPreview('');
	};

	const deleteHandler = async (scanId: string) => {
		try {
			if (!(await sweetDangerConfirmAlert(t('Delete this reading?'), t('Delete')))) return;
			await deleteFaceScan({ variables: { scanId } });
			if (result?._id === scanId) retakeHandler();
			await refetch();
			await sweetTopSmallSuccessAlert(t('Deleted'));
		} catch (err) {
			await sweetMixinErrorAlert(t((err as Error).message));
		}
	};

	let main: React.ReactNode;
	if (!consented) {
		main = (
			<Box className={'card face-consent'}>
				<LockOutlinedIcon />
				<h2>{t('Allow AI to read your photo')}</h2>
				<p>
					{t(
						'A face photo is health data. An AI model reads it once and the photo is not stored — only the reading, which you can delete.',
					)}
				</p>
				<Button variant={'contained'} onClick={consentHandler} disabled={consenting}>
					{t('I agree')}
				</Button>
			</Box>
		);
	} else if (scanning) {
		main = (
			<Box className={'card face-wait'}>
				{preview && <img className={'photo'} src={preview} alt={''} />}
				<CircularProgress />
				<p>{t('Reading your photo…')}</p>
			</Box>
		);
	} else if (result) {
		main = <FaceScanResult scan={result} preview={preview} onRetake={retakeHandler} />;
	} else {
		main = (
			<Box className={'card face-take'}>
				<FaceCamera onPhoto={photoHandler} disabled={scanning} />
			</Box>
		);
	}

	return (
		<MyPageFrame
			title={t('Face scan')}
			text={t('Not sure which treatment you need? A photo of your face shows what a clinic can help with.')}
			className={'my-face-scan'}
		>
			{main}
			<section className={'face-history'}>
				<h2>{t('Earlier readings')}</h2>
				{loading && !data ? (
					<Skeleton variant={'rounded'} height={96} />
				) : history.length === 0 ? (
					<p className={'empty'}>{t('No earlier readings.')}</p>
				) : (
					history.map((item) => (
						<div key={item._id} className={'history-row'}>
							<div className={'text'}>
								<time>{seoulTime(item.createdAt, router.locale)}</time>
								<span>
									{item.findings.length
										? item.findings.map((finding) => t(`faceConcern.${finding.concern}`)).join(' · ')
										: item.qualityIssues.length
											? t('The photo could not be read')
											: t('Nothing stood out')}
								</span>
							</div>
							<button
								type={'button'}
								className={'delete'}
								aria-label={t('Delete')}
								onClick={() => deleteHandler(item._id)}
							>
								<DeleteOutlineRoundedIcon />
							</button>
						</div>
					))
				)}
			</section>
		</MyPageFrame>
	);
};

export default withLayoutBasic(FaceScanPage);
