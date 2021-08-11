import { yupResolver } from '@hookform/resolvers/yup'
import { isMatch, isPast, parse } from 'date-fns'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import {
	formatPhoneNumber,
	isPossiblePhoneNumber,
} from 'react-phone-number-input'
import { Link } from 'react-router-dom'
import * as yup from 'yup'
import config from '../../config/prod'
import useFetch from '../../utils/useFetch'
import { PhoneInput } from '../UI'
import {
	AsyncSelect,
	Select,
	selectLoadOptions,
	SelectOption,
	yupSelect,
} from '../UI/Select'
import { Patient } from './types'

interface Inputs {
	first_name: string
	last_name: string
	dob: string
	sex: SelectOption<string> | null
	phone: string
	email: string
	insurance_provider: SelectOption<number> | null
	insurance_member_id: string
}

const sexOptions = [
	{ value: 'M', label: 'Male' },
	{ value: 'F', label: 'Female' },
]

yup.setLocale(config.yupLocale)
const schema = yup.object().shape({
	first_name: yup.string().required(),
	last_name: yup.string().required(),
	dob: yup
		.string()
		.required()
		.test('is-date', 'Not a valid date (MM/DD/YYYY)', (val) =>
			isMatch(val || '', 'M/d/yyyy')
		)
		.test('is-past', 'Date must be in the past', (val) =>
			isPast(parse(val || '', 'M/d/yyyy', new Date()))
		),
	sex: yupSelect(),
	phone: yup
		.string()
		.nullable()
		.test(
			'is-phonenumber',
			'Not a valid phone number',
			(val) => !val || isPossiblePhoneNumber(val || '')
		),
	email: yup.string().email().nullable(),
	insurance_provider: yupSelect(yup.number()),
	insurance_member_id: yup.string().nullable(),
})

const emptyValues = {
	first_name: '',
	last_name: '',
	dob: '',
	sex: null,
	phone: '',
	email: '',
	insurance_provider: null,
	insurance_member_id: '',
}

interface PatientFormProps {
	onDone: (newPatient: Patient) => void
	defaultName?: string
	onCancel: () => void
	updateItem?: Patient | null
	showAllFields?: boolean
}
function PatientForm({
	onDone,
	onCancel,
	defaultName,
	updateItem,
	showAllFields,
}: PatientFormProps) {
	const appFetch = useFetch()
	const [insuranceProvIsLoading, setInsuranceProvIsLoading] = useState(false)
	const [defaultFName, defaultLName] = defaultName?.split(' ') || ['', '']
	const isUpdate = updateItem != null

	// Prefill if updating
	let curValues = {}
	if (updateItem != null) {
		const { insurance_provider } = updateItem
		curValues = {
			...updateItem,
			sex: sexOptions.find((x) => x.value === updateItem.sex),
			insurance_provider: insurance_provider && {
				value: insurance_provider.id,
				label: insurance_provider.name,
			},
		}
	}
	const defaultValues = isUpdate
		? curValues
		: { ...emptyValues, first_name: defaultFName, last_name: defaultLName }

	const {
		register,
		handleSubmit,
		setFocus,
		setError,
		setValue,
		reset,
		control,
		formState: { errors },
	} = useForm<Inputs>({
		defaultValues,
		resolver: yupResolver(schema),
	})

	useEffect(() => {
		if (!defaultFName) {
			setFocus('first_name')
		} else if (!defaultLName) {
			setFocus('last_name')
		} else {
			setFocus('dob')
		}
	}, [])

	const insuranceToOptions = (data: { id: number; name: string }[]) => {
		return data.map((insurance: { id: number; name: string }) => {
			const { name, id } = insurance
			return { label: name, value: id }
		})
	}

	const createInsuranceProv = async (input: string) => {
		if (input === '') return
		const body = { name: input }

		setInsuranceProvIsLoading(true)
		const { fieldErrs, data, ok } = await appFetch(
			'/api/insurance_providers',
			{ method: 'POST', body: JSON.stringify(body) },
			{ getFieldErrs: true }
		)
		setInsuranceProvIsLoading(false)
		if (!ok) {
			fieldErrs.forEach((err) => {
				setError('insurance_provider', err.error, { shouldFocus: true })
			})
			return
		}

		const { id, name } = data
		setValue('insurance_provider', { value: id, label: name, search: name })
	}

	const onSubmit: SubmitHandler<Inputs> = async (formData) => {
		const body = {
			...formData,
			sex: formData.sex?.value,
			insurance_provider: formData.insurance_provider?.value,
		}

		let fetchString = '/api/patients'
		if (isUpdate) fetchString += `/${updateItem?.id}`
		const method = isUpdate ? 'PUT' : 'POST'

		const { data, ok, fieldErrs } = await appFetch(
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

		onDone(data)
		if (!isUpdate) reset()
	}

	let classList = 'form-g large'
	if (showAllFields) classList += ' short-input-labels'

	return (
		<div>
			<form className={classList} onSubmit={handleSubmit(onSubmit)}>
				<h3 className="header-g">{isUpdate ? 'Patient' : 'New patient'}</h3>
				<div className="col-2">
					<div className="input-wrap-g">
						<label>
							<div className="input-label">First name</div>
							<input
								className="input-g"
								{...register('first_name')}
								type="text"
							/>
						</label>
						<div className="input-message">{errors.first_name?.message}</div>
					</div>
					<div className="input-wrap-g">
						<label>
							<div className="input-label">Last name</div>
							<input
								className="input-g"
								{...register('last_name')}
								type="text"
							/>
						</label>
						<div className="input-message">{errors.last_name?.message}</div>
					</div>
				</div>

				<div className="col">
					<div className="input-wrap-g">
						<label>
							<div className="input-label">DOB</div>
							<input className="input-g" {...register('dob')} type="text" />
						</label>
						<div className="input-message">{errors.dob?.message}</div>
					</div>
					{showAllFields && (
						<div className="input-wrap-g">
							<div className="input-label">Sex</div>
							<Controller
								name="sex"
								control={control}
								render={({ field }) => (
									<Select {...field} options={sexOptions} />
								)}
							/>
							<div className="input-message">{errors.sex?.message}</div>
							<div className="input-message">
								{(errors.sex as any)?.value?.message}
							</div>
						</div>
					)}
				</div>

				<div className="input-wrap-g">
					<div className="input-label">
						Phone number <span className="faded-g">(Optional)</span>
					</div>
					<Controller
						name="phone"
						control={control}
						render={({ field }) => (
							<PhoneInput {...field} className="input-g" />
						)}
					/>
					<div className="input-message">{errors.phone?.message}</div>
				</div>
				{showAllFields && (
					<div className="input-wrap-g">
						<div className="input-label">
							Email <span className="faded-g">(Optional)</span>
						</div>
						<input className="input-g" {...register('email')} type="email" />
						<div className="input-message">{errors.email?.message}</div>
					</div>
				)}

				<div className="col-2">
					<div className="input-wrap-g">
						<div className="input-label">
							Insurance provider <span className="faded-g">(Optional)</span>
						</div>
						<Controller
							name="insurance_provider"
							control={control}
							render={({ field }) => (
								<AsyncSelect
									{...field}
									useCreate
									isValidNewOption={(input: string) => input !== ''}
									loadOptions={(input: string) =>
										selectLoadOptions(
											input,
											`/api/insurance_providers?search=${input}`,
											insuranceToOptions
										)
									}
									onCreateOption={(input: string) => {
										createInsuranceProv(input)
									}}
									isLoading={insuranceProvIsLoading}
								/>
							)}
						/>
						<div className="input-message">
							{errors.insurance_provider?.message}
						</div>
					</div>
					<div className="input-wrap-g">
						<div className="input-label">
							Insurance member ID <span className="faded-g">(Optional)</span>
						</div>
						<input
							className="input-g"
							{...register('insurance_member_id')}
							type="text"
						/>
						<div className="input-message">
							{errors.insurance_member_id?.message}
						</div>
					</div>
				</div>
				<div className="footer-btns">
					<button
						className="btn-g faded"
						type="button"
						onClick={() => onCancel()}
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
PatientForm.defaultProps = {
	updateItem: null,
	showAllFields: false,
	defaultName: '',
}

function PatientInfo({
	patient,
	type,
}: {
	patient: Patient
	type?: 'main' | 'simple'
}) {
	const {
		id,
		is_new,
		sex,
		dob,
		first_name,
		last_name,
		insurance_provider,
		insurance_member_id,
		email,
		phone,
	} = patient
	const name = `${first_name} ${last_name}`

	return (
		<div style={{ wordBreak: 'break-word' }}>
			{type === 'main' && <h3>{name}</h3>}
			{type === 'simple' && (
				<h4 className="header-g flex-g">
					<span>Patient</span>
				</h4>
			)}
			<div className="info-section-g">
				{type === 'simple' && (
					<div className="info-item">
						<Link to={`/patients/${id}`} className="link-g">
							{name}
						</Link>
					</div>
				)}
				<div className="info-item">
					{sex && <span>{sex} - </span>}
					<span>{dob}</span>
				</div>
			</div>

			{type === 'main' && (
				<div className="info-section-g">
					<div className="info-item">
						{is_new && (
							<div className="tag-g">
								<span className="text">New Patient</span>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="separator-g" />

			<div className="info-section-g">
				<h5 className="label-g">Contact</h5>
				{!email && !phone && <div className="faded-g">N/A</div>}
				<div className="info-item">{email}</div>
				{phone && <div className="info-item">{formatPhoneNumber(phone)}</div>}
			</div>

			<div className="info-section-g">
				<h5 className="label-g">Insurance</h5>
				{!insurance_provider && !insurance_member_id && (
					<div className="faded-g">N/A</div>
				)}
				{insurance_provider && (
					<div className="info-item">{insurance_provider.name}</div>
				)}
				<div className="info-item">{insurance_member_id}</div>
			</div>
		</div>
	)
}
PatientInfo.defaultProps = {
	type: 'main',
}

export { PatientForm, PatientInfo }
