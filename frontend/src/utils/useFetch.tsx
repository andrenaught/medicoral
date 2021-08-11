import _ from 'lodash'
import { FieldError } from 'react-hook-form'
import { aTokenKey } from '../Store'

interface AppFetchConfig {
	getFieldErrs?: boolean
}

// handles field based responses, based on react-hook-form and django response
function getFieldErrs(body: {}, data: {}) {
	const result: {
		name: keyof typeof body
		error: FieldError
	}[] = []
	Object.keys(body).forEach((key) => {
		const bodyKey = key as keyof typeof body
		const fieldErr = data[bodyKey]
		if (fieldErr) {
			result.push({
				name: bodyKey,
				error: { type: 'manual', message: fieldErr[0] },
			})
		}
	})
	return result
}

function useHandleResponse() {
	const handleResponse = (response: Response) => {
		if (!response) return false
		const code = response.status
		if (code !== 200) {
			return false
		}
		return true
	}

	return handleResponse
}

function preFetch(fetchParams: RequestInit): {
	paramsToUse: RequestInit | {}
	bodyJSON: {}
} {
	const aToken = localStorage.getItem(aTokenKey)
	const defaultFetchHeaders = {
		'Content-Type': 'application/json',
		...(aToken && { Authorization: `Token ${aToken}` }),
	}
	const paramsToUse = {
		...fetchParams,
		headers: { ...defaultFetchHeaders, ...fetchParams?.headers },
	}

	const bodyIsString = _.isString(fetchParams.body)
	const bodyJSON = bodyIsString ? JSON.parse(fetchParams.body as string) : null
	return { paramsToUse, bodyJSON }
}

function postFetch(
	response: Response,
	ok: boolean,
	message: string,
	config: AppFetchConfig
) {
	let shouldAlert = !ok
	if (config.getFieldErrs && response.status === 400) shouldAlert = false

	if (shouldAlert) {
		alert(message || response.statusText)
	}
}

const useFetch = () => {
	const appFetch = async (
		endpoint: RequestInfo,
		fetchParams: RequestInit = {},
		config: AppFetchConfig = { getFieldErrs: false }
	) => {
		const { paramsToUse, bodyJSON } = preFetch(fetchParams)

		// start fetch
		const response = await fetch(endpoint, paramsToUse)
		const { ok } = response
		const contentType = response.headers.get('content-type')
		const isJSON = contentType && contentType.indexOf('application/json') !== -1
		const data = isJSON ? await response.json() : {}
		// end fetch

		// Handle field errors
		let fieldErrs
		if (config.getFieldErrs && response.status === 400 && bodyJSON) {
			fieldErrs = getFieldErrs(bodyJSON, data)
		}
		let message = data.message || data.non_field_errors || data.detail
		if (response.status === 401) message = response.statusText
		postFetch(response, ok, message, config)
		return { data, response, ok, fieldErrs: fieldErrs || [] }
	}

	return appFetch
}

export default useFetch
export { useHandleResponse, getFieldErrs }
