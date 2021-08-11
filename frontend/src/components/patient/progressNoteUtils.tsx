import { yupResolver } from '@hookform/resolvers/yup'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form'
import { IoChevronDown } from 'react-icons/io5'
import * as yup from 'yup'
import config from '../../config/prod'
import useFetch from '../../utils/useFetch'
import {
	AsyncSelect,
	selectLoadOptions,
	SelectOption,
	yupSelect,
} from '../UI/Select'
import { PatientInfo } from './patientUtils'
import sty from './ProgressNote.module.scss'
import { Patient } from './types'

interface Inputs {
	weight: number
	heightFoot: number
	heightInch: number
	blood_pressure_sys: number
	blood_pressure_dia: number
	chief_complaint: string
	allergies: SelectOption<number>[] | null
	medical_history: string
	medication: SelectOption<number>[] | null
	diagnoses: SelectOption<number>[] | null
	treatment: string
	doctors_orders: string
}

yup.setLocale(config.yupLocale)
const yupEmptyStringToNull = (val: string, orig: string) =>
	orig === '' ? null : val
const nullableNumber = yup.number().transform(yupEmptyStringToNull).nullable()
const schema = yup.object().shape({
	weight: nullableNumber.required(),
	heightFoot: nullableNumber.required(),
	heightInch: nullableNumber.required(),
	blood_pressure_sys: nullableNumber.required(),
	blood_pressure_dia: nullableNumber.required(),
	chief_complaint: yup.string(),
	allergies: yup.array().of(yupSelect(yup.number())),
	medical_history: yup.string(),
	medication: yup.array().of(yupSelect(yup.number())),
	diagnoses: yup.array().of(yupSelect(yup.number())),
	treatment: yup.string(),
	doctors_orders: yup.string(),
})
interface ProgressNoteFormProps {
	patient: Patient
	onDone: () => void
	onCancel: () => void
	id?: number
}
function ProgressNoteForm({
	patient,
	onDone,
	onCancel,
	id,
}: ProgressNoteFormProps) {
	const appFetch = useFetch()
	const readOnly = Boolean(id)

	const [allergyInputIsLoading, setAllergyInputIsLoading] =
		useState<boolean>(false)
	const [currMedsInputIsLoading, setCurrMedsInputIsLoading] =
		useState<boolean>(false)
	const [diagnosesInputIsLoading, setDiagnosesInputIsLoading] =
		useState<boolean>(false)
	const [doctorsInputsIsOpen, setDoctorsInputsIsOpen] =
		useState<boolean>(readOnly)

	const {
		register,
		handleSubmit,
		setError,
		setValue,
		control,
		formState: { errors },
	} = useForm<Inputs>({
		resolver: yupResolver(schema),
	})

	const [allergiesVal, currMedsVal, diagnosesVal] = useWatch({
		control,
		name: ['allergies', 'medication', 'diagnoses'],
	})

	const onSubmit: SubmitHandler<Inputs> = async (formData) => {
		const { heightFoot, heightInch, allergies, medication, diagnoses } =
			formData
		const heightCM = (heightFoot / 0.032808 + heightInch / 0.3937).toFixed(2)
		const allergiesIds = allergies?.map((option) => option.value) || []
		const medicationIds = medication?.map((option) => option.value) || []
		const diagnosesIds = diagnoses?.map((option) => option.value) || []
		const body = {
			...formData,
			patient: patient.id,
			height: heightCM,
			allergies: allergiesIds,
			medication: medicationIds,
			diagnoses: diagnosesIds,
		}

		const fetchString = '/api/progress_notes'
		const method = 'POST'

		const { ok, fieldErrs } = await appFetch(
			fetchString,
			{ method, body: JSON.stringify(body) },
			{ getFieldErrs: true }
		)
		if (!ok) {
			fieldErrs.forEach((err) =>
				setError(err.name, err.error, { shouldFocus: true })
			)
			return
		}

		onDone()
	}

	const toSelectOptionArray = (arr: { id: number; name: string }[]) => {
		return arr?.map((x) => ({ value: x.id, label: x.name })) || []
	}

	const prefillProgressNote = async (fromId?: number) => {
		let fetchString = `/api/progress_notes?patient=${patient.id}&limit=1&ordering=-id`
		if (fromId) fetchString = `/api/progress_notes/${fromId}`
		const { data, ok } = await appFetch(fetchString)
		if (!ok) return

		if (!fromId && data.results.length === 0) return
		const pNote = fromId ? data : data.results[0]
		const heightTotalFeet = (pNote.height * 0.3937) / 12
		const heightFoot = Math.floor(heightTotalFeet)
		const heightInch = Math.round((heightTotalFeet - heightFoot) * 12)

		const toFill = {
			blood_pressure_dia: pNote.blood_pressure_dia,
			blood_pressure_sys: pNote.blood_pressure_sys,
			weight: pNote.weight,
			heightFoot,
			heightInch,
			allergies: toSelectOptionArray(pNote.allergies),
			medical_history: pNote.medical_history,
			medication: toSelectOptionArray(pNote.medication),
			diagnoses: toSelectOptionArray(pNote.diagnoses),
			...(fromId && {
				chief_complaint: pNote.chief_complaint,
				treatment: pNote.treatment,
				doctors_orders: pNote.doctors_orders,
			}),
		}

		Object.entries(toFill).forEach(([key, value]: any) => {
			setValue(key, value)
		})

		// Sanity check to ensure patient displayed next to the form is who the progress form is for
		if (patient.id !== pNote.patient) {
			throw Error(
				'Patient provided in component does not match patient in progress note'
			)
		}
	}

	useEffect(() => {
		if (!readOnly) return
		prefillProgressNote(id)
	}, [id])

	useEffect(() => {
		if (readOnly) return
		// prefill based on patients last progress note
		prefillProgressNote()
	}, [patient])

	const nameIdToOptions = (data: { id: number; name: string }[]) => {
		return data.map((item: { id: number; name: string }) => {
			return { label: item.name, value: item.id }
		})
	}

	const createSelectItem = async (
		input: string,
		{
			fieldName,
			fieldVal,
			fieldSetLoading,
		}: {
			fieldName: keyof Inputs
			fieldVal: SelectOption<number>[] | null
			fieldSetLoading: React.Dispatch<React.SetStateAction<boolean>>
		}
	) => {
		if (input === '') return
		const body = { name: input }

		fieldSetLoading(true)
		const { fieldErrs, data, ok } = await appFetch(
			`/api/${fieldName}`,
			{ method: 'POST', body: JSON.stringify(body) },
			{ getFieldErrs: true }
		)
		fieldSetLoading(false)
		if (!ok) {
			fieldErrs.forEach((err) => {
				setError(fieldName, err.error, { shouldFocus: true })
			})
			return
		}

		const { name } = data
		setValue(fieldName, [
			...(fieldVal || []),
			{ value: data.id, label: name, search: name },
		])
	}
	const createAllergy = async (input: string) => {
		if (_.isString(allergiesVal)) return
		await createSelectItem(input, {
			fieldName: 'allergies',
			fieldVal: allergiesVal,
			fieldSetLoading: setAllergyInputIsLoading,
		})
	}
	const createMedication = async (input: string) => {
		if (_.isString(currMedsVal)) return
		await createSelectItem(input, {
			fieldName: 'medication',
			fieldVal: currMedsVal,
			fieldSetLoading: setCurrMedsInputIsLoading,
		})
	}
	const createDiagnoses = async (input: string) => {
		if (_.isString(diagnosesVal)) return
		await createSelectItem(input, {
			fieldName: 'diagnoses',
			fieldVal: diagnosesVal,
			fieldSetLoading: setDiagnosesInputIsLoading,
		})
	}

	return (
		<div className={sty.container}>
			<div className="box-g" style={{ height: 'min-content' }}>
				<form className="form-g large" onSubmit={handleSubmit(onSubmit)}>
					<h3 className="header-g">Progress Note</h3>
					<div className="col-2">
						<div className="input-wrap-g">
							<label>
								<div className="input-label">Weight</div>
								<input
									{...register('weight')}
									className="input-g"
									disabled={readOnly}
									type="number"
									step="0.01"
								/>
							</label>
							<div className="input-message">{errors.weight?.message}</div>
						</div>
						<div className="col-2">
							<div className="input-wrap-g">
								<label>
									<div className="input-label">Height - ft</div>
									<input
										{...register('heightFoot')}
										className="input-g"
										disabled={readOnly}
										type="number"
									/>
								</label>
								<div className="input-message">
									{errors.heightFoot?.message}
								</div>
							</div>
							<div className="input-wrap-g">
								<label>
									<div className="input-label">Height - in</div>
									<input
										{...register('heightInch')}
										className="input-g"
										disabled={readOnly}
									/>
								</label>
								<div className="input-message">
									{errors.heightInch?.message}
								</div>
							</div>
						</div>
					</div>
					<div className="col-2">
						<div className="col-2">
							<div className="input-wrap-g">
								<label>
									<div className="input-label">BP - Systolic</div>
									<input
										{...register('blood_pressure_sys')}
										className="input-g"
										disabled={readOnly}
										type="number"
									/>
								</label>
								<div className="input-message">
									{errors.blood_pressure_sys?.message}
								</div>
							</div>
							<div className="input-wrap-g">
								<label>
									<div className="input-label">BP - Diastolic</div>
									<input
										{...register('blood_pressure_dia')}
										className="input-g"
										disabled={readOnly}
									/>
								</label>
								<div className="input-message">
									{errors.blood_pressure_dia?.message}
								</div>
							</div>
						</div>
					</div>

					<div className="input-wrap-g">
						<label>
							<div className="input-label">Chief complaint</div>
							<textarea
								{...register('chief_complaint')}
								className="input-g"
								disabled={readOnly}
								maxLength={254}
							/>
						</label>
						<div className="input-message">
							{errors.chief_complaint?.message}
						</div>
					</div>
					<div className="separator-g hidden" />
					<h4 className="header-g">History</h4>
					<div className="input-wrap-g">
						<Controller
							name="allergies"
							control={control}
							render={({ field }) => (
								<label htmlFor="allergies-select">
									<div className="input-label">Allergies</div>
									<AsyncSelect
										id="allergies-select"
										{...field}
										isDisabled={readOnly}
										useCreate
										isMulti
										loadOptions={(input: string) =>
											selectLoadOptions(
												input,
												`/api/allergies?search=${input}`,
												nameIdToOptions
											)
										}
										onCreateOption={(input: string) => createAllergy(input)}
										isLoading={allergyInputIsLoading}
									/>
								</label>
							)}
						/>
						<div className="input-message">{errors.allergies?.message}</div>
					</div>
					<div className="input-wrap-g">
						<label>
							<div className="input-label">Medical history</div>
							<textarea
								className="input-g"
								{...register('medical_history')}
								disabled={readOnly}
							/>
						</label>
						<div className="input-message">
							{errors.medical_history?.message}
						</div>
					</div>
					<div className="input-wrap-g">
						<Controller
							name="medication"
							control={control}
							render={({ field }) => (
								<label htmlFor="medication-select">
									<div className="input-label">Current medication</div>
									<AsyncSelect
										id="medication-select"
										{...field}
										isDisabled={readOnly}
										useCreate
										isMulti
										loadOptions={(input: string) =>
											selectLoadOptions(
												input,
												`/api/medication?search=${input}`,
												nameIdToOptions
											)
										}
										onCreateOption={(input: string) => createMedication(input)}
										isLoading={currMedsInputIsLoading}
									/>
								</label>
							)}
						/>
						<div className="input-message">{errors.medication?.message}</div>
					</div>
					<div className="input-wrap-g">
						<Controller
							name="diagnoses"
							control={control}
							render={({ field }) => (
								<label htmlFor="diagnoses-select">
									<div className="input-label">Diagnoses</div>
									<AsyncSelect
										id="diagnoses-select"
										{...field}
										isDisabled={readOnly}
										useCreate
										isMulti
										loadOptions={(input: string) =>
											selectLoadOptions(
												input,
												`/api/diagnoses?search=${input}`,
												nameIdToOptions
											)
										}
										onCreateOption={(input: string) => createDiagnoses(input)}
										isLoading={diagnosesInputIsLoading}
									/>
								</label>
							)}
						/>
						<div className="input-message">{errors.diagnoses?.message}</div>
					</div>
					{!doctorsInputsIsOpen && (
						<div>
							<button
								type="button"
								className="btn-g primary"
								onClick={() => setDoctorsInputsIsOpen(true)}
							>
								Doctor&apos;s Fields <IoChevronDown className="icon" />
							</button>
						</div>
					)}
					{doctorsInputsIsOpen && (
						<>
							<div className="separator-g hidden" />
							<h4 className="header-g">Plan</h4>
							<div className="input-wrap-g">
								<label>
									<div className="input-label">Treatment</div>
									<textarea
										{...register('treatment')}
										className="input-g"
										disabled={readOnly}
										maxLength={254}
									/>
								</label>
								<div className="input-message">{errors.treatment?.message}</div>
							</div>
							<div className="input-wrap-g">
								<label>
									<div className="input-label">Doctor&apos;s orders</div>
									<textarea
										{...register('doctors_orders')}
										className="input-g"
										disabled={readOnly}
										maxLength={254}
									/>
								</label>
								<div className="input-message">
									{errors.doctors_orders?.message}
								</div>
							</div>
						</>
					)}
					{!readOnly && (
						<div className="footer-btns">
							<button
								className="btn-g faded"
								type="button"
								onClick={() => onCancel()}
							>
								Cancel
							</button>
							{doctorsInputsIsOpen && (
								<button className="btn-g primary" type="submit">
									Create
								</button>
							)}
						</div>
					)}
				</form>
			</div>
			<div className="box-g" style={{ height: 'min-content' }}>
				<PatientInfo patient={patient} />
			</div>
		</div>
	)
}
ProgressNoteForm.defaultProps = {
	id: false,
}

export { ProgressNoteForm }
