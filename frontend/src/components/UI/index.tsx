import React, { useEffect, useRef } from 'react'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { IoClose } from 'react-icons/io5'
import ReactPhoneInput, { PhoneInputProps } from 'react-phone-number-input'
import { useHistory } from 'react-router-dom'
import sty from './index.module.scss'

const modalDefaultOptions = {
	closeOnOutClick: true,
}
function Modal({
	closeFunc,
	isOpen,
	children,
	boxStyle,
	options = modalDefaultOptions,
}: {
	closeFunc: () => void
	isOpen: boolean
	children: React.ReactNode
	boxStyle?: React.CSSProperties
	options?: { closeOnOutClick: boolean }
}) {
	const modalRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			const target = e.target as HTMLElement
			if (!modalRef.current || modalRef.current.contains(target)) return

			// If click outside of the modal, close the modal
			if (options.closeOnOutClick) {
				closeFunc()
			}
		}

		window.addEventListener('mousedown', handleClick, false)

		return () => {
			window.removeEventListener('mousedown', handleClick, false)
		}
	}, [])

	let classList = ''
	if (isOpen) classList += ` ${sty['modal-open']}`

	if (!isOpen) return null

	return (
		<>
			<div className={`${sty['ui-modal-filter']}${classList}`} />
			<div className={`${sty['ui-modal']}${classList}`}>
				<div className={`${sty['modal-content-container']}`}>
					<div className={`${sty['modal-content-container-inner']}`}>
						<div className={`${sty['modal-outer']}`}>
							<button
								type="button"
								className={`${sty['close-btn']}`}
								onClick={() => closeFunc()}
							>
								<IoClose className={`${sty.icon}`} />
							</button>
							<div
								className={`${sty['modal-content']}`}
								ref={modalRef}
								style={{ ...boxStyle }}
							>
								{children}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}
Modal.defaultProps = {
	boxStyle: {},
	options: modalDefaultOptions,
}

const PhoneInput = React.forwardRef<ReactPhoneInput, PhoneInputProps>(
	(props: PhoneInputProps, ref) => {
		return (
			<ReactPhoneInput
				ref={ref}
				{...props}
				countrySelectProps={{ tabIndex: '-1' }}
				defaultCountry={process.env.REACT_APP_PHONE_COUNTRY_CODE}
			/>
		)
	}
)

function BackButton({ to }: { to?: string }) {
	const history = useHistory()
	const onClick = () => {
		if (to != null) {
			history.replace(to)
			return
		}
		history.goBack()
	}

	return (
		<button
			className="btn-g"
			onClick={onClick}
			type="button"
			style={{ marginBottom: '5px' }}
		>
			<HiOutlineArrowLeft style={{ display: 'flex' }} />
		</button>
	)
}
BackButton.defaultProps = {
	to: null,
}

export { Modal, PhoneInput, BackButton }
