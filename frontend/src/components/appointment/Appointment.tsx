import { format, formatDistance, isAfter, isToday, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { HiOutlineAtSymbol } from 'react-icons/hi'
import { useParams } from 'react-router-dom'
import { ErrorPage } from '../../pages/error'
import useFetch from '../../utils/useFetch'
import { PatientInfo } from '../patient/Patient'
import { PatientForm } from '../patient/patientUtils'
import { ProgressNoteForm } from '../patient/progressNoteUtils'
import { BackButton, Modal } from '../UI'
import sty from './Appointment.module.scss'
import { AppointmentForm } from './appointmentUtils'
import { Appointment } from './types'

// Orange status while appointment is not done, green when done
const doneStatusColor = 'var(--green-color)'
const notDoneStatusColor = 'var(--orange-color)'
const statusOptions = [
	{ code: 'SC', text: 'Scheduled', color: notDoneStatusColor },
	{ code: 'CI', text: 'Checked In', color: notDoneStatusColor },
	{ code: 'DO', text: 'Done', color: doneStatusColor },
]

function AppointmentPage() {
	const { id } = useParams<{ id?: string }>()
	const [statusCode, setStatusCode] = useState<number | null>(null)
	const [apmt, setApmt] = useState<Appointment | null>(null)
	const [editIsOn, setEditIsOn] = useState<boolean>(false)
	const [patientFormIsOpen, setPatientFormIsOpen] = useState<boolean>(false)
	const [progressNoteIsOpen, setProgressNoteIsOpen] = useState<boolean>(false)
	const appFetch = useFetch()

	const getAppointment = async () => {
		const { ok, data, response } = await appFetch(`/api/appointments/${id}`)
		if (!ok) setStatusCode(response.status)

		setApmt(data)
	}

	const updateAppointment = async (body: {}) => {
		const { ok } = await appFetch(`/api/appointments/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		})
		return ok
	}
	const updatePatient = async (body: {}) => {
		if (apmt == null) return false
		const { ok } = await appFetch(`/api/patients/${apmt.patient.id}`, {
			method: 'PATCH',
			body: JSON.stringify(body),
		})
		return ok
	}

	useEffect(() => {
		const isValid = Number.isInteger(Number(id))
		if (!isValid) {
			setStatusCode(404)
			return
		}
		getAppointment()
	}, [id])

	if (statusCode) return <ErrorPage code={statusCode} />
	if (apmt == null) return <div>...loading</div>

	const startProgressNote = async () => {
		await updateAppointment({ status: 'CI' })
		await getAppointment()
		setProgressNoteIsOpen(true)
	}

	const handleStart = () => {
		if (apmt.patient.is_new && apmt.status === 'SC') {
			setPatientFormIsOpen(true)
			return
		}
		startProgressNote()
	}

	const handleFinish = async () => {
		await updateAppointment({ status: 'DO' })
		await updatePatient({ is_new: false })
		await getAppointment()
		setPatientFormIsOpen(false)
		setProgressNoteIsOpen(false)
	}

	if (progressNoteIsOpen) {
		return (
			<ProgressNoteForm
				patient={apmt.patient}
				onDone={() => handleFinish()}
				onCancel={() => {
					setPatientFormIsOpen(false)
					setProgressNoteIsOpen(false)
				}}
			/>
		)
	}

	if (patientFormIsOpen)
		return (
			<div>
				<h2>Appointment</h2>
				<p>Add additional information for new patient</p>
				<div className="box-g">
					<PatientForm
						updateItem={apmt.patient}
						onDone={() => startProgressNote()}
						onCancel={() => setPatientFormIsOpen(false)}
						showAllFields
					/>
				</div>
			</div>
		)

	const { patient } = apmt
	const start = parseISO(apmt.start)
	const end = parseISO(apmt.end)
	const name = `${patient.first_name} ${patient.last_name}`
	const agoString = formatDistance(start, new Date(), { addSuffix: true })
	const hasPast = isAfter(new Date(), start)
	const apmtIsToday = isToday(start)
	const statusColor =
		statusOptions.find((x) => x.code === apmt.status)?.color || null

	return (
		<div>
			{editIsOn && (
				<Modal
					closeFunc={() => setEditIsOn(false)}
					isOpen={editIsOn}
					options={{
						closeOnOutClick: false,
					}}
				>
					<AppointmentForm
						updateItem={apmt}
						onDone={() => {
							getAppointment()
							setEditIsOn(false)
						}}
					/>
				</Modal>
			)}
			<BackButton to="/clinic" />
			<div className={sty.container}>
				<div className={`box-g ${sty.mainbox}`}>
					<div className={sty.header}>
						<h3 className="header-g">Appointment</h3>
						<div className={sty.headerActions}>
							{apmt.status !== 'DO' && (
								<button
									className="btn-g clear"
									type="button"
									onClick={() => setEditIsOn(true)}
								>
									Edit
								</button>
							)}
						</div>
					</div>
					<div className={sty.main}>
						<div className={sty.section1}>
							<div className="flex-g" style={{ marginBottom: '6px' }}>
								<div className={`tag-g ${sty.statusTag}`}>
									{statusColor && (
										<div
											className={sty.indicator}
											style={{ background: statusColor }}
										/>
									)}
									<div className={sty.text}>{apmt.status_text}</div>
								</div>
								<span>
									{hasPast ? 'Started' : 'Starts'} {agoString}
								</span>
							</div>
							<div className="flex-g">
								<strong>{apmtIsToday ? 'Today' : format(start, 'P')}</strong>
								<div className={sty.time}>
									<HiOutlineAtSymbol className={sty.timeIcon} />{' '}
									<strong>
										{format(start, 'p')} - {format(end, 'p')}
									</strong>
								</div>
							</div>
						</div>

						<div className={sty.section2}>
							<div>
								<div className={sty.patientHeader}>
									<h4 className={sty.name}>{name}</h4>
									{patient.is_new && (
										<div className={sty.tag} title="New patient">
											NP
										</div>
									)}
								</div>
								<div className={sty.notes}>{apmt.notes}</div>
							</div>
							<div style={{ flexShrink: 0 }}>
								{apmt.status !== 'DO' && (
									<button
										className="btn-g primary"
										type="button"
										onClick={() => handleStart()}
									>
										{apmt.status === 'SC' && 'Start'}
										{apmt.status === 'CI' && 'Resume'}
										{apmt.status === 'DO' && 'Done'}
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
				<div className="box-g">
					<div className={sty.patientInfo}>
						<PatientInfo patient={patient} type="simple" />
					</div>
				</div>
			</div>
		</div>
	)
}

export default AppointmentPage
