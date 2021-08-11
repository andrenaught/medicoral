import { format, formatISO, isMatch, parse } from 'date-fns'
import { useEffect, useRef, useState } from 'react'

// Get middle of html element
function elFindMiddle(el: HTMLElement | null) {
	if (el == null) return 0
	const middle = el.offsetLeft + el.offsetWidth / 2
	return middle
}

// Debounce hook
const useDebounce = (value: any, delay: number, { isReady = true }) => {
	// State and setters for debounced value
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(
		() => {
			// ignore if value isn't ready yet (like loading)
			if (!isReady) return () => null

			// Update debounced value after delay
			const handler = setTimeout(() => {
				setDebouncedValue(value)
			}, delay)

			// Cancel the timeout if value changes (also on delay change or unmount)
			// This is how we prevent debounced value from updating if value is changed ...
			// .. within the delay period. Timeout gets cleared and restarted.
			return () => {
				clearTimeout(handler)
			}
		},
		[value, delay] // Only re-call effect if value or delay changes
	)

	return debouncedValue
}

// Determine if first render (react)
const useIsFirstRender = () => {
	const isFirstRender = useRef(true)
	useEffect(() => {
		isFirstRender.current = false
	}, [])
	return isFirstRender.current
}

// DB stores dates as yyyy-mm-dd, this looks for mm/dd/yyyy and converts to yyyy-mm-dd - mainly used for searching
const formatStringForDBDate = (text: string) => {
	const words = text.split(' ')
	const formattedWords = words.map((word) => {
		if (isMatch(word, 'M/')) {
			const date = parse(word, 'M/', new Date())
			const dateISO = format(date, 'MM-')
			return dateISO
		}
		if (isMatch(word, 'M/d')) {
			const date = parse(word, 'M/d', new Date())
			const dateISO = format(date, 'MM-dd')
			return dateISO
		}
		if (isMatch(word, 'M/d/yyyy')) {
			const date = parse(word, 'M/d/yyyy', new Date())
			const dateISO = formatISO(date, { representation: 'date' })
			return dateISO
		}
		return word
	})
	const formattedText = formattedWords.join(' ')
	return formattedText
}

const isSameDay = (d1: Date, d2: Date) => {
	return (
		d1.getDate() === d2.getDate() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getFullYear() === d2.getFullYear()
	)
}

export {
	elFindMiddle,
	useDebounce,
	useIsFirstRender,
	formatStringForDBDate,
	isSameDay,
}
