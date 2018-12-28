import Core from 'bmpjs/core'
import { BmpRouter } from 'bmpjs/router'
import { config } from './app.config.js'
import { Header } from './template/header/header.index.js';
import { Footer } from './template/footer/footer.index.js';
import Api from './services/api.js';
import css from './app.sass'

Core.CssJS.inject(css)

class JetsmarterApp extends Core.StatelessWidget {

	static get tagname() {
		return 'jetsmarter-app'
	}

	trackView() {
		if (typeof ga == 'function') ga('send', 'pageview')
	}

	beforeAttach() {
		this.state = {
			user: {},
			router: {
				viewDir: config.viewdir,
				urlconf: config.urlconf,
				onChange: this.trackView.bind(this)
			},
			header: {
				show: Boolean(window.hidenav),
				hideLogo: false,
				lineBg: false
			},
			footer: {
				show: Boolean(window.hidenav)
			}
		}
	}

	afterAttach() {
		this.state.user = Api.jetsm.post('getprofile')
	}

	content() {
		return this.html`
			${ Header.widget({ ...this.state.header, user: this.state.user }) }
			${ BmpRouter.widget( this.state.router ) }
			${ Footer.widget( this.state.footer ) }
		`
	}
}

export { JetsmarterApp }
