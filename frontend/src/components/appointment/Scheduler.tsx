import { addDays, format, isSameDay, subDays } from 'date-fns'
import { useEffect, useRef, useState } from 'react'
import DatePicker from 'react-datepicker'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { IoMdAddCircle } from 'react-icons/io'
import { IoCalendarOutline } from 'react-icons/io5'
import { elFindMiddle } from '../../utils'
import useFetch from '../../utils/useFetch'
import { CalendarW } from '../assets/svg'
import { Modal } from '../UI'
import { AppointmentForm } from './appointmentUtils'
import sty from './Scheduler.module.scss'
import { TimelineToday, TimelineWeek } from './Timeline'
import { Appointment, ViewStyles } from './types'

const viewStyles = [
	{ el: 'Today', type: 'text', key: 'today' },
	{ el: <CalendarW />, type: 'icon', key: 'week' },
] as const

function Scheduler() {
	const appFetch = useFetch()
	const [appointments, setAppointments] = useState<Appointment[]>([])
	const [startDay, setStartDay] = useState<Date>(new Date())
	const [viewStyle, setViewStyle] = useState<ViewStyles>('week')
	const viewRefs = useRef<any>({})
	const [viewRefsIsReady, setViewRefsIsReady] = useState(false)
	const [addAppointmentIsOpen, setAddAppointmentIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [calendarIsOpen, setCalendarIsOpen] = useState(false)

	// Find startDays for prev/next buttons
	const jumpCount = viewStyle === 'week' ? 7 : 1
	const prevStartDay = subDays(startDay, jumpCount)
	const nextStartDay = addDays(startDay, jumpCount)
	const endDay = subDays(nextStartDay, 1)

	const middleOf = viewRefsIsReady
		? elFindMiddle(viewRefs.current[viewStyle])
		: 0

	const getAppointments = async () => {
		const startDateString = format(startDay, 'P')
		const endDateString = format(endDay, 'P')
		const { ok, data } = await appFetch(
			`/api/appointments?start_after=${startDateString}&start_before=${endDateString}`
		)

		if (!ok) return
		setAppointments(data)
		setIsLoading(false)
	}

	useEffect(() => {
		getAppointments()
	}, [startDay, viewStyle])

	useEffect(() => {
		const handlePageLoad = () => {
			setViewRefsIsReady(true)
		}

		// Wait for page to fully load, so we get accurate element style values
		if (document.readyState === 'complete') {
			setViewRefsIsReady(true)
		} else {
			window.addEventListener('load', handlePageLoad)
		}

		return () => {
			window.removeEventListener('load', handlePageLoad)
		}
	}, [])

	useEffect(() => {
		if (viewStyle === 'today') {
			setStartDay(new Date())
		}
	}, [viewStyle])

	const onAddAppointmentDone = () => {
		setAddAppointmentIsOpen(false)
		getAppointments()
	}

	const todayViewButDiffDay =
		viewStyle === 'today' && !isSameDay(startDay, new Date())

	return (
		<div className={sty.container}>
			<Modal
				closeFunc={() => setAddAppointmentIsOpen(false)}
				isOpen={addAppointmentIsOpen}
				options={{
					closeOnOutClick: false,
				}}
			>
				<AppointmentForm onDone={onAddAppointmentDone} initDate={startDay} />
			</Modal>
			<div className={sty.header}>
				<div className={sty.headerLeft}>
					<div className={sty.headerLabel}>
						<h2>Schedule</h2>
						<button
							className="btn-g icon big clear"
							type="button"
							onClick={() => setAddAppointmentIsOpen(true)}
							style={{ padding: '0px 6px' }}
						>
							<IoMdAddCircle />
						</button>
					</div>
				</div>
				<div className={sty.headerRight}>
					<div className={sty.viewOptions}>
						<div className={sty.options}>
							{viewStyles.map((vs) => {
								let classList = `btn-g clear ${sty.btn} ${sty[vs.type]}`
								const isActive = viewStyle === vs.key
								if (isActive) classList += ` ${sty.active}`

								let style = {}
								if (vs.key === 'today' && todayViewButDiffDay) {
									style = {
										width: viewRefs.current[vs.key]?.offsetWidth,
										display: 'flex',
										justifyContent: 'center',
									}
								}

								return (
									<button
										key={vs.key}
										ref={(ref) => {
											viewRefs.current[vs.key] = ref
										}}
										className={classList}
										type="button"
										onClick={() => {
											setViewStyle(vs.key)
											setIsLoading(true)
										}}
										disabled={isActive}
										style={style}
									>
										{vs.key === 'today' && todayViewButDiffDay ? 'Day' : vs.el}
									</button>
								)
							})}
						</div>
						<div className={sty.line} style={{ left: middleOf - 1 }} />
					</div>
					<div className={sty.timelineStatus}>
						<div className={sty.top}>{format(startDay, 'MMM yyyy')}</div>
						<div className={sty.bottom}>
							<div className={sty.days}>
								{viewStyle === 'week' ? (
									<>
										{format(startDay, 'd')} - {format(endDay, 'd')}
									</>
								) : (
									<>{format(startDay, 'd')}</>
								)}
							</div>
						</div>
					</div>
					<div style={{ display: 'flex' }}>
						<button
							className={`btn-g icon clear ${sty.calendarBtn}`}
							type="button"
							onClick={() => setCalendarIsOpen(!calendarIsOpen)}
						>
							<IoCalendarOutline />
						</button>

						{calendarIsOpen && (
							<div className={sty.calendarInputCont}>
								<DatePicker
									className={`${sty.calendarInput} input-g`}
									selected={startDay}
									onChange={(date: Date) => setStartDay(date)}
									autoFocus
								/>
							</div>
						)}
						<div className={sty.twinBtns}>
							<button
								className={`btn-g ${sty.btn} ${sty.back}`}
								type="button"
								onClick={() => setStartDay(prevStartDay)}
							>
								<BsChevronLeft />
							</button>
							<button
								className={`btn-g ${sty.btn}`}
								type="button"
								onClick={() => setStartDay(nextStartDay)}
							>
								<BsChevronRight />
							</button>
						</div>
					</div>
				</div>
			</div>
			<div className={sty.main}>
				{viewStyle === 'today' && (
					<TimelineToday appointments={appointments} isLoading={isLoading} />
				)}
				{viewStyle === 'week' && (
					<TimelineWeek
						appointments={appointments}
						startDay={startDay}
						isLoading={isLoading}
					/>
				)}
			</div>
			<div className={sty.footer} />
		</div>
	)
}

export default Scheduler
