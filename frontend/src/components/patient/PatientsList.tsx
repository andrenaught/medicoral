import { intervalToDuration } from 'date-fns'
import { useEffect, useState } from 'react'
import { formatPhoneNumber } from 'react-phone-number-input'
import { Link } from 'react-router-dom'
import useFetch from '../../utils/useFetch'
import { Patient } from './types'

function PatientList() {
	const appFetch = useFetch()
	const [patients, setPatients] = useState<Patient[]>([])

	const getPatients = async () => {
		const { data, ok } = await appFetch('/api/patients')

		if (!ok) return

		setPatients(data)
	}

	useEffect(() => {
		getPatients()
	}, [])

	return (
		<div className="box-g">
			<div style={{ overflow: 'auto' }}>
				<table>
					<thead>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Phone</th>
							<th>Age</th>
							<th>dob</th>
							<th title="New patient">NP</th>
							<th>Sex</th>
						</tr>
					</thead>
					<tbody>
						{patients.map((patient) => {
							const name = `${patient.first_name} ${patient.last_name}`
							const age =
								patient.dob &&
								intervalToDuration({
									start: new Date(),
									end: new Date(patient.dob),
								}).years

							return (
								<tr key={patient.id}>
									<td className="td-w-inner-g">
										<Link to={`patients/${patient.id}`} className="link-g">
											{name}
										</Link>
									</td>
									<td>{patient.email}</td>
									<td>{formatPhoneNumber(patient.phone || '')}</td>
									<td>{age}</td>
									<td>{patient.dob}</td>
									<td>{patient.is_new ? 'Y' : 'N'}</td>
									<td>{patient.sex}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default PatientList
