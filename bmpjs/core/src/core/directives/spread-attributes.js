import { directive } from '../../../node_modules/lit-html/lit-html'

const alias = {
	className: 'class'
}

const spread = attrs => directive( part => {
	for (const attr in attrs) {
		part.committer.element.setAttribute(alias[attr] || attr, attrs[attr]);
	}
})

export { spread }
