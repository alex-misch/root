import { default as Core } from 'bmpjs/core'
import svgIcon from '../../../tools/svg-icons';
import Layout from '../../../theme/layout';


class FooterSocial extends Core.StatelessWidget {

	static get tagname() {
		return 'footer-social'
	}

	content() {
		return Layout.row({
			child: Layout.col({
				mod: { common: 12, align: 'top' },
				child: this.html`
					<ul class="social-icons">
						<li><a target="_blank" rel="noopener" href="https://www.facebook.com/JetSmarter/">${ svgIcon.facebook() }</a></li>
						<li><a target="_blank" rel="noopener" href="https://www.instagram.com/jetsmarter/">${ svgIcon.instagram() }</a></li>
						<li><a target="_blank" rel="noopener" href="https://twitter.com/JetSmarter">${ svgIcon.twitter() }</a></li>
						<li><a target="_blank" rel="noopener" href="https://www.linkedin.com/company/jetsmarter">${ svgIcon.linkedin() }</a></li>
					</ul>
				`
			})
		})
	}
}

export { FooterSocial }

