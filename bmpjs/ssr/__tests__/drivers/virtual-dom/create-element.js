import VirtualDOMDriver from "../../../drivers/html/virtual-dom.mjs";

describe("VirtualDOMDriver createElement", () => {

	test("with all params", () => {

		const element = VirtualDOMDriver.createElement(
			"div",
			{ class: 'fake' },
			1,2,3
		)

		expect(element).toBeInstanceOf(Object)
		expect(element.type).toBe('div')
		expect(element.props).toBeInstanceOf(Object)
		expect(element.props.class).toBe('fake')
		expect(element.children).toEqual([1,2,3])

	})

	test("with array childs", () => {

		const element = VirtualDOMDriver.createElement(
			"div",
			{ class: 'fake' },
			[1,2,3]
		)

		expect(element.children).toEqual([1,2,3])

	})

	test("with partial params", () => {

		const element = VirtualDOMDriver.createElement("div")
		expect(element).toBeInstanceOf(Object)
		expect(element.type).toBe('div')
		expect(element.props).toBeInstanceOf(Object)
		expect(element.children.length).toBe(0)

	})

	test("should throw error without params", () => {

		// expect(VirtualDOMDriver.createElement()).toThrow()


	})

})
