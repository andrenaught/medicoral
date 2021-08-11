import React from 'react'
import { Link } from 'react-router-dom'

function ErrorPage({ code }: { code?: number }) {
	return (
		<div className="content-section-g screen-centered">
			<div>
				{`${code} Error`} |{' '}
				<Link to="/" className="link-g">
					Back to home
				</Link>
			</div>
		</div>
	)
}
ErrorPage.defaultProps = {
	code: 404,
}

// eslint-disable-next-line import/prefer-default-export
export { ErrorPage }
