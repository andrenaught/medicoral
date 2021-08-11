import { yupResolver } from '@hookform/resolvers/yup'
import {
	compareAsc,
	eachMinuteOfInterval,
	format,
	formatISO,
	Interval,
	isWithinInterval,
	parse,
	parseISO,
	setHours,
	setMinutes,
	subMinutes,
} from 'date-fns'
import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { useHistory } from 'react-router-dom'
import * as yup from 'yup'
import config from '../../config/prod'
import { formatStringForDBDate, useIsFirstRender } from '../../utils'
import useFetch from '../../utils/useFetch'
import { PatientForm } from '../patient/patientUtils'
import { Patient } from '../patient/types'
import { Modal } from '../UI'
import {
	AsyncSelect,
	Select,
	selectLoadOptions,
	SelectOption,
	yupSelect,
} from '../UI/Select'
import { Appointment } from './types'

export const START_HOUR = 9 // Hour start of day
export const END_HOUR = 17 // Hour end of day
export const MINUTE_STEP = 30 // Minute interval for time slots
function genStartTimes(date: Date) {
	return eachMinuteOfInterval(
		{
			start: setHours(date.setHours(0), START_HOUR),
			end: setMinutes(setHours(date.setHours(0), END_HOUR - 1), 45),
		},
		{ step: MINUTE_STEP / 2 }
	)
}
export const START_TIMES = genStartTimes(new Date())

interface Inputs {
	date: string
	start: SelectOption<string> | null
	end: SelectOption<string> | null
	patient: SelectOption<number> | null
	notes: string
}

yup.setLocale(config.yupLocale)
const schema = yup.object().shape({
	date: yup.string().required(),
	start: yupSelect().required(),
	end: yupSelect().required(),
	patient: yupSelect(yup.number()).required(),
	notes: yup.string(),
})

const emptyValues = {
	date: format(new Date(), 'P'),
	start: null,
	end: null,
	patient: null,
	notes: '',
}

const patientOption = (patient: Patient) => {
	const name = `${patient.first_name} ${patient.last_name}`
	return {
		value: patient.id,
		search: `${name} ${patient.email}`,
		label: (
			<span>
				{`${name} `}
				<span className="option-sub-label">
					{patient.email}
					<span className="hide-on-select">
						<br />
						{patient.dob}
					</span>
				</span>
			</span>
		),
	}
}

const apmtFormOptions = {
	disableCreateInThePast: false,
}
interface AppointmentFormProps {
	onDone: () => void
	updateItem?: Appointment | null
	initDate?: Date
}
function AppointmentForm({
	onDone,
	updateItem,
	initDate,
}: AppointmentFormProps) {
	const appFetch = useFetch()
	const history = useHistory()
	const isFirstRender = useIsFirstRender()
	const [addPatientIsOpen, setAddPatientIsOpen] = useState<boolean>(false)
	const [addPatientName, setAddPatientName] = useState<string>('')
	const [startTimes, setStartTimes] = useState<Date[]>(START_TIMES)
	const [blockedSlots, setBlockedSlots] = useState<Interval[]>([])
	const isUpdate = updateItem != null

	// Prefill if updating
	let curValues = {}
	if (updateItem != null) {
		const startDate = parseISO(updateItem.start)
		const endDate = parseISO(updateItem.end)
		const date = startDate
		const startVal = format(startDate, 'p')
		const endVal = format(endDate, 'p')
		curValues = {
			date: format(date, 'P'),
			start: { value: startVal, label: startVal },
			end: { value: endVal, label: endVal },
			patient: patientOption(updateItem.patient),
			notes: updateItem.notes,
		}
	}
	const defaultValues = isUpdate
		? curValues
		: { ...emptyValues, ...(initDate && { date: format(initDate, 'P') }) }

	const {
		handleSubmit,
		watch,
		control,
		setValue,
		reset,
		setFocus,
		setError,
		formState: { errors },
	} = useForm<Inputs>({ defaultValues, resolver: yupResolver(schema) })

	const onSubmit: SubmitHandler<Inputs> = async (formData) => {
		const { date, start, end, patient, notes } = formData
		const startDate = start ? parse(start.value, 'p', new Date(date)) : null
		const endDate = end ? parse(end.value, 'p', new Date(date)) : null

		const body = {
			start: startDate && formatISO(startDate),
			end: endDate && formatISO(endDate),
			patient: patient?.value,
			notes,
		}

		let fetchString = '/api/appointments'
		if (isUpdate) fetchString += `/${updateItem?.id}`
		const method = isUpdate ? 'PUT' : 'POST'

		const { fieldErrs, ok } = await appFetch(
			fetchString,
			{ method, body: JSON.stringify(body) },
			{ getFieldErrs: true }
		)

		if (!ok) {
			fieldErrs.forEach((err) => {
				setError(err.name, err.error, { shouldFocus: true })
			})
			return
		}

		onDone()
		if (!isUpdate) reset()
	}

	const deleteAppointment = async () => {
		if (updateItem == null) return
		const { ok } = await appFetch(`/api/appointments/${updateItem.id}`, {
			method: 'DELETE',
		})

		if (!ok) return
		history.replace('/clinic')
	}

	// Patient
	const patientToOptions = (data: Patient[]) => {
		return data.map((patient: Patient) => {
			return patientOption(patient)
		})
	}

	// Start & End
	const dateVal = watch('date')
	const startVal = watch('start')?.value
	const startTimeVal = startVal
		? parse(startVal, 'p', new Date(dateVal).setHours(0))
		: null

	const getPossibleStarts = async () => {
		const { data, ok } = await appFetch(
			`/api/appointments?start_after=${dateVal}&start_before=${dateVal}`
		)
		if (!ok) return

		const blockedSlotsList: Interval[] = data.flatMap((aps: Appointment) => {
			if (isUpdate && aps.id === updateItem?.id) return [] // when editing dont block off own times
			return {
				start: parseISO(aps.start),
				end: subMinutes(parseISO(aps.end), 1),
			}
		})
		const sortedBlockedSlots = blockedSlotsList.sort((a, b) =>
			compareAsc(a.start, b.start)
		)
		setBlockedSlots(sortedBlockedSlots)
	}

	// Handle start times and blocked slots based on selected date
	useEffect(() => {
		const newstartTimes = genStartTimes(new Date(dateVal))

		getPossibleStarts()
		setStartTimes(newstartTimes)
		if (!isFirstRender) {
			setValue('start', null)
			setValue('end', null)
		}
	}, [dateVal])

	useEffect(() => {
		if (startVal != null && !isFirstRender) {
			setFocus('end')
		}
	}, [startVal])

	// "start" & "end" options setup
	const startOptions = startTimes.flatMap((time) => {
		const label = format(time, 'p')
		const isPast = new Date() > time
		const isDisabled = blockedSlots.some((x) => isWithinInterval(time, x))

		if (isPast && apmtFormOptions.disableCreateInThePast) return []
		return { value: label, label, isDisabled }
	})

	// Ensure user cant use "end" time after blocked (used) slots
	const firstBlockAfterStart = startTimeVal
		? blockedSlots.find((x) => startTimeVal <= x.start)
		: null

	const lastEndTime = [setHours(new Date(dateVal).setHours(0), END_HOUR)]
	const endOptions = [...startTimes, ...lastEndTime].flatMap((time) => {
		if (startTimeVal && startTimeVal >= time) return [] // only return ends after start
		const label = format(time, 'p')
		const isBlocked = firstBlockAfterStart && time > firstBlockAfterStart.start
		const isOccupied = blockedSlots.some((x) =>
			isWithinInterval(subMinutes(time, 1), x)
		)
		const isDisabled = isBlocked || isOccupied

		return { value: label, label, isDisabled }
	})

	return (
		<div>
			{addPatientIsOpen && (
				<Modal
					closeFunc={() => setAddPatientIsOpen(false)}
					isOpen={addPatientIsOpen}
					options={{
						closeOnOutClick: false,
					}}
				>
					<PatientForm
						defaultName={addPatientName}
						onDone={(newPatient) => {
							setAddPatientIsOpen(false)
							setValue('patient', patientOption(newPatient))
						}}
						onCancel={() => setAddPatientIsOpen(false)}
					/>
				</Modal>
			)}
			<form className="form-g" onSubmit={handleSubmit(onSubmit)}>
				<h3 className="header-g">
					{isUpdate ? 'Appointment' : 'New appointment'}
				</h3>

				<div className="input-wrap-g">
					<div className="input-label">Date</div>
					<Controller
						name="date"
						control={control}
						render={({ field }) => (
							<DatePicker
								{...field}
								className="input-g"
								selected={new Date(dateVal)}
								onChange={(date: Date) => {
									setValue('date', format(date, 'P'))
								}}
							/>
						)}
					/>
					<div className="input-message">{errors.date?.message}</div>
				</div>

				<div className="col-2">
					<div className="input-wrap-g">
						<div className="input-label">Start</div>
						<Controller
							name="start"
							control={control}
							render={({ field }) => (
								<Select {...field} openMenuOnFocus options={startOptions} />
							)}
						/>
						<div className="input-message">{errors.start?.message}</div>
					</div>

					<div className="input-wrap-g">
						<div className="input-label">End</div>
						<Controller
							name="end"
							control={control}
							render={({ field }) => (
								<Select
									{...field}
									openMenuOnFocus
									isDisabled={startVal == null}
									options={endOptions}
								/>
							)}
						/>
						<div className="input-message">{errors.end?.message}</div>
					</div>
				</div>

				<div className="input-wrap-g">
					<div className="input-label">Patient</div>
					<Controller
						name="patient"
						control={control}
						render={({ field }) => (
							<AsyncSelect
								{...field}
								useCreate
								loadOptions={(input: string) => {
									const formattedInput = formatStringForDBDate(input)
									return selectLoadOptions(
										formattedInput,
										`/api/patients?search=${formattedInput}`,
										patientToOptions
									)
								}}
								onCreateOption={(input: string) => {
									setAddPatientName(input)
									setAddPatientIsOpen(true)
								}}
							/>
						)}
					/>
					<div className="input-message">{errors.patient?.message}</div>
				</div>

				{/* need to wrap in Controller to have proper order focus https://github.com/react-hook-form/react-hook-form/issues/3232 */}
				<div className="input-wrap-g">
					<div className="input-label">
						Notes <span className="faded-g">(Optional)</span>
					</div>
					<Controller
						name="notes"
						control={control}
						render={({ field }) => (
							<textarea {...field} rows={5} className="input-g" />
						)}
					/>
					<div className="input-message">{errors.notes?.message}</div>
				</div>

				<div className="footer-btns">
					{isUpdate && (
						<button
							className="btn-g danger"
							type="button"
							onClick={() => deleteAppointment()}
						>
							Delete
						</button>
					)}
					<button
						className="btn-g faded"
						type="button"
						onClick={() => onDone()}
					>
						Cancel
					</button>
					<button className="btn-g primary" type="submit">
						{isUpdate ? 'Update' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	)
}
AppointmentForm.defaultProps = {
	updateItem: null,
	initDate: new Date(),
}

export { AppointmentForm }
