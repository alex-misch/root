import VirtualDOMDriver from "../../../drivers/html/virtual-dom.mjs";
import { HTMLElement } from '../../../dom/html-element'

let driver
beforeAll( () => driver = new VirtualDOMDriver() )

describe("VirtualDOMDriver deepRender", () => {

	test("simple parameters", async resolve => {
		expect( await driver.deepRender({ type: 'div' }) ).toEqual( new HTMLElement('div') )
		expect( await driver.deepRender(null) ).toBe( "" )
		expect( await driver.deepRender(undefined) ).toBe( "" )
		expect( await driver.deepRender(345) ).toBe( "345" )
		expect( await driver.deepRender(false) ).toBe( "false" )
		expect( await driver.deepRender(true) ).toBe( "true" )
		resolve()
	})

	test("CustomElement render should call connectedCallback", async resolve => {
		// Mock
		class TestCustomElement extends HTMLElement {}
		TestCustomElement.prototype.connectedCallback = jest.fn()
		// Run tests
		const vdElement = await driver.deepRender(new TestCustomElement())
		expect( vdElement.connectedCallback ).toHaveBeenCalled()
		resolve()
	})

	test(`VirtualDOM render should call "render" and "onAttached" methods`, async resolve => {
		// Mock
		class TestVDElement extends HTMLElement {}
		const mock = jest.fn()
		TestVDElement.prototype.render = mock.mockReturnValue({ type: 'div' })
		TestVDElement.prototype.onAttached = jest.fn()
		TestVDElement.prototype.ready = jest.fn()
		// Tests
		const element = await driver.deepRender(new TestVDElement())
		expect( element.render ).toHaveBeenCalled()
		expect( element.onAttached ).toHaveBeenCalled()
		expect( element.ready ).toHaveBeenCalled()
		resolve()
	})

	test("arrays, Object", async resolve => {
		const arrOfElements = await driver.deepRender([
			new HTMLElement(),
			new HTMLElement()
		])
		expect( arrOfElements ).toBeInstanceOf( Array )
		expect( await driver.deepRender({ type: 'div' }) ).toBeInstanceOf( Object )

		resolve()
	})

	test("array converter should return all instances HTMLElement", async resolve => {
		const arrOfElements = await driver.deepRender([
			{ type: 'div' },
			new HTMLElement('span')
		])
		expect( arrOfElements ).toBeInstanceOf( Array )
		arrOfElements.forEach( el => expect(el).toBeInstanceOf(HTMLElement) )

		// expect( await driver.render({}) ).toBeInstanceOf( Object )

		resolve()
	})

	test("safeHTML should be inserted as HTML code", async resolve => {
		const element = await driver.deepRender({
			type: 'div',
			props: { safeHTML: '<div class="foobar">Hello!</div>' }
		})
		expect( element.innerHTML ).toBe(`<div class="foobar">Hello!</div>`)
		resolve()
	})

	test("simple HTMLElement", async resolve => {
		const el = new HTMLElement('script')
		el.innerHTML = 'console.log("f")'
		el.setAttribute('type', 'application/ld+json')

		const rendered = await driver.deepRender(el)
		expect( rendered ).toBeInstanceOf( HTMLElement )
		expect( rendered.getAttribute('type') ).toBe( 'application/ld+json' )
		expect( rendered.innerHTML ).toBe( 'console.log("f")' )

		resolve()
	})

	test("is getter and strings support", async resolve => {
		class TestComponent { 
			static get is() { return "test-component" } 
		} 
		expect( driver.getTag( TestComponent.is ) ).toBe('test-component')
		expect( driver.getTag( "test-component" ) ).toBe('test-component')

		resolve()
	})

	test("reference func support", async resolve => {
		
		let refElement = null
		const vd = { 
			type: 'foobar',
			props: {
				ref: el => refElement = el
			}
		}
		await driver.deepRender(vd)
		expect(refElement instanceof HTMLElement).toBeTruthy()
		expect(refElement.tagName).toBe('foobar')


		resolve()
	})
	test("reference link support", async resolve => {
		
		let refElement = null
		const vd = { 
			type: 'foobar',
			props: {
				ref: refElement //TODO: SUPPORT
			}
		}
		await driver.deepRender(vd)
		// expect(refElement instanceof HTMLElement).toBeTruthy()
		// expect(refElement.tagName).toBe('foobar')

		resolve()
	})
})
