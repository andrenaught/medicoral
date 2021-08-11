import { yupResolver } from '@hookform/resolvers/yup'
import React, { useEffect, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { IoIosLogIn } from 'react-icons/io'
import { useHistory } from 'react-router-dom'
import * as yup from 'yup'
import config from '../../config/prod'
import { aTokenKey, useAuthContext } from '../../Store'
import useFetch from '../../utils/useFetch'
import sty from './Login.module.scss'
import { LoginUser } from './types'

yup.setLocale(config.yupLocale)

// login action (used for login / registration / forgot password, etc)
const useLogin = () => {
	const appFetch = useFetch()
	const history = useHistory()
	const { setAccessToken, setUser } = useAuthContext()

	const appLoginWithToken = (
		aToken: string,
		user: LoginUser,
		redirect = ''
	) => {
		localStorage.setItem(aTokenKey, aToken)
		setAccessToken(aToken)
		setUser(user)

		if (redirect !== '') {
			history.replace(redirect)
		}
	}

	const appLogin = async (
		username: string,
		password: string,
		redirect = ''
	) => {
		const body = { username, password }
		const { data, ok } = await appFetch('/api/auth/token/login', {
			method: 'POST',
			body: JSON.stringify(body),
		})
		if (!ok) return

		const aToken = data.auth_token
		appLoginWithToken(aToken, { username }, redirect)
	}

	return { appLogin, appLoginWithToken }
}

// Form validation
interface LoginInputs {
	username: string
	password: string
}
const passwordSchema = yup.string().min(8).required()
const loginSchema = yup.object().shape({
	username: yup
		.string()
		.matches(/^$|^[a-zA-Z0-9_]*$/, 'username contains invalid characters')
		.required(),
	password: passwordSchema,
})
const loginDefaults = {
	username: '',
	password: '',
}

interface RegisterInputs extends LoginInputs {
	confirmPassword: string
}
const registerSchema = yup
	.object()
	.shape({
		confirmPassword: passwordSchema.test(
			'passwords-match',
			'Passwords must match',
			(value, ctx) => {
				return ctx.parent.password === value
			}
		),
	})
	.concat(loginSchema)
const registerDefaults = {
	...loginDefaults,
	confirmPassword: '',
}

const RegisterForm = (props: { showLogin: () => void }) => {
	const appFetch = useFetch()

	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
	} = useForm<RegisterInputs>({
		defaultValues: registerDefaults,
		resolver: yupResolver(registerSchema),
	})

	const [isSuccess, setIsSuccess] = useState<boolean>(false)
	const [results, setResults] = useState<{
		username?: string[]
		password?: string[]
	}>({})

	const onSubmit: SubmitHandler<RegisterInputs> = async (formData) => {
		const { password, confirmPassword, username } = formData

		if (password !== confirmPassword) {
			alert(`Passwords don't match`)
			return
		}

		const body = { username, password }
		const { data, ok } = await appFetch('/api/auth/users/', {
			method: 'POST',
			body: JSON.stringify(body),
		})
		if (!ok) {
			setResults(data)
			return
		}

		setIsSuccess(true)
	}

	useEffect(() => {
		setFocus('username')
	}, [])

	if (isSuccess) {
		return (
			<div className={sty.container}>
				Registration successful
				<div className={sty.footer}>
					<div className={sty.footerItem}>
						<small>
							<button
								type="button"
								className="link-g"
								onClick={() => props.showLogin()}
							>
								Back to login
							</button>
						</small>
					</div>
				</div>
			</div>
		)
	}

	return (
		<form
			className={`form-g ${sty.container}`}
			onSubmit={handleSubmit(onSubmit)}
		>
			<h3 className="header-g">Sign up</h3>
			<div className="input-wrap-g">
				<input
					className="input-g"
					placeholder="Username"
					{...register('username')}
				/>
				{errors.username && (
					<div className="input-message">{errors.username.message}</div>
				)}
				{results?.username && (
					<div className="input-message">{results?.username[0]}</div>
				)}
			</div>

			<div className="input-wrap-g">
				<input
					className="input-g"
					placeholder="Password"
					type="password"
					{...register('password')}
				/>
				{errors.password && (
					<div className="input-message">{errors.password.message}</div>
				)}
				{results?.password && (
					<div className="input-message">{results?.password[0]}</div>
				)}
			</div>

			<div className="input-wrap-g">
				<input
					className="input-g"
					placeholder="Confirm password"
					type="password"
					{...register('confirmPassword')}
				/>
				{errors.confirmPassword && (
					<div className="input-message">{errors.confirmPassword.message}</div>
				)}
			</div>
			<div className={sty.footer}>
				<button className="btn-g centered primary" type="submit">
					CREATE ACCOUNT
					<IoIosLogIn className="icon" />
				</button>
				<div className={sty.footerItem}>
					<small>
						Already have an account?&nbsp;
						<button
							type="button"
							className="link-g"
							onClick={() => props.showLogin()}
						>
							Log in
						</button>
					</small>
				</div>
			</div>
		</form>
	)
}

const LoginForm = ({
	showSignUpFirst,
	withSignUp,
}: {
	showSignUpFirst?: boolean
	withSignUp: boolean
}) => {
	const { appLogin } = useLogin()

	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
	} = useForm<LoginInputs>({
		defaultValues: loginDefaults,
		resolver: yupResolver(loginSchema),
	})

	const onSubmit: SubmitHandler<RegisterInputs> = async (formData) => {
		const { password, username } = formData
		appLogin(username, password, '/clinic')
	}

	const [signUpIsOpen, showSignUp] = useState(showSignUpFirst)

	useEffect(() => {
		const isOnLogin = !signUpIsOpen
		if (isOnLogin) {
			setFocus('username')
		}
	}, [signUpIsOpen])

	if (signUpIsOpen && withSignUp) {
		return <RegisterForm showLogin={() => showSignUp(false)} />
	}

	return (
		<form
			className={`form-g ${sty.container}`}
			onSubmit={handleSubmit(onSubmit)}
		>
			<h3 className="header-g">Login</h3>
			<div className="input-wrap-g">
				<input
					className="input-g"
					placeholder="Username"
					{...register('username')}
				/>
				{errors.username && (
					<div className="input-message">{errors.username.message}</div>
				)}
			</div>
			<div className="input-wrap-g">
				<input
					className="input-g"
					placeholder="Password"
					type="password"
					{...register('password')}
				/>
				{errors.password && (
					<div className="input-message">{errors.password.message}</div>
				)}
			</div>
			<div className={sty.footer}>
				<button className="btn-g primary" type="submit">
					LOGIN
					<IoIosLogIn className="icon" />
				</button>
				{withSignUp && (
					<div className={sty.footerItem}>
						<small>
							No account?&nbsp;
							<button
								type="button"
								className="link-g"
								onClick={() => showSignUp(true)}
							>
								Create one
							</button>
						</small>
					</div>
				)}
			</div>
		</form>
	)
}
LoginForm.defaultProps = {
	showSignUpFirst: false,
}
export default LoginForm
export { LoginForm }
