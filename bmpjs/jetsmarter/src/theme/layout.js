
import { default as Core } from 'bmpjs/core'

/** grid settings */
const gridMarginAndGutterDefaults = {
	phone: { margin:'10px', gutter:'10px' },
	tablet: { margin:'10px', gutter:'10px' },
	desktop: { margin:'10px', gutter:'10px' }
}

const genMarginAndGutter = mod => {
	let updatedMod = { ...gridMarginAndGutterDefaults, ...mod }
	let classNameFirstPart = '--mdc-layout-grid'

	return Object.keys( updatedMod ).map( device => {
		return Object.keys(updatedMod[device]).map( property =>
			`${classNameFirstPart}-${property}-${device}:${updatedMod[device][property]}`
		).join(';')
	}).join(';')
}


const Layout = {

	/** Twelve column grid row
	 * @param { Object } mod { phone | tablet | desktop : { margin, gutter } )
	 * @param { mixed } children
	 * @
	 * ME.grid({
	 * 	mod: { phone: { gutter: '10px', margin: '10px' } },
	 * 	children: [ this.html`<h1>Headline</h1>`, this.html`<p>text</p>` ]
	 * })
	 */
	grid: ({ mod, child }) => {
		return Core.html`
			<div class="mdc-layout-grid" style="${genMarginAndGutter(mod)}">
				<div class="mdc-layout-grid__inner">${ child }</div>
			</div>
		`
	},


	row: ({ child }) => Core.html`<div class="mdc-layout-grid__inner">${ child }</div>`,

	container: ({ mod, child }) => {
		return Core.html`<div dummy="${ Core.spread(mod) }">${ child }</div>`
	},

	/** Twelve column grid cell
	 * @param { Object } mod { desktop | tablet | phone | common: <Num { max 12 }>, align: <String { top | middle | bottom }> }
	 * @ ME.cell({
	 * 	mod: { desktop: 4, tablet: 6, phone: 12, align: 'top' },
	 * 	child: [Core.html`<h1>Headline</h1>`, Core.html`<p>text</p>` ]
	 * })
	 */
	col: ({ mod = { common: 12 }, child }) => {
		let common = mod && mod.common ? `mdc-layout-grid__cell--span-${mod.common}` : 'mdc-layout-grid__cell'
		let desktop = mod && mod.desktop ? `mdc-layout-grid__cell--span-${mod.desktop}-desktop` : null
		let tablet = mod && mod.tablet ? `mdc-layout-grid__cell--span-${mod.tablet}-tablet` : null
		let phone = mod && mod.phone ? `mdc-layout-grid__cell--span-${mod.phone}-phone` : null
		let align = mod && mod.align ? `mdc-layout-grid__cell--align-${mod.align}` : null
		let className = [mod.className || '', common, desktop, tablet, phone, align].join(' ')
		return Core.html`<div class="${ className }">${ child }</div>`
	},

	appBar: ({ menuLabel, title }) => {
		return Core.html`
			<header class="mdc-top-app-bar">
				<div class="mdc-top-app-bar__row">
					<section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-start">
						<a href="#" class="material-icons mdc-top-app-bar__navigation-icon">${ menuLabel }</a>
						<span class="mdc-top-app-bar__title">${ title }</span>
					</section>
					<section class="mdc-top-app-bar__section mdc-top-app-bar__section--align-end" role="toolbar"></section>
				</div>
			</header>
		`
	},

}

export default Layout
