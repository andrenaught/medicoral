import {
	differenceInMinutes,
	eachMinuteOfInterval,
	format,
	getDayOfYear,
	getHours,
	getMinutes,
	getYear,
	parseISO,
	setHours,
	setMinutes,
} from 'date-fns'
import { Link } from 'react-router-dom'
import { END_HOUR, MINUTE_STEP, START_HOUR } from './appointmentUtils'
import sty from './Timeline.module.scss'
import { AppointmentsDict } from './types'

function lastSlotStart(date: Date) {
	return setMinutes(
		setHours(date.setHours(0, 0, 0, 0), END_HOUR - 1),
		MINUTE_STEP
	)
}

interface TimelineWeekDayProps {
	day: Date
	appointmentsDict: AppointmentsDict
	isLoading: boolean
}
function TimelineWeekDay({
	day,
	appointmentsDict,
	isLoading,
}: TimelineWeekDayProps) {
	const timeSlots = eachMinuteOfInterval(
		{ start: setHours(day, START_HOUR), end: lastSlotStart(day) },
		{ step: MINUTE_STEP }
	)

	return (
		<div className={sty.timelineCol}>
			{timeSlots.map((slot) => {
				const apsForThisHour =
					appointmentsDict[getYear(slot)]?.[getDayOfYear(slot)]?.[
						getHours(slot)
					] || [] // appointments[2021][72][8] // year 2021, day 72, hour 8

				// split into 30 minute slots
				const isFirstHalf = getMinutes(slot) < 30
				const apsForThisHourFirstHalf = apsForThisHour.filter(
					(aps) => getMinutes(parseISO(aps.start)) < 30
				)
				const apsForThisHourSecondHalf = apsForThisHour.filter(
					(aps) => getMinutes(parseISO(aps.start)) >= 30
				)
				const apsForThisSlot = isFirstHalf
					? apsForThisHourFirstHalf
					: apsForThisHourSecondHalf

				return (
					<div
						key={format(slot, 'p')}
						className={`${sty.timelineSlot} ${sty.double}`}
					>
						<div className={sty.timeSlotCards}>
							{!isLoading &&
								apsForThisSlot.map((aps) => {
									const start = parseISO(aps.start)
									const end = parseISO(aps.end)
									const apsLength = differenceInMinutes(end, start)
									const marginTop =
										((getMinutes(start) % MINUTE_STEP) / MINUTE_STEP) * 100 + 2 // height of one slot + true margin-top
									const slotScale = apsLength / MINUTE_STEP
									const slotHops = Math.max(Math.ceil(slotScale), 0)
									const height = slotScale * 100 - 5 + 2 * slotHops // height of one slot - separator space

									let classList = `${sty.timeSlotCard}`
									if (aps.patient.is_new) classList += ` ${sty.newPatient}`
									if (aps.status === 'DO') classList += ` ${sty.isDone}`

									return (
										<Link
											to={`appointments/${aps.id}`}
											key={format(start, 'p')}
											className={classList}
											style={{ height, maxHeight: height, marginTop }}
										>
											<div className={sty.timeSlotCardInner}>
												<div className={sty.timeRange}>
													{format(start, 'p')} - {format(end, 'p')}
												</div>
												<div className={sty.patient}>
													{`${aps.patient.first_name} ${aps.patient.last_name}`}
												</div>
												<div className={sty.notes}>{aps.notes}</div>
											</div>
										</Link>
									)
								})}
						</div>
					</div>
				)
			})}
		</div>
	)
}

export { TimelineWeekDay, lastSlotStart }
