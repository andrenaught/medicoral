import React from 'react'
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom'
import Appointment from '../components/appointment/Appointment'
import { ErrorPage } from './error'

const AppointmentsPage = () => {
	const { path } = useRouteMatch()

	return (
		<Switch>
			<Route exact path={`${path}/`}>
				<Redirect to="/clinic" />
			</Route>
			<Route exact path={`${path}/:id`}>
				<div className="content-section-g screen-centered">
					<Appointment />
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

export default AppointmentsPage
