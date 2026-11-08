import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

/** Points the drawing "scans" — a stylised face, never a photo of a real person. */
const DOTS: [number, number][] = [
	[100, 62],
	[78, 70],
	[122, 70],
	[72, 98],
	[128, 98],
	[100, 112],
	[86, 140],
	[114, 140],
	[100, 150],
	[66, 126],
	[134, 126],
	[100, 176],
];

/**
 * The landing's face scan band: a drawn face being scanned, three steps, what happens to the
 * photo, and a link to the scan (MyPage asks a guest to log in first). Marketing copy only —
 * the scan itself needs an account and the AI consent.
 */
const FaceScanBand = () => {
	const { t } = useTranslation('common');

	return (
		<section className={'face-band'} aria-labelledby={'face-band-title'}>
			<div className={'container'}>
				<div className={'face-box'}>
					<div className={'visual'} aria-hidden={'true'}>
						<svg viewBox={'0 0 200 220'} className={'face-drawing'}>
							<ellipse cx={'100'} cy={'112'} rx={'64'} ry={'84'} className={'outline'} />
							<path d={'M70 92 Q78 86 86 92'} className={'feature'} />
							<path d={'M114 92 Q122 86 130 92'} className={'feature'} />
							<path d={'M100 100 L96 128 Q100 132 104 128'} className={'feature'} />
							<path d={'M84 152 Q100 162 116 152'} className={'feature'} />
							{DOTS.map(([x, y], index) => (
								<circle
									key={index}
									cx={x}
									cy={y}
									r={'2.6'}
									className={'dot'}
									style={{ animationDelay: `${index * 120}ms` }}
								/>
							))}
							<rect x={'30'} y={'24'} width={'140'} height={'3'} rx={'1.5'} className={'scan-line'} />
						</svg>
						<span className={'tag one'}>{t('faceConcern.PIGMENTATION')}</span>
						<span className={'tag two'}>{t('faceConcern.ENLARGED_PORES')}</span>
					</div>
					<div className={'copy'}>
						<span className={'eyebrow'}>{t('Face scan')}</span>
						<h2 id={'face-band-title'}>{t('Not sure which treatment you need?')}</h2>
						<p>{t('Take one photo. AI reads your skin and shows the Seoul clinics that treat it.')}</p>
						<ol className={'steps'}>
							<li>
								<PhotoCameraOutlinedIcon />
								<span>{t('Take a photo — the camera guides you')}</span>
							</li>
							<li>
								<ManageSearchRoundedIcon />
								<span>{t('AI reads the skin: acne, redness, pigmentation…')}</span>
							</li>
							<li>
								<LocalHospitalOutlinedIcon />
								<span>{t('See the clinics that treat it')}</span>
							</li>
						</ol>
						<p className={'privacy'}>
							<LockOutlinedIcon />
							{t('The photo is not stored. A cosmetic reading, not a diagnosis.')}
						</p>
						<Link href={'/mypage/face-scan'} className={'cta-btn'}>
							{t('Scan my face')}
							<ArrowForwardRoundedIcon />
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};

export default FaceScanBand;
