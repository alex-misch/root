import { UI } from 'bmp-core'
import theme from './jetsmarter/_theme.js'

export default new UI.Theme({
	el: new UI.Theme.Elements( theme.elements ),
	color: new UI.Theme.Colors( theme.colors ),
	grid: new UI.Theme.Grid( theme.grid ),
	icons
})
