
import BmpCore from "bmp-core"
import theme from './theme/index.js'
import { JetsmRouter } from "./router.js";


class JetsmarterApp extends BmpCore.Component {

	static get is() { return 'jetsmarter-app' }

	constructor() {
		this.defineScheme(theme)
	}

	build() {
		html`
			<button @click="${ e => { console.log( 'hello' ) } }">Click me</button>
		`
		return new JetsmRouter()
	}


}

export { JetsmarterApp }
