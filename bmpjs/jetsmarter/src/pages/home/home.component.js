import { default as Core } from "bmpjs/core";

import css from './home.sass'
import Layout from "../../theme/layout";
import { HomeHero } from "./widgets/home-hero/home-hero.component";
Core.CssJS.inject(css)

class HomePage extends Core.StatefulWidget {

	static get tagname() {
		return 'home-page'
	}

	content() {
		return Layout.container({
			mod: { class: 'homepage-content' },
			child: HomeHero.widget(),
		})
	}
}
export { HomePage }
