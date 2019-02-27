import VirtualDOMDriver from '../../../drivers/html/virtual-dom'
import { HTMLElement } from '../../../dom/html-element'

const driver = new VirtualDOMDriver()


describe("VirtualDOMDriver", () => {

	test("virtualDOMtoHTML should convert object to HTMLElement instnace", async resolve => {
		const element = await driver.virtualDOMtoHTML({
			type: 'a',
			props: { class: 'foobar', title: 'helloworld' },
			children: [
				{ type: 'span', children: ["sometext"] }
			]
		})

		expect( element ).toBeInstanceOf( HTMLElement )
		expect( element.tagName ).toBe( 'a' )
		expect( element.getAttribute('class') ).toEqual('foobar')
		expect( element.getAttribute('title') ).toEqual('helloworld')

		const [child] = element.childNodes
		expect( child.tagName ).toBe('span')
		expect( child.innerHTML ).toBe('sometext')

		resolve()
	})

	test("virtualDOMtoHTML should call reference function of element", async resolve => {
		const refMock = jest.fn( el => el )
		const element = await driver.virtualDOMtoHTML({
			type: 'div',
			props: { class: 'foobar', ref: refMock }
		})

		const ref = element.getAttribute('ref')
		expect( typeof ref ).toBe( 'function' )
		expect( ref ).toHaveBeenCalled()
		resolve()
	})

})
