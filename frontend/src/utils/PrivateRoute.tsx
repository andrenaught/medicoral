/* eslint react/jsx-props-no-spreading: 0 */
// A wrapper for <Route> that redirects to the login screen if you're not yet authenticated.

import React from 'react'
import { Redirect, Route, RouteProps } from 'react-router-dom'
import { useAuthContext } from '../Store'

interface PrivateRouteProps extends RouteProps {
	children?: React.ReactNode
}
function PrivateRoute({ children, ...rest }: PrivateRouteProps) {
	const { accessToken } = useAuthContext()

	return (
		<Route
			{...rest}
			render={({ location }) =>
				accessToken ? (
					children
				) : (
					<Redirect to={{ pathname: '/login', state: { from: location } }} />
				)
			}
		/>
	)
}
PrivateRoute.defaultProps = {
	children: null,
}

export default PrivateRoute
