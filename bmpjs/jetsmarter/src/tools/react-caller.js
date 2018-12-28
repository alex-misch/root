
const ReactCaller = {

	callbacks: [],

	run(fn, ...args) {
		if ( !("ReactApp" in window) ) {
			// console.log( 'await run', this )
			this.callbacks.push({ fn, args })
		} else {
			// console.log( 'immediately run' )
			window.ReactApp[ fn ]( ...args )
		}
	},

	load() {

		const log = this.callbacks.map( ({ fn, args }) => {
			return window.ReactApp[ fn ]( ...args )
		})
		// console.log( 'ReactAppLoaded', log )
	}

}

window.ReactAppLoaded = () => ReactCaller.load()

export { ReactCaller }
