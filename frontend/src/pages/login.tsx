import { Redirect } from 'react-router-dom'
import { LoginForm } from '../components/user/Login'
import { useAuthContext } from '../Store'

const LoginPage = () => {
	const { accessToken } = useAuthContext()

	if (accessToken) return <Redirect to="/clinic" />
	return (
		<div className="content-section-g screen-centered">
			<LoginForm withSignUp={false} />
		</div>
	)
}

export default LoginPage
export { LoginPage }
