import { Redirect } from 'react-router-dom'

function IndexPage({ isLoggedIn }: { isLoggedIn: boolean }) {
	if (isLoggedIn) {
		return <Redirect to="/clinic" />
	}

	return <Redirect to="/login" />
}

export default IndexPage
