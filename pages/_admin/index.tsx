import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { useQuery } from '@apollo/client';
import { Skeleton } from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import OutlinedFlagRoundedIcon from '@mui/icons-material/OutlinedFlagRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import withLayoutAdmin from '../../libs/components/layout/LayoutAdmin';
import AdminStatCard from '../../libs/components/admin/AdminStatCard';
import {
	ADMIN_I18N,
	ADMIN_NS,
	ADMIN_QUEUES_INPUT,
	AUDIT_ACTIONS,
	AuditTone,
	BATCH_JOBS,
	timeAgo,
} from '../../libs/components/admin/adminText';
import { GET_ADMIN_DASHBOARD } from '../../apollo/admin/query';
import { AuditLog, BatchRun, BatchStatusView, BookingStats } from '../../libs/types/admin/admin';
import { BatchName, BatchStatus } from '../../libs/enums/batch.enum';
import { T } from '../../libs/types/common';

export const getStaticProps = async ({ locale }: T) => ({
	props: {
		...(await serverSideTranslations(locale, ['common', 'admin'])),
	},
});

/** Totals only: every queue is asked for one row and its `metaCounter`. */
const DASHBOARD_INPUT = { ...ADMIN_QUEUES_INPUT, feed: { page: 1, limit: 5 } };

const TONE_ICONS: Record<AuditTone, React.ReactNode> = {
	success: <CheckRoundedIcon />,
	warning: <OutlinedFlagRoundedIcon />,
	danger: <CloseRoundedIcon />,
};

const total = (data: T | undefined, key: string): number | undefined =>
	data?.[key]?.metaCounter?.[0]?.total ?? (data ? 0 : undefined);

/**
 * The admin's first screen, filled by one GraphQL request: today's bookings, the review queues,
 * the last 14 days, the patients' languages, the batch's runs and the latest decisions.
 */
const AdminDashboard: NextPage = () => {
	const router = useRouter();
	const { t } = useTranslation(ADMIN_NS, ADMIN_I18N);
	const locale = router.locale ?? 'en';

	/** APOLLO REQUESTS **/
	const { data, loading } = useQuery(GET_ADMIN_DASHBOARD, {
		variables: DASHBOARD_INPUT,
		fetchPolicy: 'cache-and-network',
		notifyOnNetworkStatusChange: true,
	});
	const stats: BookingStats | undefined = data?.getBookingStatsByAdmin;
	const batch: BatchStatusView | undefined = data?.getBatchStatusByAdmin;
	const feed: AuditLog[] = data?.getAuditFeedByAdmin?.list ?? [];
	const days = stats?.last14Days ?? [];
	const maxDay = Math.max(1, ...days.map((day) => day.count));
	// The chart's scale: 0, half and a round top.
	const top = Math.max(5, Math.ceil(maxDay / 5) * 5);
	const today = days[days.length - 1];
	const weekAgo = days[days.length - 8];
	const pendingClinics = total(data, 'pendingClinics');
	const pendingTreatments = total(data, 'pendingTreatments');
	const pendingReviews = total(data, 'pendingReviews');
	const pendingReports = total(data, 'pendingReports');
	const toReview =
		pendingReviews === undefined || pendingReports === undefined ? undefined : pendingReviews + pendingReports;

	/** "Needs attention": every queue that waits for an admin, each opening its page. */
	const attention = [
		{
			href: '/_admin/clinics',
			label: t('Clinics to review'),
			sub: t('Waiting for review'),
			value: pendingClinics,
			icon: <ApartmentOutlinedIcon />,
		},
		{
			href: '/_admin/treatments',
			label: t('Treatments to review'),
			sub: t('Waiting for review'),
			value: pendingTreatments,
			icon: <FormatListBulletedRoundedIcon />,
		},
		{
			href: '/_admin/reviews',
			label: t('Reviews to moderate'),
			sub: t('Moderation'),
			value: pendingReviews,
			icon: <StarBorderRoundedIcon />,
		},
		{
			href: '/_admin/community/reports',
			label: t('Reported posts'),
			sub: t('Reports'),
			value: pendingReports,
			icon: <OutlinedFlagRoundedIcon />,
		},
		{
			href: '/_admin/bookings',
			label: t('Waiting for clinics'),
			sub: t('Pending, before the deadline'),
			value: stats?.waitingForClinic,
			icon: <ScheduleRoundedIcon />,
		},
	];

	const dayLabel = (date: string) =>
		new Intl.DateTimeFormat(locale, {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC',
		}).format(new Date(`${date}T00:00:00Z`));

	const vsWeekAgo = () => {
		if (!today || !weekAgo) return undefined;
		const diff = today.count - weekAgo.count;
		const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(
			new Date(`${weekAgo.date}T00:00:00Z`),
		);
		return t('{{diff}} vs. last {{weekday}}', { diff: diff >= 0 ? `+${diff}` : diff, weekday });
	};

	const batchRow = (run: BatchRun) => {
		const job = BATCH_JOBS[run.batchName as BatchName];
		const status = run.batchStatus;
		return (
			<li key={run.batchName} className={'admin-batch-row'}>
				<span className={'icon'}>
					<AutorenewRoundedIcon />
				</span>
				<div className={'text'}>
					<strong>{t(job?.label ?? run.batchName)}</strong>
					<span>{job ? t(job.schedule) : ''}</span>
				</div>
				<span className={'side'}>
					{status && (
						<span
							className={`admin-badge ${status === BatchStatus.SUCCESS ? 'success' : status === BatchStatus.FAILED ? 'danger' : 'teal'}`}
						>
							{status === BatchStatus.SUCCESS && <CheckRoundedIcon />}
							{t(`batchStatus.${status}`)}
						</span>
					)}
					<span className={'result'} title={run.batchResult ?? ''}>
						{run.finishedAt ? timeAgo(run.finishedAt, t, locale) : run.startedAt ? '' : t('Never ran')}
					</span>
				</span>
			</li>
		);
	};

	return (
		<div id={'admin-dashboard'}>
			<div className={'admin-stats four'}>
				<AdminStatCard
					label={t('Bookings today')}
					value={stats?.today}
					sub={vsWeekAgo()}
					icon={<CalendarTodayOutlinedIcon />}
				/>
				<AdminStatCard
					label={t('Waiting for clinics')}
					value={stats?.waitingForClinic}
					sub={t('Pending, before the deadline')}
					icon={<ScheduleRoundedIcon />}
					tone={'warning'}
				/>
				<Link href={'/_admin/clinics'} className={'admin-stat-link'}>
					<AdminStatCard
						label={t('Clinics to review')}
						value={pendingClinics}
						sub={
							pendingTreatments === undefined ? undefined : t('+ {{count}} treatments', { count: pendingTreatments })
						}
						icon={<ApartmentOutlinedIcon />}
					/>
				</Link>
				<Link href={'/_admin/reviews'} className={'admin-stat-link'}>
					<AdminStatCard
						label={t('Reports to review')}
						value={toReview}
						sub={t('Reviews and posts')}
						icon={<OutlinedFlagRoundedIcon />}
						tone={'danger'}
					/>
				</Link>
			</div>

			<div className={'admin-grid wide-left'}>
				<section className={'admin-card'}>
					<div className={'admin-card-head'}>
						<div>
							<h2>{t('Bookings · last 14 days')}</h2>
							<p>{t('All clinics · requests per Seoul day')}</p>
						</div>
					</div>
					{!stats && loading ? (
						<Skeleton variant={'rounded'} height={220} />
					) : (
						<div className={'admin-chart'} role={'img'} aria-label={t('Bookings · last 14 days')}>
							<div className={'scale'}>
								<span>{top}</span>
								<span>{top / 2}</span>
								<span>0</span>
							</div>
							<div className={'bars'}>
								{days.map((day, index) => (
									<div key={day.date} className={`bar ${index === days.length - 1 ? 'today' : ''}`} tabIndex={0}>
										<span className={'fill'} style={{ height: `${(day.count / top) * 100}%` }} />
										<span className={'tip'}>
											{t('{{count}} bookings', { count: day.count })} · {dayLabel(day.date)}
										</span>
										<span className={'day'}>{index % 2 === 0 ? '' : dayLabel(day.date)}</span>
									</div>
								))}
							</div>
						</div>
					)}
					<div className={'admin-chart-legend'}>
						<span>
							<i />
							{t('Bookings')}
						</span>
					</div>
				</section>

				<section className={'admin-card admin-attention'}>
					<div className={'admin-card-head'}>
						<div>
							<h2>{t('Needs attention')}</h2>
						</div>
					</div>
					<ul>
						{attention.map((row) => (
							<li key={row.href}>
								<Link href={row.href}>
									<span className={'icon'}>{row.icon}</span>
									<span className={'text'}>
										<b>{row.label}</b>
										<small>{row.sub}</small>
									</span>
									<strong>{row.value === undefined ? '—' : row.value}</strong>
								</Link>
							</li>
						))}
					</ul>
				</section>
			</div>

			<div className={'admin-grid halves'}>
				<section className={'admin-card'}>
					<div className={'admin-card-head'}>
						<h2>{t('Batch jobs')}</h2>
						<span className={'admin-tag'}>medvia-batch</span>
					</div>
					{!batch && loading ? (
						<Skeleton variant={'rounded'} height={200} />
					) : (
						<ul className={'admin-batch'}>
							{(batch?.batches ?? []).map(batchRow)}
							<li className={'admin-batch-row'}>
								<span className={'icon'}>
									<ScheduleRoundedIcon />
								</span>
								<div className={'text'}>
									<strong>{t('Booking queue')}</strong>
									<span>{t('Deadlines and reminders (Redis)')}</span>
								</div>
								<span className={'side'}>
									{batch?.queue ? (
										<>
											<span className={`admin-badge ${batch.queue.failed ? 'danger' : 'success'}`}>
												{batch.queue.failed
													? t('{{count}} failed', { count: batch.queue.failed })
													: t('batchStatus.SUCCESS')}
											</span>
											<span className={'result'}>
												{t('{{delayed}} waiting · {{active}} running', {
													delayed: batch.queue.delayed + batch.queue.waiting,
													active: batch.queue.active,
												})}
											</span>
										</>
									) : (
										<span className={'admin-badge danger'}>{t('No answer')}</span>
									)}
								</span>
							</li>
						</ul>
					)}
				</section>

				<section className={'admin-card'}>
					<div className={'admin-card-head'}>
						<h2>{t('Recent activity')}</h2>
						<Link href={'/_admin/audit'}>{t('See all')}</Link>
					</div>
					{!data && loading ? (
						<Skeleton variant={'rounded'} height={200} />
					) : feed.length ? (
						<ul className={'admin-activity'}>
							{feed.map((log) => {
								const action = AUDIT_ACTIONS[log.auditAction];
								return (
									<li key={log._id}>
										<span className={`icon ${action?.tone ?? 'success'}`}>{TONE_ICONS[action?.tone ?? 'success']}</span>
										<div className={'text'}>
											<strong>{t(action?.label ?? log.auditAction)}</strong>
											{log.auditNote && <q>{log.auditNote}</q>}
											<span>
												{t('by {{name}}', { name: log.adminName ?? t('Admin') })} · {timeAgo(log.createdAt, t, locale)}
											</span>
										</div>
									</li>
								);
							})}
						</ul>
					) : (
						<p className={'admin-muted'}>{t('No decisions yet.')}</p>
					)}
				</section>
			</div>
		</div>
	);
};

export default withLayoutAdmin(AdminDashboard);
