// Custom wrapper for react-select library
import _ from 'lodash'
import React from 'react'
import { BsPlusCircleFill } from 'react-icons/bs'
import { createFilter } from 'react-select'
import AsyncCreatableSelect, {
	Props as AsyncReactSelectProps,
} from 'react-select/async-creatable'
import CreatableSelect from 'react-select/creatable'
import * as yup from 'yup'
import useFetch from '../../utils/useFetch'

// Typing
type NormalSelectOption<T> = {
	value: T
	label: string
	search?: string
}
type JSXSelectOption<T> = {
	value: T
	label: JSX.Element
	search: string
}
export type SelectOption<T> = NormalSelectOption<T> | JSXSelectOption<T>

const yupSelect = (valueType: yup.AnySchema = yup.string()) =>
	yup.object().shape({ value: valueType }).nullable()

interface SelectProps extends AsyncReactSelectProps<{}, false> {
	useCreate?: boolean
}

// Search based on "search" property if provided
const searchBasedFilter = createFilter({
	stringify: (option: any) => {
		// eslint-disable-next-line no-underscore-dangle
		if (option.data.__isNew__) return `${option.value}`
		if (option.data.search != null) return `${option.data.search}`
		return `${option.data.label}`
	},
})

const SelectDefaultProps = {
	className: 'input-g blank react-select',
	classNamePrefix: 'react-select',
	isClearable: true,
	allowCreateWhileLoading: false,
	maxMenuHeight: 250,
	isValidNewOption: () => false,
	formatCreateLabel: (input: string) => {
		return (
			<div className="react-select__create-new">
				<BsPlusCircleFill className="icon" />
				<span>{input === '' ? 'Create' : `"${input}"`}</span>
			</div>
		)
	},
	theme: (theme: any) => ({
		...theme,
		colors: {
			...theme.colors,
			primary: 'var(--input-color)',
			primary25: 'var(--input-color-25)',
			primary50: 'var(--input-color-50)',
			primary75: 'var(--input-color-75)',
		},
	}),
}
const selectCreateProps = {
	allowCreateWhileLoading: true,
	isValidNewOption: () => true,
}
const multiProps = {
	className: `${SelectDefaultProps.className} is-multi`,
	defaultOptions: [],
}

const Select = React.forwardRef<CreatableSelect<{}, false>, SelectProps>(
	(props: SelectProps, ref) => (
		<CreatableSelect
			ref={ref}
			{...SelectDefaultProps}
			{...(props.isMulti && { className: SelectDefaultProps.className })}
			defaultOptions={props.value ? [props.value] : []}
			filterOption={searchBasedFilter}
			{...(props.isMulti && multiProps)}
			{...(props.useCreate && selectCreateProps)}
			{...props}
		/>
	)
)
Select.defaultProps = {
	useCreate: false,
}

const AsyncSelect = React.forwardRef<
	AsyncCreatableSelect<{}, false>,
	SelectProps
>((props: SelectProps, ref) => (
	<AsyncCreatableSelect
		ref={ref}
		{...SelectDefaultProps}
		defaultOptions={props.value ? [props.value] : []}
		{...(props.isMulti && multiProps)}
		{...(props.useCreate && selectCreateProps)}
		{...props}
	/>
))
AsyncSelect.defaultProps = {
	useCreate: false,
}

const selectFilter = async (
	inputValue: string,
	source: SelectOption<any>[] | string,
	handleFetch: (data: any[]) => SelectOption<any>[]
): Promise<SelectOption<any>[]> => {
	const appFetch = useFetch()

	if (_.isString(source)) {
		const { data, ok } = await appFetch(source)

		if (!ok) return []
		return handleFetch(data)
	}
	return source.filter((i) => {
		if (i.search != null)
			return i.search.toLowerCase().includes(inputValue.toLowerCase())
		if (_.isString(i.label)) {
			return i.label.toLowerCase().includes(inputValue.toLowerCase())
		}
		return false
	})
}

let selectTimeoutInstance: ReturnType<typeof setTimeout> | null = null
const selectLoadOptions = (
	inputValue: string,
	source: SelectOption<any>[] | string,
	handleFetch: (data: any[]) => SelectOption<any>[],
	timeout: number = 400
) => {
	return new Promise((resolve) => {
		if (selectTimeoutInstance != null) clearTimeout(selectTimeoutInstance) // debounce - cancel upcoming timeout if user types
		selectTimeoutInstance = setTimeout(() => {
			resolve(selectFilter(inputValue, source, handleFetch))
		}, timeout)
	})
}

export { Select, AsyncSelect, selectLoadOptions, yupSelect }
