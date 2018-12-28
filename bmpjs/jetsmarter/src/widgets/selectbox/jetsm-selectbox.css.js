import { COLOR } from "../../typography/index.js";

export const cssjs = {
	display: 'block',
	'font-family': 'Roboto',
	'font-weight': '200',
	'position': 'relative',
	'margin-bottom': '10px',
	'select':{
		'opacity': '0',
		'position': 'absolute',
		'width': '0.001px',
		'height': '0.001px',
		'@media (max-width: 640px)':{
			'width': '100%',
			'height': '100%',
			'top': '0',
			'left': '0',
			'z-index': '4',
		}
	},
	'.selectbox_wrapper': {
		'margin-bottom': '20px'
	},
	'.selectbox_label':{
		cursor: 'pointer',
		'font-size': '20px',
		'line-height': '20px',
		color: COLOR.darkBlured,
		background: COLOR.light,
		'position': 'relative',
		'padding': '15px 40px 12px 20px',
		'border-radius': '6px',
		'z-index': '4',
		'&:hover': {
			'i':{
				'border-color': COLOR.primary
			}
		},
		i:{
			'position': 'absolute',
			'top': '18px',
			'right': '20px',
			'width': '10px',
			'height': '10px',
			'border-top': `2px solid ${ COLOR.lightBorder }`,
			'border-left': `2px solid ${ COLOR.lightBorder }`,
			transform: 'rotate(-135deg)',
			transition: 'transform .3s, top .3s'
		}
	},
	'.selectbox_options':{
		'border-radius': '6px',
		'position': 'absolute',
		'top': 'calc(100% + 10px)',
		'left': '0',
		'width': '100%',
		'background': COLOR.light,
		transition: 'visibility .3s, opacity .3s, top .3s',
		'z-index': '4',
		'opacity': '0',
		'visibility': 'hidden',
		'cursor': 'pointer',
		'max-height': '500px',
		'overflow': 'auto',
		'.selectbox_option': {
			'font-family': 'Roboto',
			'font-weight': '200',
			'font-size': '20px',
			'line-height': '22px',
			'padding': '20px 40px',
			'color': COLOR.dark,
			'background-color': 'transparent',
			transition: 'background-color .3s',
			'z-index': '3',
			'&:hover':{
				'color': '#fff',
				'background-color': COLOR.primary,
			}
		}
	},
	'.selectbox_wrapper.opened':{
		'.selectbox_options':{
			'visibility': 'visible',
			'opacity': '1',
			'top': 'calc(100% + 1px)',
		},
		'.selectbox_label i':{
			'top': '1em',
			transform: 'rotate(45deg)'
		}
	}
}
