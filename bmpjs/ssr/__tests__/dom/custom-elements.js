
import { CustomElements, customElements } from '../../dom/custom-elements.mjs'

class FakeClass extends HTMLElement {

}

describe("CustomElements", () => {

	test("define and get", () => {
		customElements.define('fake-class', FakeClass)
		const ceInstance = customElements.get('fake-class')
		expect( ceInstance.tagName ).toBe('fake-class')
	})

	test("registry should be empty", () => {
		const ce = new CustomElements()
		expect(ce.elementsRegistry.length).toBe(0)
	})

	test("register one tag twice throws error", () => {
		customElements.define( 'tag', class {} )
		expect( () => customElements.define('tag', class {}) )
			.toThrow()
	})

})
