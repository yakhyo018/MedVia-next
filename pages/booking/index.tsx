import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, CircularProgress, Skeleton, Stack } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import EmptyState from '../../libs/components/common/EmptyState';
import BookingSummary from '../../libs/components/booking/BookingSummary';
import QuestionnaireStep from '../../libs/components/booking/QuestionnaireStep';
import ReviewStep from '../../libs/components/booking/ReviewStep';
import SentStep from '../../libs/components/booking/SentStep';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import { GET_CLINIC, GET_CLINIC_TREATMENTS, GET_DOCTOR } from '../../apollo/user/query';
import { CREATE_BOOKING } from '../../apollo/user/mutation';
import { sessionReadyVar, userVar } from '../../apollo/store';
import { Clinic } from '../../libs/types/clinic/clinic';
import { Treatment } from '../../libs/types/treatment/treatment';
import { Booking, BookingCreateInput } from '../../libs/types/booking/booking';
import { BookingConsentType } from '../../libs/enums/booking.enum';
import { Language } from '../../libs/enums/common.enum';
import { Specialty } from '../../libs/enums/clinic.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { QUESTIONS } from '../../libs/questionnaire';
import { ClientMessages, LANGUAGES, Messages, localeToLanguage } from '../../libs/config';
import { sweetErrorAlert, sweetLoginConfirmAlert, sweetMixinErrorAlert } from '../../libs/sweetAlert';
import { isObjectId } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type Step = 'questionnaire' | 'review' | 'sent';

const DEFAULT_CONSENTS: Record<BookingConsentType, boolean> = {
	[BookingConsentType.SHARE_DATA]: false,
	[BookingConsentType.BOOKING_TERMS]: false,
	[BookingConsentType.AI_SUMMARY]: false,
};

/** Errors after which this hold is gone: back to the clinic page to pick a time again. */
const LOST_HOLD: string[] = [Messages.HOLD_EXPIRED, Messages.SLOT_NOT_AVAILABLE, Messages.SLOT_TOO_SOON];

const isoDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value));

/**
 * Steps 2–4 of a booking, after the clinic page held the time (`holdSlots`). The URL carries
 * only what was held (ids, start, hold end, interpreter); the medical answers live in memory
 * and are lost on reload on purpose — they never touch the URL or localStorage.
 */
const BookingPage: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const [step, setStep] = useState<Step>('questionnaire');
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [consents, setConsents] = useState<Record<BookingConsentType, boolean>>(DEFAULT_CONSENTS);
	const [showErrors, setShowErrors] = useState<boolean>(false);
	const [sending, setSending] = useState<boolean>(false);
	const [booking, setBooking] = useState<Booking | null>(null);

	const { clinic: clinicId, treatment: treatmentId, doctor: doctorId, start, until, interpreter } = router.query;
	const validQuery =
		isObjectId(clinicId) && isObjectId(treatmentId) && isObjectId(doctorId) && isoDate(start) && isoDate(until);
	const interpreterLang = LANGUAGES.find((lang) => lang.code === interpreter)?.code;
	const clinicHref = `/clinics/detail?id=${typeof clinicId === 'string' ? clinicId : ''}`;

	/** APOLLO REQUESTS **/
	const [createBooking] = useMutation(CREATE_BOOKING);
	const { data: clinicData, error: clinicError } = useQuery(GET_CLINIC, {
		variables: { clinicId },
		skip: !validQuery,
	});
	const { data: treatmentsData } = useQuery(GET_CLINIC_TREATMENTS, {
		variables: { input: { clinicId } },
		skip: !validQuery,
	});
	const { data: doctorData } = useQuery(GET_DOCTOR, { variables: { doctorId }, skip: !validQuery });
	const clinic: Clinic | undefined = clinicData?.getClinic;
	const treatment: Treatment | undefined = (treatmentsData?.getClinicTreatments ?? []).find(
		(item: Treatment) => item._id === treatmentId,
	);
	const doctorName: string = doctorData?.getDoctor?.doctorName ?? '';
	const questions = QUESTIONS[clinic?.clinicSpecialty ?? Specialty.DERMATOLOGY];

	/** LIFECYCLES **/
	useEffect(() => {
		// Booking is for signed-in patients; a guest (e.g. a reload after logout) is sent to log in.
		if (!sessionReady || user._id) return;
		sweetLoginConfirmAlert(ClientMessages.LOGIN_REQUIRED).then((login) =>
			router.replace(login ? { pathname: '/account/join', query: { referrer: clinicHref } } : clinicHref),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionReady, user._id]);

	/** HANDLERS **/
	const holdExpiredHandler = async () => {
		if (step === 'sent') return;
		await sweetErrorAlert(Messages.HOLD_EXPIRED);
		await router.replace(clinicHref);
	};

	const answerHandler = (id: string, value: string) => setAnswers((prev) => ({ ...prev, [id]: value }));

	const continueHandler = () => {
		const missing = questions.some((question) => question.required && !(answers[question.id] ?? '').trim());
		if (missing) {
			setShowErrors(true);
			sweetMixinErrorAlert(ClientMessages.FILL_ALL_INPUTS);
			return;
		}
		setShowErrors(false);
		setStep('review');
		window.scrollTo({ top: 0 });
	};

	const sendHandler = async () => {
		try {
			if (!consents[BookingConsentType.SHARE_DATA] || !consents[BookingConsentType.BOOKING_TERMS]) {
				setShowErrors(true);
				throw new Error(Messages.CONSENT_REQUIRED);
			}
			if (user.memberType !== MemberType.USER) throw new Error(ClientMessages.PATIENTS_ONLY);
			setSending(true);
			const siteLang: Language = localeToLanguage(router.locale);
			const input: BookingCreateInput = {
				treatmentId: treatmentId as string,
				doctorId: doctorId as string,
				slotStart: new Date(start as string),
				bookingLang: siteLang,
				...(interpreterLang && { bookingInterpreter: interpreterLang }),
				questionnaire: {
					// The question in English for the clinic; the answer as the patient wrote it.
					answers: questions
						.filter((question) => (answers[question.id] ?? '').trim())
						.map((question) => ({ question: question.text, answer: answers[question.id].trim() })),
					originalLang: siteLang,
				},
				consents: Object.values(BookingConsentType).map((consentType) => ({
					consentType,
					agreed: consents[consentType],
				})),
			};
			const result = await createBooking({ variables: { input } });
			setBooking(result.data.createBooking);
			setStep('sent');
			window.scrollTo({ top: 0 });
		} catch (err) {
			const message = (err as Error).message;
			if (LOST_HOLD.includes(message)) {
				await sweetErrorAlert(message);
				await router.replace(clinicHref);
				return;
			}
			await sweetMixinErrorAlert(message);
		} finally {
			setSending(false);
		}
	};

	if (router.isReady && (!validQuery || clinicError)) {
		return (
			<Stack className={'booking-page'}>
				<Stack className={'container'}>
					<EmptyState
						title={t('This booking link is not valid')}
						text={t('Pick a time on the clinic page to start a booking.')}
						action={
							<Button variant={'contained'} LinkComponent={Link} href={'/clinics'}>
								{t('All clinics')}
							</Button>
						}
					/>
				</Stack>
			</Stack>
		);
	}

	if (!clinic || !treatment || !doctorName) {
		return (
			<Stack className={'booking-page'}>
				<Stack className={'container'}>
					<Skeleton variant={'rounded'} height={60} />
					<Box className={'detail-grid'}>
						<Skeleton variant={'rounded'} height={520} />
						<Skeleton variant={'rounded'} height={360} />
					</Box>
				</Stack>
			</Stack>
		);
	}

	const stepIndex = { questionnaire: 2, review: 3, sent: 4 }[step];
	const steps = [t('Date & time'), t('Questionnaire'), t('Review & consent'), t('Request sent')];
	const summary = (
		<BookingSummary
			clinic={clinic}
			treatment={treatment}
			doctorName={doctorName}
			slotStart={start as string}
			interpreter={interpreterLang}
			holdUntil={step === 'sent' ? undefined : (until as string)}
			onExpire={holdExpiredHandler}
			status={step === 'sent' ? t('Waiting for clinic confirmation') : undefined}
		/>
	);

	return (
		<Stack className={'booking-page'}>
			<Stack className={'container'}>
				<ol className={'booking-steps'} aria-label={t('Booking steps')}>
					{steps.map((label, index) => {
						const number = index + 1;
						const state = number < stepIndex ? 'done' : number === stepIndex ? 'current' : '';
						return (
							<li key={label} className={state} aria-current={state === 'current' ? 'step' : undefined}>
								<span className={'dot'}>{number < stepIndex ? <CheckRoundedIcon /> : number}</span>
								<span className={'label'}>{label}</span>
							</li>
						);
					})}
				</ol>

				<Box className={'detail-grid'}>
					<Stack className={'main'}>
						{device === 'mobile' && summary}
						{step === 'questionnaire' && (
							<QuestionnaireStep
								questions={questions}
								answers={answers}
								showErrors={showErrors}
								onChange={answerHandler}
							/>
						)}
						{step === 'review' && (
							<ReviewStep
								questions={questions}
								answers={answers}
								consents={consents}
								clinicName={clinic.clinicName}
								doctorName={doctorName}
								showErrors={showErrors}
								onConsent={(type, agreed) => setConsents((prev) => ({ ...prev, [type]: agreed }))}
								onEdit={() => setStep('questionnaire')}
							/>
						)}
						{step === 'sent' && booking && (
							<SentStep booking={booking} clinicName={clinic.clinicName} clinicId={clinic._id} />
						)}

						{step !== 'sent' && (
							<div className={'booking-actions'}>
								<Button
									variant={'outlined'}
									onClick={() => (step === 'review' ? setStep('questionnaire') : router.push(clinicHref))}
								>
									{t('Back')}
								</Button>
								{step === 'questionnaire' ? (
									<Button variant={'contained'} endIcon={<ArrowForwardRoundedIcon />} onClick={continueHandler}>
										{t('Continue')}
									</Button>
								) : (
									<Button
										variant={'contained'}
										disabled={sending}
										endIcon={sending ? <CircularProgress size={18} color={'inherit'} /> : <ArrowForwardRoundedIcon />}
										onClick={sendHandler}
									>
										{t('Send booking request')}
									</Button>
								)}
							</div>
						)}
					</Stack>
					{device !== 'mobile' && <aside className={'side'}>{summary}</aside>}
				</Box>
			</Stack>
		</Stack>
	);
};

export default withLayoutBasic(BookingPage);
