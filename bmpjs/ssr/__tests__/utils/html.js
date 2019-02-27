
import { escapeHtml, stringifyProps } from '../../utils/html.mjs'

const escapeTests = [
	{
		input: `<div class="foo"></div>`,
		output: `&lt;div class=&quot;foo&quot;&gt;&lt;/div&gt;`
	},
	{
		input: `<baz onclick="alert('f')" class="bar"></baz>`,
		output: `&lt;baz onclick=&quot;alert(&#039;f&#039;)&quot; class=&quot;bar&quot;&gt;&lt;/baz&gt;`
	}
]


describe('Test HTML Helper.', () => {

	test(`escapeHTML Strings`, () => {
		Object.keys( escapeTests ).forEach( i =>
			expect( escapeHtml(escapeTests[i].input) ).toBe( escapeTests[i].output )
		)
	})

	test("escapeHTML not string should convert to string then escape", () => {
		expect( escapeHtml(124213123444) ).toBe('124213123444')
		expect( escapeHtml(null) ).toBe('')
		expect( escapeHtml(undefined) ).toBe('')
		expect( escapeHtml(false) ).toBe('false')
		expect( escapeHtml(true) ).toBe('true')
	})

	test("Test props stringifier", () => {
		expect( stringifyProps([
			{ name: 'className', value: 'foobarbaz' },
			{ name: 'shouldbeinserted', value: 'yes'},
			{ name: 'shouldbenotinserted', value: () => {} },
			{ name: 'undefined', value: undefined },
			{ name: 'bool', value: true },
			{ name: 'boolfalse', value: false },
			{ name: 'object', value: { foo: 'bar' } },
			{ name: 'number', value: 366 },
			{ name: 'xss', value: `alert('xss')` }
		]) ).toBe(` class="foobarbaz" shouldbeinserted="yes" bool="true" number="366" xss="alert(&#039;xss&#039;)"`)

		expect( stringifyProps() ).toBe('')
		expect( stringifyProps(null) ).toBe('')
		expect( stringifyProps(undefined) ).toBe('')
		expect( stringifyProps(false) ).toBe('')
		expect( stringifyProps([]) ).toBe('')
	})



})

