import {
	addDays,
	eachDayOfInterval,
	eachMinuteOfInterval,
	format,
	getDayOfYear,
	getHours,
	getYear,
	intervalToDuration,
	parseISO,
	setHours,
} from 'date-fns'
import { useRef } from 'react'
import { formatPhoneNumber } from 'react-phone-number-input'
import { Link } from 'react-router-dom'
import { isSameDay } from '../../utils'
import { MINUTE_STEP, START_HOUR } from './appointmentUtils'
import sty from './Timeline.module.scss'
import { lastSlotStart, TimelineWeekDay } from './timelineUtils'
import { Appointment, AppointmentsDict } from './types'

interface Timeline {
	appointments: Appointment[]
	startDay: Date
	isLoading: boolean
}

export const TIME_SLOTS = eachMinuteOfInterval(
	{
		start: setHours(new Date().setHours(0, 0, 0, 0), START_HOUR),
		end: lastSlotStart(new Date()),
	},
	{ step: MINUTE_STEP }
)

function AppointmentsGetDict(appointments: Appointment[]) {
	const apsGrouped: AppointmentsDict = {}
	appointments.forEach((aps) => {
		const start = parseISO(aps.start)
		const year = getYear(start)
		const dayOfYear = getDayOfYear(start)
		const hour = getHours(start)
		if (!apsGrouped[year]) apsGrouped[year] = {}
		if (!apsGrouped[year][dayOfYear]) apsGrouped[year][dayOfYear] = {}
		if (!apsGrouped[year][dayOfYear][hour])
			apsGrouped[year][dayOfYear][hour] = []
		apsGrouped[year][dayOfYear][hour].push(aps)
	})
	return apsGrouped
}

function TimelineWeek({ appointments, startDay, isLoading }: Timeline) {
	const mainRef = useRef<HTMLDivElement>(null)
	const days = eachDayOfInterval({
		start: startDay,
		end: addDays(startDay, 6),
	})
	const today = new Date()
	const appointmentsDict = AppointmentsGetDict(appointments)

	// Ensure header and main view are aligned when a scrollbar is present (ie. windows)
	const mainScrollbarWidth = mainRef.current
		? mainRef.current.offsetWidth - mainRef.current.clientWidth
		: 0

	return (
		<div className={sty.timelineWeek}>
			<div
				className={sty.header}
				style={{ paddingRight: `${mainScrollbarWidth}px` }}
			>
				<div className={sty.headerSide} />
				{days.map((day) => {
					const isActive = isSameDay(day, today)
					return (
						<div
							key={day.getDate()}
							className={`${sty.day} ${isActive ? sty.active : null}`}
						>
							<small className={`${sty.weekDay}`}>{format(day, 'EEE')}</small>
							<strong className={`${sty.monthDay}`}>{day.getDate()}</strong>
						</div>
					)
				})}
			</div>
			<div className={sty.main} ref={mainRef}>
				<div className={`${sty.timelineCol} ${sty.timelineSide}`}>
					<div className={sty.header} />
					{TIME_SLOTS.map((slot) => (
						<div key={format(slot, 'p')} className={sty.timelineSlot}>
							<div className={sty.label}>{format(slot, 'p')}</div>
						</div>
					))}
				</div>
				{days.map((day) => (
					<TimelineWeekDay
						key={day.getDate()}
						day={day}
						appointmentsDict={appointmentsDict}
						isLoading={isLoading}
					/>
				))}
			</div>
		</div>
	)
}

interface TimelineTodayProps extends Omit<Timeline, 'startDay'> {}
function TimelineToday({ appointments, isLoading }: TimelineTodayProps) {
	return (
		<div className="box-g">
			<div className={sty.timelineDay}>
				<table>
					<thead>
						<tr>
							<th>Time</th>
							<th>Status</th>
							<th>Patient Name</th>
							<th>DOB</th>
							<th>Age</th>
							<th>Sex</th>
							<th title="New patient">NP</th>
							<th>Phone</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						{!isLoading &&
							appointments.map((apmt) => {
								const start = parseISO(apmt.start)
								const end = parseISO(apmt.end)
								return (
									<tr key={apmt.id}>
										<td className="td-w-inner-g td-nowrap">
											<Link to={`appointments/${apmt.id}`} className="link-g">
												{format(start, 'p')} - {format(end, 'p')}
											</Link>
										</td>
										<td>{apmt.status_text}</td>
										<td>{`${apmt.patient.first_name} ${apmt.patient.last_name}`}</td>
										<td>{apmt.patient.dob}</td>
										<td>
											{apmt.patient.dob &&
												intervalToDuration({
													start: new Date(),
													end: new Date(apmt.patient.dob),
												}).years}
										</td>
										<td>{apmt.patient.sex}</td>
										<td>{apmt.patient.is_new ? 'Y' : 'N'}</td>
										<td>{formatPhoneNumber(apmt.patient.phone || '')}</td>
										<td className="word-break">{apmt.notes}</td>
									</tr>
								)
							})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export { TimelineToday, TimelineWeek }
