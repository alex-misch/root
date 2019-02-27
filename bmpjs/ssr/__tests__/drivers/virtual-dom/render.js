import VirtualDOMDriver from "../../../drivers/html/virtual-dom.mjs";
import { HTMLElement } from '../../../dom/html-element'

const driver = new VirtualDOMDriver()


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
		TestVDElement.prototype.render = jest.fn()
		// Tests
		const element = await driver.deepRender(new TestVDElement())
		expect( element.render ).toHaveBeenCalled()
		expect( element.onAttached ).toHaveBeenCalled()
		expect( element.render ).toHaveBeenCalled()
		resolve()
	})

	test("arrays, Object", async resolve => {
		const arrOfElements = await driver.deepRender([
			new HTMLElement(),
			new HTMLElement()
		])
		expect( arrOfElements ).toBeInstanceOf( Array )
		expect( await driver.deepRender({}) ).toBeInstanceOf( Object )

		resolve()
	})

	// test("array converter should return all instances HTMLElement", async resolve => {
	// 	const arrOfElements = await driver.deepRender([
	// 		{ type: 'div' },
	// 		new HTMLElement('span')
	// 	])
	// 	expect( arrOfElements ).toBeInstanceOf( Array )
	// 	arrOfElements.forEach( el => expect(el).toBeInstanceOf(HTMLElement) )

	// 	expect( await driver.render({}) ).toBeInstanceOf( Object )

	// 	resolve()
	// })

})
