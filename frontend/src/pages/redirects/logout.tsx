import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { aTokenKey, useAuthContext } from '../../Store'

function Logout() {
	const history = useHistory()
	const { setAccessToken, setUser } = useAuthContext()
	useEffect(() => {
		setAccessToken(null)
		setUser(null)
		localStorage.removeItem(aTokenKey)
		history.replace('/login')
	}, [])

	return null
}

export default Logout
