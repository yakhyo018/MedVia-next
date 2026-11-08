import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Box } from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import { FaceScan } from '../../types/face-scan/face-scan';
import { FaceScanStatus, SkinConcern } from '../../enums/face-scan.enum';
import { seoulTime } from '../../utils';

interface FaceScanResultProps {
	scan: FaceScan;
	/** The photo just taken (not stored anywhere): shown beside a fresh result only. */
	preview?: string;
	onRetake?: () => void;
}

/**
 * One reading: what was seen, where and how strongly, the summary in the patient's language,
 * the disclaimer (always), and the way on — clinics of the suggested specialty.
 */
const FaceScanResult = (props: FaceScanResultProps) => {
	const { scan, preview, onRetake } = props;
	const { t } = useTranslation('common');
	const router = useRouter();
	const unreadable = scan.qualityIssues.length > 0;
	const failed = scan.faceScanStatus === FaceScanStatus.FAILED;

	let body;
	if (failed) {
		body = <p className={'lead'}>{t('The photo could not be read right now. Please try again in a few minutes.')}</p>;
	} else if (unreadable) {
		body = (
			<>
				<p className={'lead'}>{t('The photo could not be read. Please take it again:')}</p>
				<ul className={'issues'}>
					{scan.qualityIssues.map((issue) => (
						<li key={issue}>{t(`faceIssue.${issue}`)}</li>
					))}
				</ul>
			</>
		);
	} else if (scan.findings.length === 0) {
		body = <p className={'lead'}>{t('Nothing stood out in this photo.')}</p>;
	} else {
		body = (
			<ul className={'findings'}>
				{scan.findings.map((finding, index) => (
					<li key={index} className={finding.concern === SkinConcern.SEE_DOCTOR ? 'doctor' : ''}>
						<strong>{t(`faceConcern.${finding.concern}`)}</strong>
						<span className={`level ${finding.severity.toLowerCase()}`}>{t(`faceSeverity.${finding.severity}`)}</span>
						<span className={'zone'}>{t(`faceZone.${finding.zone}`)}</span>
					</li>
				))}
			</ul>
		);
	}

	return (
		<Box className={'card face-result'}>
			{preview && <img className={'photo'} src={preview} alt={t('The photo you took')} />}
			<div className={'content'}>
				<div className={'head'}>
					<h2>{t('Your skin reading')}</h2>
					<time>{seoulTime(scan.createdAt, router.locale)}</time>
				</div>
				{body}
				{!failed && !unreadable && scan.faceScanSummary && <p className={'summary'}>{scan.faceScanSummary}</p>}
				<p className={'disclaimer'}>
					<InfoOutlinedIcon />
					{t('This is an AI reading of a photo, not a medical diagnosis. A doctor at the clinic confirms it.')}
				</p>
				<div className={'actions'}>
					{scan.suggestedSpecialty && (
						<Link className={'go'} href={`/clinics?specialty=${scan.suggestedSpecialty}`}>
							{t('See {{specialty}} clinics', { specialty: t(`specialty.${scan.suggestedSpecialty}`) })}
							<ArrowForwardRoundedIcon />
						</Link>
					)}
					{onRetake && (
						<button type={'button'} className={'retake'} onClick={onRetake}>
							<ReplayRoundedIcon />
							{t('Take another photo')}
						</button>
					)}
				</div>
			</div>
		</Box>
	);
};

export default FaceScanResult;
