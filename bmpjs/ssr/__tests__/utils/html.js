
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

	Object.keys( escapeTests ).forEach( i =>
		test(`Test escapeHTML #${i}`, () => {
			expect( escapeHtml(escapeTests[i].input) ).toBe( escapeTests[i].output )
		})
	)

	test("Test props stringifier", () => {
		expect( stringifyProps([
			{ name: 'shouldbeinserted', value: 'yes'},
			{ name: 'shouldbenotinserted', value: () => {} },
			{ name: 'undefined', value: undefined },
			{ name: 'bool', value: true },
			{ name: 'boolfalse', value: false },
			{ name: 'object', value: { foo: 'bar' } },
			{ name: 'number', value: 366 },
			{ name: 'xss', value: `alert('xss')` }
		]) ).toBe(` shouldbeinserted="yes" bool="true" number="366" xss="alert(&#039;xss&#039;)"`)
	})

})

