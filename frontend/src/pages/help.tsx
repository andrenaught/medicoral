import { BsCircleFill } from 'react-icons/bs'

function HelpInfo() {
	return (
		<div className="content-g">
			<h1 className="header-g">Help</h1>
			<div>Scheduler</div>
			<div className="box-g">
				<div style={{ background: '#fff' }}>
					<h4>Color codes</h4>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<span style={{ color: '#d5e0ff', marginRight: '5px' }}>
							<BsCircleFill style={{ display: 'flex' }} />
						</span>
						<span>Returning patient</span>
					</div>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<span style={{ color: '#c4e6d0', marginRight: '5px' }}>
							<BsCircleFill style={{ display: 'flex' }} />
						</span>
						<span>New patient</span>
					</div>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<span style={{ color: '#e0deda', marginRight: '5px' }}>
							<BsCircleFill style={{ display: 'flex' }} />
						</span>
						<span>Completed appointment</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export default HelpInfo
