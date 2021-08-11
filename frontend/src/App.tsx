import { useEffect, useState } from 'react'
import { BsHouse } from 'react-icons/bs'
import { FiHelpCircle, FiUsers } from 'react-icons/fi'
import {
	BrowserRouter as Router,
	Route,
	Switch,
	useHistory,
	useLocation,
} from 'react-router-dom'
import AppSideMenu from './components/layout/AppSideMenu'
import Appointments from './pages/appointments'
import Clinic from './pages/clinic'
import { ErrorPage } from './pages/error'
import Help from './pages/help'
// Pages
import Index from './pages/index'
import { LoginPage } from './pages/login'
import Patients from './pages/patients'
import Logout from './pages/redirects/logout'
import { useAuthContext } from './Store'
import './styles/_app.scss'
import PrivateRoute from './utils/PrivateRoute'
import useFetch from './utils/useFetch'

const MenuItems = [
	{ name: 'Clinic', path: '/clinic', logo: BsHouse },
	{ name: 'Patients', path: '/patients', logo: FiUsers },
	{ name: 'Help', path: '/help', logo: FiHelpCircle },
]

// Cannot use history in initial render, so using this Init component
const Init = ({
	isLoggedIn,
	userNotFound,
}: {
	isLoggedIn: boolean
	userNotFound: boolean
}) => {
	const history = useHistory()
	const { pathname } = useLocation()
	useEffect(() => {
		// if their arrival route is homepage
		if (pathname === '/' && isLoggedIn) {
			history.replace('/clinic')
		}
	}, [])
	useEffect(() => {
		// if user not found
		if (userNotFound) {
			history.replace('/logout')
		}
	}, [userNotFound])
	return null
}

function App() {
	const appFetch = useFetch()
	const { accessToken, setUser } = useAuthContext()
	const isLoggedIn = Boolean(accessToken)
	const [userNotFound, setUserNotFound] = useState(false)

	useEffect(() => {
		const getUser = async () => {
			if (!accessToken) return null
			const { data, ok } = await appFetch('/api/auth/users/me/')
			if (!ok) {
				setUserNotFound(true)
				return false
			}
			setUser(data.user)
			return true
		}
		getUser()
	}, [])

	let classList = ''
	if (isLoggedIn) classList += ' with-sidebar'

	return (
		<Router>
			<Init isLoggedIn={isLoggedIn} userNotFound={userNotFound} />
			<div className={`app-container${classList}`}>
				{isLoggedIn && <AppSideMenu items={MenuItems} />}
				<div className="app-body">
					<Switch>
						<Route exact path="/">
							<Index isLoggedIn={isLoggedIn} />
						</Route>
						<Route path="/login" component={LoginPage} />
						<Route path="/logout" component={Logout} />
						<PrivateRoute path="/appointments">
							<Appointments />
						</PrivateRoute>
						<PrivateRoute path="/patients">
							<Patients />
						</PrivateRoute>
						<PrivateRoute path="/clinic">
							<Clinic />
						</PrivateRoute>
						<Route path="/help">
							<Help />
						</Route>
						<Route path="/logout" component={Logout} />
						<Route component={ErrorPage} />
					</Switch>
				</div>
			</div>
		</Router>
	)
}

export default App
