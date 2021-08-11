import React from 'react'
import { Route, Switch, useRouteMatch } from 'react-router-dom'
import Patient from '../components/patient/Patient'
import PatientsList from '../components/patient/PatientsList'
import { ErrorPage } from './error'

const PatientsPage = () => {
	const { path } = useRouteMatch()

	return (
		<Switch>
			<Route exact path={`${path}/`}>
				<div>
					<h1 className="header-g">Patients</h1>
					<PatientsList />
				</div>
			</Route>
			<Route exact path={`${path}/:id`}>
				<div className="content-section-g screen-centered">
					<Patient />
				</div>
			</Route>
			<Route path="*">
				<div>
					<ErrorPage code={404} />
				</div>
			</Route>
		</Switch>
	)
}

export default PatientsPage
