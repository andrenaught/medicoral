import React, { ReactNode, useState } from 'react'
import { LoginUser } from './components/user/types'

type Token = string | null
interface AuthContextType {
	accessToken: Token
	setAccessToken: React.Dispatch<React.SetStateAction<Token>>
	user: LoginUser | null
	setUser: React.Dispatch<React.SetStateAction<LoginUser | null>>
	isLoggedIn: boolean
}

// This context does not have defaults, but createContext needs a default (typescript enforced) - so we use undefined
// Using a wrapper useAuthContext so we dont have to manually check if this context is undefined when using it
// Resource: https://kentcdodds.com/blog/how-to-use-react-context-effectively / https://reacttraining.com/blog/react-context-with-typescript/
const AuthContext = React.createContext<AuthContextType | undefined>(undefined)
export const aTokenKey = 'aToken'
export const rTokenKey = 'rToken'
export function useAuthContext() {
	const context = React.useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuthContext must be used within a AuthContext.Provider')
	}
	return context
}

function Store({ children }: { children: ReactNode }) {
	// Auth
	const [accessToken, setAccessToken] = useState(
		window.localStorage.getItem(aTokenKey) || null
	)
	const [user, setUser] = useState<LoginUser | null>(null)
	const isLoggedIn = Boolean(accessToken)

	return (
		<AuthContext.Provider
			value={{
				accessToken,
				setAccessToken,
				user,
				setUser,
				isLoggedIn,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export default Store
