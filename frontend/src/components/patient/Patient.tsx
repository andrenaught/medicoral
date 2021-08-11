import { format, isToday, parseISO } from 'date-fns'
import { useEffect, useState } from 'react'
import { HiOutlineAtSymbol } from 'react-icons/hi'
import { Link, useParams } from 'react-router-dom'
import { ErrorPage } from '../../pages/error'
import useFetch from '../../utils/useFetch'
import apmtSty from '../appointment/Appointment.module.scss'
import { Appointment } from '../appointment/types'
import { BackButton, Modal } from '../UI'
import { PatientForm, PatientInfo } from './patientUtils'
import { ProgressNoteForm } from './progressNoteUtils'
import { Patient, ProgressNote } from './types'

function PatientPage() {
	const { id } = useParams<{ id?: string }>()
	const appFetch = useFetch()
	const [isLoading, setIsLoading] = useState<boolean>(true)
	const [statusCode, setStatusCode] = useState<number | null>(null)
	const [patient, setPatient] = useState<Patient | null>(null)
	const [progressNotes, setProgressNotes] = useState<ProgressNote[] | []>([])
	const [progressNoteId, setProgressNoteId] = useState<number | null>(null)
	const [reachedLastPNote, setReachedLastPNote] = useState<boolean>(false)
	const [appointments, setAppointments] = useState<Appointment[] | []>([])
	const [reachedLastApmt, setReachedLastApmt] = useState<boolean>(false)
	const [editIsOpen, setEditIsOpen] = useState<boolean>(false)

	const getPatient = async () => {
		const { ok, data, response } = await appFetch(`/api/patients/${id}`)
		if (!ok) {
			setStatusCode(response.status)
			return false
		}

		setPatient(data)
		return true
	}

	const getAppointments = async (type?: string) => {
		let fetchString = `/api/appointments?patient=${id}&ordering=-start`
		if (type === 'most-recent') {
			fetchString += `&limit=1`
		} else {
			fetchString += `&limit=3&offset=${appointments.length}`
		}
		const { ok, data } = await appFetch(fetchString)
		if (!ok) return

		if (data.next == null) setReachedLastApmt(true)
		setAppointments([...appointments, ...data.results])
	}

	const getProgressNotes = async () => {
		const { ok, data } = await appFetch(
			`/api/progress_notes?patient=${id}&ordering=-id&limit=3&offset=${progressNotes.length}`
		)
		if (!ok) return
		if (data.next == null) setReachedLastPNote(true)
		setProgressNotes([...progressNotes, ...data.results])
	}

	useEffect(() => {
		const isValid = Number.isInteger(Number(id))
		if (!isValid) {
			setStatusCode(404)
			return
		}
		const initLoad = async () => {
			if (await getPatient()) {
				await getProgressNotes()
				await getAppointments('most-recent')
			}

			setIsLoading(false)
		}
		initLoad()
	}, [id])

	if (statusCode) return <ErrorPage code={statusCode} />
	if (patient == null) return <div>...loading</div>

	if (editIsOpen)
		return (
			<div className="box-g">
				<PatientForm
					updateItem={patient}
					onDone={() => {
						getPatient()
						setEditIsOpen(false)
					}}
					onCancel={() => setEditIsOpen(false)}
					showAllFields
				/>
			</div>
		)

	const showProgressNoteModal = Boolean(progressNoteId)

	return (
		<div className="container-g small">
			<Modal
				closeFunc={() => setProgressNoteId(null)}
				isOpen={showProgressNoteModal}
			>
				<ProgressNoteForm
					id={progressNoteId || 0}
					patient={patient}
					onDone={() => setProgressNoteId(null)}
					onCancel={() => setProgressNoteId(null)}
				/>
			</Modal>
			<BackButton to="/patients" />
			<div className="box-g">
				<PatientInfo patient={patient} />
				<div style={{ marginTop: '10px' }}>
					<button
						className="btn-g"
						type="button"
						onClick={() => setEditIsOpen(true)}
					>
						Edit
					</button>
				</div>
			</div>
			<div className="box-g" style={{ marginTop: '10px' }}>
				<h3 className="header-g">Appointments</h3>
				{!isLoading && appointments.length === 0 && 'None'}
				<div style={{ display: 'block', alignItems: 'center' }}>
					<div>
						{appointments.map((apmt: Appointment) => {
							const start = parseISO(apmt.start)
							const end = parseISO(apmt.end)
							const apmtIsToday = isToday(start)

							return (
								<div
									className="flex-g"
									key={apmt.id}
									style={{ marginBottom: '2px' }}
								>
									<Link className="link-g" to={`/appointments/${apmt.id}`}>
										{apmtIsToday ? 'Today' : format(start, 'P')}
									</Link>
									<div className={apmtSty.time}>
										<HiOutlineAtSymbol className={apmtSty.timeIcon} />{' '}
										{format(start, 'p')} - {format(end, 'p')}
									</div>
								</div>
							)
						})}
					</div>

					{!reachedLastApmt && (
						<button
							className="btn-g clear"
							type="button"
							onClick={() => getAppointments()}
						>
							View more
						</button>
					)}
				</div>
			</div>
			<div className="box-g" style={{ marginTop: '10px' }}>
				<h3 className="header-g">Progress Notes</h3>
				{!isLoading && progressNotes.length === 0 && 'None'}
				<table style={progressNotes.length === 0 ? { display: 'none' } : {}}>
					<thead>
						<tr>
							<th>Date</th>
							<th>Chief Complaint</th>
						</tr>
					</thead>
					<tbody>
						{progressNotes.map((pNote: ProgressNote) => {
							return (
								<tr
									key={pNote.id}
									className="clickable"
									onClick={() => setProgressNoteId(pNote.id)}
								>
									<td>{format(parseISO(pNote.created_at), 'P')}</td>
									<td className="show-newlines-g word-break">
										{pNote.chief_complaint}
									</td>
								</tr>
							)
						})}
					</tbody>
				</table>
				{!reachedLastPNote && (
					<button
						style={{ paddingLeft: '5px' }}
						className="btn-g clear"
						type="button"
						onClick={() => getProgressNotes()}
					>
						View more
					</button>
				)}
			</div>
		</div>
	)
}

export default PatientPage
export { PatientInfo }
