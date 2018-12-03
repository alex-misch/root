import { default as Core } from "bmpjs/bmp-core"

import { BmpView } from './bmp-view.js'

import { unifyPathname } from '../utils/path-unifier'
import { extractValues, isPatternMatchUrl } from '../utils/path-parser'

class BmpRouter extends Core.StatelessWidget {
	static get tagname() {
		return 'bmp-router'
	}

	constructor() {
		super()
		this.scrollRegistry = {}
		this.currentRoute = ''
	}

	get basepath() {
		const href = document.querySelector('base').href
		return href.replace(/https?:\/\/[\w.-]+(\:[0-9]+)?/g, '')
	}

	async connectedCallback() {
		await super.connectedCallback()

		this.handlePopstate = ev => {
			ev.preventDefault()
			trackView(location.pathname)
			this.render()
		}

		window.addEventListener('popstate', this.handlePopstate, false)
	}

	disconnectedCallback() {
		window.removeEventListener('popstate', this.handlePopstate, false)
	}

	getCurrentPathname(pathname = location.pathname) {
		if (this.basepath) {
			pathname = pathname.replace(new RegExp(`^${this.basepath}(.*)$`), '$1')
		}

		return unifyPathname(pathname)
	}

	get views() {
		return [...this.children].filter(node => node.tagName != this.config.viewTag)
	}

	getViewConf(pathname) {
		const matchedPattern = Object.keys(this.context.urlconf).find(pattern => {
			return isPatternMatchUrl(pattern, pathname)
		})
		return {
			pattern: matchedPattern,
			component: matchedPattern ? this.context.urlconf[matchedPattern] : new Error({ code: 404 })
		}
	}

	/**
	 * Extract dynamic values from pathname and creates BmpView instance with context
	 * @param {String} pathname
	 * @returns {BmpView} instace of view
	 */
	_createView(pathname) {
		const viewConf = this.getViewConf(pathname)
		const params = extractValues(viewConf.pattern, this.getCurrentPathname())

		if ( !viewConf.component instanceof Error )
			throw new Error('404 Not found') // TODO: 404page

		return BmpView.widget({
			component: viewConf.component,
			urlparams: params,
			pathname: pathname
		})
	}

	_updateScroll(pathname) {
		const isBack = this.currentRoute.includes(pathname)

		if (!isBack) {
			this.scrollRegistry[pathname] = window.pageYOffset
		}
	}

	go(rawPathname, title = null) {
		const oldpathname = location.pathname
		const pathname = unifyPathname(`${this.basepath}/${rawPathname}`)
		const urlToGo = location.origin + pathname
		window.history.pushState({ 'url': urlToGo }, title, urlToGo)
		window.dispatchEvent(new Event('popstate'))

		if (unifyPathname(location.pathname) != oldpathname.replace(/(?=\?|#).*/, ''))
			window.scrollTo(0, 0)
	}

	content() {
		let pathname = this.getCurrentPathname()

		const view = this._createView(pathname)
		this._updateScroll(pathname)

		this.currentRoute = pathname
		return view
	}

	back() {
		window.history.back()
	}

}

export { BmpRouter }
