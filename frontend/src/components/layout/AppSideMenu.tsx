import { Link, NavLink } from 'react-router-dom'
import { AiOutlineLogout } from 'react-icons/ai'
import { IconType } from 'react-icons'
import { LogoSVG } from '../assets/svg'

interface MenuItem {
	name: string
	path: string
	logo: IconType
}

function AppSideMenu({ items }: { items: MenuItem[] }) {
	return (
		<div className="app-sidemenu">
			<div className="app-sidemenu-header">
				<Link to="/clinic" className="app-logo">
					<LogoSVG />
				</Link>
			</div>
			<ul className="app-sidemenu-main">
				{items.map((item) => (
					<li key={item.path} className="app-sidemenu-item">
						<NavLink to={item.path} title={item.name}>
							{item.logo({})}
						</NavLink>
					</li>
				))}
			</ul>
			<div className="app-sidemenu-footer">
				<div className="inner">
					<div className="app-sidemenu-item">
						<Link to="/logout">
							<AiOutlineLogout />
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}

export default AppSideMenu
