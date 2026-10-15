import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import { Box, Button, IconButton, MenuItem, Skeleton, TextField } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import useDeviceDetect from '../../libs/hooks/useDeviceDetect';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ClinicFrame from '../../libs/components/dashboard/ClinicFrame';
import AddSlotsDialog from '../../libs/components/dashboard/AddSlotsDialog';
import PromptDialog from '../../libs/components/common/PromptDialog';
import EmptyState from '../../libs/components/common/EmptyState';
import { GET_CLINIC_SCHEDULE, GET_MY_CLINIC_DOCTORS } from '../../apollo/user/query';
import { SET_SLOTS_BLOCKED } from '../../apollo/user/mutation';
import { userVar } from '../../apollo/store';
import { Slot } from '../../libs/types/slot/slot';
import { Doctor } from '../../libs/types/doctor/doctor';
import { BookingStatus, SlotStatus } from '../../libs/enums/booking.enum';
import { MemberType } from '../../libs/enums/member.enum';
import { sweetMixinErrorAlert, sweetTopSmallSuccessAlert } from '../../libs/sweetAlert';
import { addDaysKey, dayLabels, initials, mondayOfKey, seoulClock, seoulDateKey } from '../../libs/utils';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common'])),
	},
});

type SlotKind = 'booked' | 'request' | 'held' | 'open' | 'blocked';

/** What a slot means to the clinic: a request waiting for an answer keeps its slot. */
const kindOf = (slot: Slot): SlotKind => {
	if (slot.bookingData?.bookingStatus === BookingStatus.PENDING) return 'request';
	if (slot.bookingData) return 'booked';
	if (slot.slotStatus === SlotStatus.BLOCKED) return 'blocked';
	if (slot.slotStatus === SlotStatus.HELD) return 'held';
	return 'open';
};

/**
 * "Schedule & Slots": a week of every doctor's 30-minute slots (Seoul time). Open and blocked
 * slots are picked to block or free them; booked ones show the patient and the treatment.
 */
const ClinicSchedule: NextPage = () => {
	const device = useDeviceDetect();
	const router = useRouter();
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar);
	const today = seoulDateKey(new Date());
	const [weekStart, setWeekStart] = useState<string>(mondayOfKey(today));
	const [day, setDay] = useState<string>(today);
	const [doctorId, setDoctorId] = useState<string>('');
	const [picked, setPicked] = useState<string[]>([]);
	const [adding, setAdding] = useState<boolean>(false);
	const [blocking, setBlocking] = useState<boolean>(false);
	const isClinic = user.memberType === MemberType.AGENT;
	const mobile = device === 'mobile';
	const days = Array.from({ length: 7 }, (_, index) => addDaysKey(weekStart, index));

	/** APOLLO REQUESTS **/
	const { data, previousData, loading, refetch } = useQuery(GET_CLINIC_SCHEDULE, {
		variables: { input: { dateFrom: weekStart, ...(doctorId ? { doctorId } : {}) } },
		fetchPolicy: 'cache-and-network',
		skip: !isClinic,
	});
	const { data: doctorsData } = useQuery(GET_MY_CLINIC_DOCTORS, { fetchPolicy: 'cache-first', skip: !isClinic });
	const [setSlotsBlocked, { loading: saving }] = useMutation(SET_SLOTS_BLOCKED);
	const slots: Slot[] = (data ?? previousData)?.getClinicSchedule ?? [];
	const doctors: Doctor[] = doctorsData?.getMyClinicDoctors ?? [];
	const doctorName = (id: string) => doctors.find((doctor) => doctor._id === id)?.doctorName ?? '';
	const pickedSlots = slots.filter((slot) => picked.includes(slot._id));
	const toBlock = pickedSlots.filter((slot) => slot.slotStatus === SlotStatus.OPEN).map((slot) => slot._id);
	const toFree = pickedSlots.filter((slot) => slot.slotStatus === SlotStatus.BLOCKED).map((slot) => slot._id);

	// Rows: every start time used this week; cells: the slots of that day and time.
	const times = Array.from(new Set(slots.map((slot) => seoulClock(slot.slotStart)))).sort();
	const cell = (dateKey: string, time: string) =>
		slots.filter((slot) => seoulDateKey(slot.slotStart) === dateKey && seoulClock(slot.slotStart) === time);

	/** HANDLERS **/
	const weekHandler = (step: number) => {
		const start = addDaysKey(weekStart, step * 7);
		setWeekStart(start);
		setDay(start);
		setPicked([]);
	};

	const pickHandler = (slot: Slot) => {
		if (slot.slotStatus !== SlotStatus.OPEN && slot.slotStatus !== SlotStatus.BLOCKED) return;
		setPicked((current) =>
			current.includes(slot._id) ? current.filter((id) => id !== slot._id) : [...current, slot._id],
		);
	};

	const blockHandler = async (blocked: boolean, reason?: string) => {
		try {
			const slotIds = blocked ? toBlock : toFree;
			await setSlotsBlocked({
				variables: { input: { slotIds, blocked, ...(reason ? { slotBlockReason: reason } : {}) } },
			});
			setBlocking(false);
			setPicked([]);
			await refetch();
			await sweetTopSmallSuccessAlert(blocked ? t('Slots blocked') : t('Slots opened again'));
		} catch (err) {
			await sweetMixinErrorAlert((err as Error).message);
		}
	};

	const chip = (slot: Slot, withDoctor: boolean) => {
		const kind = kindOf(slot);
		const selectable = kind === 'open' || kind === 'blocked';
		const label =
			kind === 'booked' || kind === 'request'
				? slot.bookingData?.patientName
				: kind === 'held'
					? t('On hold')
					: kind === 'blocked'
						? t('Blocked')
						: t('Open');
		// As in the mockup: the treatment under a booking, "Request" under a request, the reason under a block.
		const sub =
			kind === 'booked'
				? (slot.bookingData?.treatmentName ?? '')
				: kind === 'request'
					? t('Request')
					: kind === 'blocked'
						? (slot.slotBlockReason ?? '')
						: '';
		const content = (
			<>
				{withDoctor && (
					<span className={'doc'} title={doctorName(slot.doctorId)}>
						{initials(doctorName(slot.doctorId))}
					</span>
				)}
				<span className={'text'}>
					<b>{label}</b>
					{sub && <small>{sub}</small>}
				</span>
			</>
		);
		return selectable ? (
			<button
				key={slot._id}
				type={'button'}
				className={`slot ${kind} ${picked.includes(slot._id) ? 'picked' : ''}`}
				aria-pressed={picked.includes(slot._id)}
				onClick={() => pickHandler(slot)}
			>
				{content}
			</button>
		) : (
			<span key={slot._id} className={`slot ${kind}`}>
				{content}
			</span>
		);
	};

	const range = `${dayLabels(days[0], router.locale).day} – ${dayLabels(days[6], router.locale).day} · ${new Intl.DateTimeFormat(
		router.locale,
		{ month: 'long', year: 'numeric', timeZone: 'UTC' },
	).format(new Date(`${days[3]}T12:00:00Z`))}`;

	let grid: React.ReactNode;
	if (loading && slots.length === 0) {
		grid = <Skeleton variant={'rounded'} height={420} />;
	} else if (slots.length === 0) {
		grid = (
			<EmptyState
				title={t('No slots this week')}
				text={t('Add slots so patients can book.')}
				action={
					<Button variant={'contained'} startIcon={<AddRoundedIcon />} onClick={() => setAdding(true)}>
						{t('Add slots')}
					</Button>
				}
			/>
		);
	} else if (mobile) {
		const daySlots = slots
			.filter((slot) => seoulDateKey(slot.slotStart) === day)
			.sort((a, b) => +new Date(a.slotStart) - +new Date(b.slotStart));
		grid = (
			<div className={'day-list'}>
				{daySlots.length === 0 ? (
					<p className={'hint'}>{t('No slots on this day.')}</p>
				) : (
					daySlots.map((slot) => (
						<div key={slot._id} className={'day-row'}>
							<time>{seoulClock(slot.slotStart)}</time>
							{chip(slot, !doctorId)}
						</div>
					))
				)}
			</div>
		);
	} else {
		grid = (
			<div className={'week-grid'} role={'table'} aria-label={t('Schedule')}>
				<div className={'row head'} role={'row'}>
					<span role={'columnheader'} />
					{days.map((key) => {
						const label = dayLabels(key, router.locale);
						return (
							<span key={key} role={'columnheader'} className={key === today ? 'today' : ''}>
								{label.weekday} <b>{label.day}</b>
							</span>
						);
					})}
				</div>
				{times.map((time) => (
					<div key={time} className={'row'} role={'row'}>
						<time role={'rowheader'}>{time}</time>
						{days.map((key) => (
							<div key={key} role={'cell'} className={'cell'}>
								{cell(key, time).map((slot) => chip(slot, !doctorId))}
							</div>
						))}
					</div>
				))}
			</div>
		);
	}

	return (
		<ClinicFrame
			title={t('Schedule & Slots')}
			text={t('Each doctor has their own 30-minute slots. A request holds its slot until you answer. Seoul time.')}
			className={'clinic-schedule'}
			action={
				<Button variant={'contained'} startIcon={<AddRoundedIcon />} onClick={() => setAdding(true)}>
					{t('Add slots')}
				</Button>
			}
		>
			<Box className={'schedule-tools'}>
				<TextField
					size={'small'}
					select
					value={doctorId}
					onChange={(event) => {
						setDoctorId(event.target.value);
						setPicked([]);
					}}
					inputProps={{ 'aria-label': t('Doctor') }}
					SelectProps={{ displayEmpty: true }}
				>
					<MenuItem value={''}>{t('All doctors')}</MenuItem>
					{doctors.map((doctor) => (
						<MenuItem key={doctor._id} value={doctor._id}>
							{t('Dr.')} {doctor.doctorName}
						</MenuItem>
					))}
				</TextField>
				<div className={'week-nav'}>
					<IconButton aria-label={t('Previous week')} onClick={() => weekHandler(-1)}>
						<ChevronLeftRoundedIcon />
					</IconButton>
					<span>{range}</span>
					<IconButton aria-label={t('Next week')} onClick={() => weekHandler(1)}>
						<ChevronRightRoundedIcon />
					</IconButton>
				</div>
				{!mobile && (
					<Button
						variant={'text'}
						onClick={() => {
							setWeekStart(mondayOfKey(today));
							setDay(today);
						}}
					>
						{t('This week')}
					</Button>
				)}
			</Box>

			{mobile && (
				<div className={'day-strip'} role={'tablist'} aria-label={t('Days')}>
					{days.map((key) => {
						const label = dayLabels(key, router.locale);
						return (
							<button key={key} type={'button'} role={'tab'} aria-selected={key === day} onClick={() => setDay(key)}>
								<span>{label.weekday}</span>
								<b>{label.day}</b>
							</button>
						);
					})}
				</div>
			)}

			{picked.length > 0 && (
				<div className={'pick-bar'}>
					<span>{t('{{count}} selected', { count: picked.length })}</span>
					{toBlock.length > 0 && (
						<Button variant={'contained'} size={'small'} disabled={saving} onClick={() => setBlocking(true)}>
							{t('Block')} ({toBlock.length})
						</Button>
					)}
					{toFree.length > 0 && (
						<Button variant={'outlined'} size={'small'} disabled={saving} onClick={() => blockHandler(false)}>
							{t('Unblock')} ({toFree.length})
						</Button>
					)}
					<Button variant={'text'} size={'small'} onClick={() => setPicked([])}>
						{t('Clear')}
					</Button>
				</div>
			)}

			{grid}

			<div className={'legend'}>
				{(['booked', 'request', 'open', 'blocked'] as SlotKind[]).map((kind) => (
					<span key={kind} className={`slot-dot ${kind}`}>
						{t(`slotKind.${kind}`)}
					</span>
				))}
			</div>

			<AddSlotsDialog
				open={adding}
				doctors={doctors}
				doctorId={doctorId}
				onClose={() => setAdding(false)}
				onCreated={() => refetch()}
			/>
			<PromptDialog
				open={blocking}
				title={t('Block {{count}} slots?', { count: toBlock.length })}
				text={t('Patients cannot book blocked slots. The note is only for your team.')}
				label={t('Note (optional), e.g. Conference')}
				confirmText={t('Block')}
				busy={saving}
				onConfirm={(reason) => blockHandler(true, reason)}
				onClose={() => setBlocking(false)}
			/>
		</ClinicFrame>
	);
};

export default withLayoutBasic(ClinicSchedule);
