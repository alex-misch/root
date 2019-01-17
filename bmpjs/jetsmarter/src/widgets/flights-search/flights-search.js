import { StatelessWidget } from "bmpjs/core"

class FlightSearch extends StatelessWidget {


	static get tagname() {
		return 'flight-search'
	}


	content() {
		return this.html`
			<form action="">
				<input placeholder="destination" />
				<input placeholder="destination" />
				<button type="submit">Submit</button>
			</form>
		`
	}

}

export { FlightSearch }
