define(["seoblock"],function({ default: seoDefaults$$1, seoblocks$$1 }){


	/** Contains static methods for loading .js and .css files */

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	/** Little error helper for required function arguments*/
	const req = name => {
		throw new Error(`${name} required parameter`);
	};

	/** General proto of the css component instance
	 * @constructor
	 */
	function CssComponent() {
		/** this.selectors strores all selecors for css component
		 * ex.: { 'class': [ 'value', 'value' ], 'id': 'value', 'some-attr': 'value' }
		 */
		this.selectors = {};

		/** Adding selector to instance of css component
		 * @param { String } type
		 * @param { String } selector
		 */
		const regSelector = ({ type = req('type'), selector = req('selector') }) => {
			if (!this.selectors.hasOwnProperty(type)) this.selectors[type] = type === 'class' ? [] : '';

			if (type == 'class') this.selectors[type].push(selector);else this.selectors[type] = selector;
		};
		return {
			selectors: this.selectors,
			regSelector: regSelector
		};
	}

	/** Generates CSS Selector */
	const asCssSelector = (str = req('string for css selector'), type = req('type of css selector')) => {
		switch (type) {
			case 'class':
				return `.${str}`;
				break;
			case 'id':
				return `#${str}`;
				break;

			default:
				return `[${type}="${str}"]`;
				break;
		}
	};

	/** Appending css selectors to a given dom element
		 * @param { HTMLElement } domElement
		 * @param { Object } selectorObject (ex.: { 'class': [ 'value', 'value' ], 'id': 'value', 'some-attr': 'value' })
		*/
	const _addSelectors = (domElement = req('domElement'), selectorObject = req('selectorObject')) => {
		// console.log( domElement, selectorObject )
		Object.keys(selectorObject).forEach(type => {
			if (type === 'class') domElement.classList.add(...selectorObject[type]);else domElement.setAttribute(selectorObject.type, selectorObject[type]);
		});
	};

	/** BmpCss is the entry point of the runtyme js to css transforming logic
	 * Start by instantiate BmpCss in your app
	 * ex.: const myBmpCss = new BmpCss()
	 * it'll gave you instance with following functionalities
	 */
	class BmpCss {
		constructor() {
			this.componentsRegistry = {};
			this.uniqs = [];
		}

		/** Walk through css component attrs and appends each to domElement as selectors
		 * @param { HTMLElement } domElement
		 * @param { String } componentName
		 */
		_attachStyles(domElement = req('domElement'), componentName = req('component name')) {
			Object.keys(this.componentsRegistry[componentName].selectors).forEach(type => {
				_addSelectors(domElement, { [type]: this.componentsRegistry[componentName].selectors[type] });
			});
		}

		/** Adding component styles.
		 * Use it to add new component styles to BMPCSS
		 * @param { String } name Component Name (usually a tag name)
		 * @param { Object } cssjs JS Object representing css
		 *  ex.: {
		 *    '.buttonClassName': {
		 *      background: 'red',
		 *      'span': {
		 *        'color': 'white'
		 *      }
		 *    }
		 * })
		 * @param { String } [type] type of the css selector default 'class'
		 * @param { String } [prefix] namespace prefix
		 * @returns { Object } css component instance
		 */
		define({ name = req('name'), cssjs = req('cssjs'), type = 'class', prefix = 'bmp' }) {
			if (this.componentsRegistry.hasOwnProperty(name)) return this.componentsRegistry[name];

			/** Gen uniq selector and register new component */
			let uniqSelector = this.genUniqSelector(prefix);
			this.componentsRegistry[name] = new CssComponent();
			this.componentsRegistry[name].regSelector({ type: type, selector: uniqSelector });

			this.componentsRegistry[name].extend = toextend => this.extend({ toextend, extender: this.componentsRegistry[name] });
			this.componentsRegistry[name].attachStyles = (domElement = req('HTMLElement')) => {
				if (!domElement.hasAttribute('ssr')) this._attachStyles(domElement, name);
			};
			this.componentsRegistry[name].stringify = () => this.transform(`${asCssSelector(uniqSelector, type)}`, cssjs);

			/** Creating css tag and populate it with css/text generated from js css representation */
			let styleTag = document.createElement('style');
			styleTag.type = 'text/css';
			styleTag.appendChild(document.createTextNode(this.componentsRegistry[name].stringify()));
			let firstScript = document.querySelector('head > style');
			if (!firstScript) document.head.appendChild(styleTag);else document.head.insertBefore(styleTag, firstScript);

			return this.componentsRegistry[name];
		}

		stringify() {
			Object.keys(this.componentsRegistry).forEach(name => {
				this.componentsRegistry[name];
			});
		}

		/** Extend styles from existed component
		 * @param { String } toextend
		 * @param { String } extender
		 * @return { Class }
		 */
		extend({ toextend = req('toextend'), extender = req('extender') }) {
			if (!this.componentsRegistry.hasOwnProperty(toextend)) throw new Error(`${toextend} css component not defined`);

			Object.keys(this.componentsRegistry[toextend].selectors).forEach(type => {
				if (type === 'class') this.componentsRegistry[toextend].selectors[type].forEach(selector => {
					extender.regSelector({ type, selector });
				});else extender.regSelector({ type, selector });
			});
		}

		/** Random selector with cuctom prefix
		 * @param { String } prefix
		 * @returns { String } generated uniq string
		 */
		genUniqSelector(prefix = req('prefix')) {
			/** TODO change {Math.random().toString(36).substr(2, 5)} copy-past */
			let selector = `${prefix}-${Math.random().toString(36).substr(2, 5)}`;
			if (this.uniqs.indexOf(selector) >= 0) return this.genUniqSelector();

			this.uniqs.push(selector);
			return selector;
		}

		/** Generates css/text */
		transform(uniqSelector, pretransformed) {
			pretransformed = this._pretransformCSSJStoCSS({ selector: uniqSelector, cssjs: pretransformed });
			const _tr = preCss => Object.keys(preCss).reduce((output, iter) => {
				if (/^\@/.test(iter)) return `${output}${iter}{${_tr(preCss[iter])}}`;else return `${output}${iter}${preCss[iter]}`;
			}, '');
			return _tr(pretransformed);
		}

		/**
		 * glue of parent selector and raw variant like scss
		 * @example:
		 * 	selector: '.parent'
		 * 	"&.hidden" -> .parent.hidden
		 * 	".hidden, .visible" -> .parent .hidden, .parent .visible
		 * 	".hidden, &.visible" -> .parent .hidden, .parent.visible
		 */
		//
		//
		glue(parent, rawSelector) {
			return rawSelector.split(',').map(selector => {
				// add parent to all separated selectors
				return `${parent}${selector.includes('&') ? selector.replace('&', '') : ` ${selector}`}`;
			}).join(',');
		}

		/** pretranspile js object to text/css
		 * @param { String } parantCssSelector
		 * @param { Object } styleSheetObject
		 * @returns { String } ex.: `
		 *  '.buttonClassName': '{background: red;}'
		 *  '.buttonClassName span': '{color: white;}'
		 * `
		 */
		_pretransformCSSJStoCSS({ selector = this.genUniqSelector('bmp'), cssjs = {} }) {

			return Object.keys(cssjs).reduce((output, iter) => {
				if (typeof cssjs[iter] === 'object') {
					// insert new CSS block with rules as object ex.: selector: " ...rules"
					if (/^\@/.test(iter)) {
						return _extends({}, output, {
							[iter.trim()]: this._pretransformCSSJStoCSS({
								selector: selector,
								cssjs: cssjs[iter]
							})
						});
					} else {
						return _extends({}, output, this._pretransformCSSJStoCSS({
							selector: this.glue(selector, iter),
							cssjs: cssjs[iter]
						}));
					}
				} else {
					// insert new rule ex.: background: 'red'
					if (!output.hasOwnProperty(selector)) output[selector] = '{}';

					output[selector] = output[selector].replace('}', `${iter}: ${String(cssjs[iter]).trim() == "" ? '""' : cssjs[iter]};}`);
				}
				return output;
			}, {});
		}
	}

	const instance = new BmpCss();

	var _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	class BMPVD {

		constructor() {}

		static isAttribute(val) {
			return ['string', 'number', 'boolean'].includes(typeof val);
		}

		static filterObject(input, filterFn) {
			return Object.keys(input).filter(key => filterFn(input[key], key)).reduce((output, key) => _extends$1({}, output, { [key]: input[key]
			}), {});
		}

		static isEventProp(propertyKey) {
			return (/^on/.test(propertyKey)
			);
		}

		static isRefProp(propertyKey) {
			return propertyKey === 'ref';
		}

		static isCustomProp(propertyKey) {
			return BMPVD.isEventProp(propertyKey) || propertyKey === 'forceUpdate';
		}

		static extractEventName(propertyKey) {
			return propertyKey.slice(2).toLowerCase();
		}

		static initEventCache(realDOMElement, eventKey) {
			if (!realDOMElement._listeners) realDOMElement._listeners = {};
			if (!realDOMElement._listeners[eventKey]) realDOMElement._listeners[eventKey] = [];
		}

		static compareProps(originProps = {}, filterProps = {}) {
			return Object
			// filter will perform origin keys
			.keys(originProps).filter(key => BMPVD.isEventProp(key))
			// remove if filtered prop is different
			.filter(key => originProps[key] != filterProps[key])
			// generate result object
			.reduce((result, key) => _extends$1({}, result, { [key]: originProps[key] }), {});
		}

		static getPropsChanges(newProps, oldProps) {
			return {
				add: BMPVD.compareProps(newProps, oldProps),
				remove: BMPVD.compareProps(oldProps, newProps)
			};
		}

		static updateEventListeners(realDOMElement, newProps = {}, oldProps = {}) {
			const { add, remove } = BMPVD.getPropsChanges(newProps, oldProps);

			Object.keys(remove).forEach(key => BMPVD.removeListener(realDOMElement, key, remove[key]));
			Object.keys(add).forEach(key => BMPVD.addListener(realDOMElement, key, add[key]));
		}

		static removeListener(realDOMElement, eventKey, eventFn) {
			BMPVD.initEventCache(realDOMElement, eventKey);
			const eventFnIndex = realDOMElement._listeners[eventKey].indexOf(eventFn);
			if (eventFnIndex !== -1) {
				realDOMElement._listeners[eventKey].splice(eventFnIndex, 1);
				realDOMElement.removeEventListener(BMPVD.extractEventName(eventKey), eventFn);
			}
		}

		static addListener(realDOMElement, eventKey, eventFn) {
			BMPVD.initEventCache(realDOMElement, eventKey);
			const hasListener = realDOMElement._listeners[eventKey].includes(eventFn);
			if (!hasListener) {
				realDOMElement._listeners[eventKey].push(eventFn);
				realDOMElement.addEventListener(BMPVD.extractEventName(eventKey), eventFn);
			}
		}

		/** Sets element property
		 *  @param { HTMLElement } realDOMElement
		 *  @param { string } propertyKey
		 *  @param { string } value
		 */
		static setProp(realDOMElement, propertyKey, value) {
			if (BMPVD.isEventProp(propertyKey)) BMPVD.addListener(realDOMElement, propertyKey, value);else if (BMPVD.isCustomProp(propertyKey)) return;else if (typeof value === 'boolean') BMPVD.setBooleanProp(realDOMElement, propertyKey, value);else if (propertyKey === 'className' || propertyKey === 'value') realDOMElement[propertyKey] = value;else if (propertyKey === 'safeHTML') // passed string, safe html of element
				realDOMElement.innerHTML = value;else if (propertyKey == 'ref' && typeof value == 'function') {
				// reference function
				value(realDOMElement);
				realDOMElement.ref = null;
			} else if (typeof value != 'object' && typeof value != 'function') // cannot set function and object to attribute
				realDOMElement.setAttribute(propertyKey, value);else {
				if (!Array.isArray(realDOMElement._props)) realDOMElement._props = [];
				const existedProp = realDOMElement._props.find(prop => prop.name === propertyKey);
				const eventData = {
					data: { name: propertyKey, value }
				};
				if (existedProp) {
					existedProp[propertyKey] = value;
					eventData.type = 'update';
				} else {
					realDOMElement._props.push({ name: propertyKey, value });
					eventData.type = 'create';
				}

				console.log('update', eventData)
				realDOMElement.dispatchEvent(new CustomEvent('propsChanged', { detail: eventData }));
			}
		}

		/** Iterate throught given properties and sets each on HTMLElement
		 *  @param { HTMLElement } realDOMElement
		 *  @param { Object } props
		 */
		static setProps(realDOMElement, props) {
			Object.keys(props).forEach(propertyKey => {
				BMPVD.setProp(realDOMElement, propertyKey, props[propertyKey]);
			});
		}

		static setBooleanProp(realDOMElement, propertyKey, value) {
			if (value) {
				realDOMElement.setAttribute(propertyKey, value);
				realDOMElement[propertyKey] = true;
			} else {
				realDOMElement.removeAttribute(propertyKey);
				realDOMElement[propertyKey] = false;
			}
		}

		static removeBooleanProp(realDOMElement, propertyKey) {
			realDOMElement.removeAttribute(propertyKey);
			realDOMElement[propertyKey] = false;
		}

		static removeProp(realDOMElement, propertyKey, value) {
			if (BMPVD.isCustomProp(propertyKey)) return;else if (propertyKey === 'className') realDOMElement.removeAttribute('class');else if (typeof value === 'boolean') BMPVD.removeBooleanProp(realDOMElement, propertyKey);else realDOMElement.removeAttribute(propertyKey);
		}

		static updateProp(realDOMElement, propertyKey, newVal, oldVal) {
			/** TODO show some love to this checker */
			if (propertyKey !== 'ssr') {
				// skip server-side rendered prop (can be used in component)
				if (propertyKey === 'value') {
					realDOMElement.setAttribute('value', newVal);
					realDOMElement.value = newVal; // value must always have a "value" attr. It fixes re-render change bug
				} else if (typeof newVal !== 'boolean' && !newVal) {
					BMPVD.removeProp(realDOMElement, propertyKey, oldVal);
				} else if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
					BMPVD.setProp(realDOMElement, propertyKey, newVal);
				}
			}
		}

		static updateProps(realDOMElement, newProps, oldProps = {}) {
			let mergedProps = Object.assign({}, newProps, oldProps);

			Object.keys(mergedProps).forEach(propertyKey => {
				BMPVD.updateProp(realDOMElement, propertyKey, newProps[propertyKey], oldProps[propertyKey]);
			});
		}

		/** Create real DOM element and goes deeper for childrens
		 *  @param { Object } node
		 *  @returns { HTMLElement } real DOM Element
		 */
		static createDOMElement(node = '') {

			if (['string', 'number', 'boolean', undefined].includes(typeof node)) return document.createTextNode(`${node}`);

			const _realDOMElement = document.createElement(node.type);
			if (_realDOMElement.tagName === 'INPUT') _realDOMElement.value = node.props.value || ''; // value must always have a "value" attr. It fixes re-render change bug

			BMPVD.setProps(_realDOMElement, node.props);
			BMPVD.updateEventListeners(_realDOMElement, node.props);
			node.children.map(BMPVD.createDOMElement).forEach(_realDOMElement.appendChild.bind(_realDOMElement));

			return _realDOMElement;
		}

		/** Compares two virtual DOM elements
		 * @param { Object } node1
		 * @param { Object } node2
		 * @returns { boolean } is changed
		 */
		changed(node1, node2) {
			return typeof node1 !== typeof node2 || (['string', 'number'].indexOf(typeof node1) >= 0 || !node1.type) && node1 !== node2 || node1.type !== node2.type || node1.props && node1.props.forceUpdate;
		}

		/** Runs through given "changes" array and update DOM according to it
		 * @param { Array } changes
		 * @returns { Promise }
		 */
		runChanges(actions) {

			const active = document.activeElement;
			this.changes.forEach(change => {
				if (actions.includes(change.type)) {
					switch (change.type) {
						case 'create':
							/**Expects { Object } chages: { type: create, realDOMParent : { HTMLElement }, vdnode: { VirtualDomNodeObject } } */
							change.realDOMParent.appendChild(BMPVD.createDOMElement(change.vdnode));
							break;
						case 'remove':
							/**Expects { Object } chages: { type: remove, realDOMParent : { HTMLElement }, oldNode: { HTMLElement } } */
							// if ( change.realDOMParent.contains(change.oldNode) )
							change.realDOMParent.removeChild(change.oldNode);
							break;
						case 'replace':
							/**Expects { Object } chages: { type: replace, realDOMParent : { HTMLElement }, oldNode: { HTMLElement }, vdnode: { VirtualDomNodeObject } } */
							change.realDOMParent.replaceChild(BMPVD.createDOMElement(change.vdnode), change.oldNode);
							break;
						case 'updateAttributes':
						case 'updateProps':
							BMPVD.updateProps(change.realDomNode, change.newProps, change.oldProps);
							break;
						case 'updateListeners':
							BMPVD.updateEventListeners(change.realDomNode, change.newProps, change.oldProps);
							break;
					}
				}
			});
			if (active && document.activeElement != active && typeof active.focus == 'function') active.focus(); // focus element that was in focus before dom update
			return Promise.resolve();
		}

		registerChange(changes) {
			this.changes.push(changes);
		}

		updateContainer(realDOMParent, newNode, oldNode, actions = ['create', 'remove', 'replace', 'updateAttributes', 'updateListeners']) {
			this.changes = [];
			this.collectChanges(realDOMParent, newNode, oldNode);
			this.runChanges(actions);
		}

		/**
		 * @param { HTMLElement } realDOMParent
		 * @param { Object } newNode
		 * @param { Object } oldNode
		 * @param { number } index
		 */
		collectChanges(realDOMParent, newNode, oldNode, index = 0) {

			if (!oldNode) this.registerChange({
				type: 'create',
				realDOMParent: realDOMParent,
				vdnode: newNode
			});else if (!newNode) this.registerChange({
				type: 'remove',
				realDOMParent: realDOMParent,
				oldNode: realDOMParent.childNodes[index]
			});else if (this.changed(newNode, oldNode)) this.registerChange({
				type: 'replace',
				realDOMParent: realDOMParent,
				oldNode: realDOMParent.childNodes[index],
				vdnode: newNode
			});else if (newNode.type) {
				const realDomNode = realDOMParent.childNodes[index];
				// separate logic for 3 events: attributes, props,
				this.registerChange({
					type: 'updateAttributes',
					realDomNode,
					newProps: BMPVD.filterObject(newNode.props, val => BMPVD.isAttribute(val)),
					oldProps: BMPVD.filterObject(oldNode.props, val => BMPVD.isAttribute(val))
				});
				this.registerChange({
					type: 'updateProps',
					realDomNode,
					newProps: BMPVD.filterObject(newNode.props, val => !BMPVD.isAttribute(val)),
					oldProps: BMPVD.filterObject(oldNode.props, val => !BMPVD.isAttribute(val))
				});
				this.registerChange({
					type: 'updateListeners',
					realDomNode: realDomNode,
					newProps: BMPVD.filterObject(newNode.props, (val, key) => BMPVD.isEventProp(key)),
					oldProps: BMPVD.filterObject(oldNode.props, (val, key) => BMPVD.isEventProp(key))
				});
				const _newLength = newNode.children.length;
				const _oldLength = oldNode.children.length;
				for (let i = 0; i < _newLength || i < _oldLength; i++) {
					this.collectChanges(realDomNode, newNode.children[i], oldNode.children[i], i);
				}
			}
		}

		/** Generates virtualDOMElement
		 *  @returns { Object } virtual DOM element
		 */
		static createBMPVirtulaDOMElement(type, props, ...children) {
			let _children = children.reduce((output, iter) => {
				if (Array.isArray(iter)) return [...output, ...iter];else return [...output, iter];
			}, []).filter(child => child !== null);
			return { type, props: props || {}, children: _children };
		}

		setVirtualDOM(VDInstance = {}) {
			this.currentVDInstance = VDInstance;
			return this.currentVDInstance;
		}

		static transformPropKey(key) {
			return key === 'class' ? 'className' : key;
		}

		convertToVD(element) {
			if (element.nodeType === Node.ELEMENT_NODE) {
				const props = [...(element.attributes || [])].reduce((res, { name, value }) => _extends$1({}, res, {
					[BMPVD.transformPropKey(name)]: value
				}), {});
				const child = [...element.childNodes].map(child => this.convertToVD(child))
				// delete trash strings and EOL
				.filter(el => !(el instanceof String) || !['↵', ''].includes(el.trim()));

				return BMPVD.createBMPVirtulaDOMElement(element.tagName.toLowerCase(),
				// map attributes to key-value pairs object
				props,
				// map all childs to VD likely object
				...child);
			} else if (element.nodeType === Node.TEXT_NODE) {
				return element.textContent;
			} else {
				return null;
			}
		}

	}

	(function () {
		function l() {
			function n(a) {
				return a ? "object" === typeof a || "function" === typeof a : !1;
			}var p = null;var g = function (a, b) {
				function f() {}if (!n(a) || !n(b)) throw new TypeError("Cannot create proxy with a non-object as target or handler");p = function () {
					f = function (a) {
						throw new TypeError("Cannot perform '" + a + "' on a proxy that has been revoked");
					};
				};var e = b;b = { get: null, set: null, apply: null, construct: null };for (var k in e) {
					if (!(k in b)) throw new TypeError("Proxy polyfill does not support trap '" + k + "'");b[k] = e[k];
				}"function" === typeof e && (b.apply = e.apply.bind(e));var c = this,
						g = !1,
						q = !1;"function" === typeof a ? (c = function () {
					var h = this && this.constructor === c,
							d = Array.prototype.slice.call(arguments);f(h ? "construct" : "apply");return h && b.construct ? b.construct.call(this, a, d) : !h && b.apply ? b.apply(a, this, d) : h ? (d.unshift(a), new (a.bind.apply(a, d))()) : a.apply(this, d);
				}, g = !0) : a instanceof Array && (c = [], q = !0);var r = b.get ? function (a) {
					f("get");return b.get(this, a, c);
				} : function (a) {
					f("get");return this[a];
				},
						v = b.set ? function (a, d) {
					f("set");b.set(this, a, d, c);
				} : function (a, b) {
					f("set");this[a] = b;
				},
						t = {};Object.getOwnPropertyNames(a).forEach(function (b) {
					if (!((g || q) && b in c)) {
						var d = { enumerable: !!Object.getOwnPropertyDescriptor(a, b).enumerable, get: r.bind(a, b), set: v.bind(a, b) };Object.defineProperty(c, b, d);t[b] = !0;
					}
				});e = !0;Object.setPrototypeOf ? Object.setPrototypeOf(c, Object.getPrototypeOf(a)) : c.__proto__ ? c.__proto__ = a.__proto__ : e = !1;if (b.get || !e) for (var m in a) t[m] || Object.defineProperty(c, m, { get: r.bind(a, m) });Object.seal(a);Object.seal(c);return c;
			};g.revocable = function (a, b) {
				return { proxy: new g(a, b), revoke: p };
			};return g;
		}var u = "undefined" !== typeof process && "[object process]" === {}.toString.call(process) || "undefined" !== typeof navigator && "ReactNative" === navigator.product ? global : self;u.Proxy || (u.Proxy = l(), u.Proxy.revocable = u.Proxy.revocable);
	})();

	const patchMethod = (arr, method, notifyFn) => {
		Object.defineProperty(arr, method, {
			configurable: false,
			enumerable: false, // hide from for...in
			writable: false,
			value: function (...args) {
				Array.prototype[method].apply(this, args);
				notifyFn(this);
				return this;
			}
		});
	};

	const observeArray = (arr, callback) => {
		const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
		for (let method of methods) {
			if (!arr.hasOwnProperty(method)) patchMethod(arr, method, callback);
		}
		return arr;
	};

	const observe = (o, callback) => {
		const buildProxy = (prefix, o) => {
			if (Array.isArray(o)) return observeArray(o, callback);
			return Object.seal(new Proxy(o, {
				set(target, property, value) {
					// same as above, but add prefix
					target[property] = value;
					callback(prefix + property, property, target[property]);
					return true;
				},
				get(target, property) {
					const out = target[property];
					if (Array.isArray(out) || out instanceof Object && !(out instanceof Date)) {
						// date cannot be proxied
						return buildProxy(prefix + property + '.', out);
					}
					return out;
				}
			}));
		};
		return buildProxy('', o);
	};

	class Mutex {

		constructor() {
			this.queue = [];
			this.locked = false;
		}

		lock(fn) {
			this.queue.push(fn);
			if (!this.locked) this.nextJob();
		}

		nextJob() {
			const hasJobs = this.queue.length > 0;
			this.locked = hasJobs;
			if (hasJobs) {
				// locked here =
				// extract job from queue
				const job = this.queue.shift();
				// run current job in queue
				job(() => {
					this.nextJob();
				});
			}
		}

	}

	var _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	/** Extend BMPVDWebComponent class to create new custom elements with virtual dom and observable bindings */
	class BMPVDWebComponent extends HTMLElement {
		constructor() {
			super();
			this.BMPVD = new BMPVD(this);
			this._props = [];
			this.renderMutex = new Mutex();
		}

		get props() {
			return [...this.attributes, ...this._props].reduce((result, attr) => _extends$2({}, result, {
				[attr.name]: attr.value
			}), {});
		}

		/** !warning: observe uses Proxy object and if there's no native support for Proxy it will *(TODO->)* use google-chrome team polyfill (which comes with some limitations)
		*  https://github.com/GoogleChrome/proxy-polyfill
	 */
		observe(obj) {
			return window.IS_SSR ? obj : observe(obj, (tree, property, value) => this.rerender());
		}

		rerender() {
			if (!window.IS_SSR) {
				clearTimeout(this.dispatchUpdateTimeout);
				this.dispatchUpdateTimeout = setTimeout(_ => {
					let prevVDInstance = this.BMPVD.currentVDInstance ? _extends$2({}, this.BMPVD.currentVDInstance) : null;
					let newVDInstance = this.BMPVD.setVirtualDOM(this.render());

					this.renderMutex.lock(unlock => {
						this.BMPVD.updateContainer(this, newVDInstance, prevVDInstance || null);
						unlock();
					});
				}, 10);
			}
		}

		connectedCallback() {
			this.addEventListener('propsChanged', ({ detail }) => {
				console.log('propsChanged', detail)
				const oldVDInstance = this.BMPVD.convertToVD(this);
				const newVDInstance = this.BMPVD.setVirtualDOM(this.render());
				if ( Array.isArray(oldVDInstance.children) && oldVDInstance.children[0] )
				this.mutex.lock( unlock => {
					this.BMPVD.updateContainer(this, newVDInstance, oldVDInstance.children[0], ['updateProps']);
					unlock()
				})
			})
			if (this.ready) {
				const readyPromise = this.ready();
				if (readyPromise && readyPromise.then) {
					// ready is Promise
					readyPromise.then(() => {
						this._attachComponent()
					}).catch(err => {
						void 0
					});
				} else {
					this._attachComponent();
				}
				delete this.ready;
			}
		}

		/** override it in customElement class */
		onAttached() {}

		_attachComponent() {
			if (!window.IS_SSR) {
				// runtime on client (not server side)
				// content can be rendered by server, try to parse it inner as VD objects
				const oldVDInstance = this.BMPVD.convertToVD(this);
				const newVDInstance = this.BMPVD.setVirtualDOM(this.render());
				// lock mutex to resolve conflicts of updating node from several sides
				this.renderMutex.lock(async unlock => {
					if (this.hasAttribute('ssr') && Array.isArray(oldVDInstance.children) && oldVDInstance.children[0]) {
						this.BMPVD.updateContainer(this, newVDInstance, oldVDInstance.children[0], ['updateListeners']);
					} else {
						this.BMPVD.updateContainer(this, newVDInstance);
					}
					await this.onAttached();
					delete this.onAttached;
					unlock();
				});
			}
		}

	}

	/**
	 * Extract deep value from passed object by specific path with delimiter
	 * @param {Array} arr where will be searched value
	 * @param {String} where path of object props delimited
	 * @param {String} delimiter delimiter of path
	 * @example
	 * <script>
	 * 	extractFrom( { user: { token: 'xyz' } }, 'user.token' ) // 'xyz'
	 * </script>
	 */
	const extractFrom = (arr, where, delimiter = '.') => {
		if (where !== null && typeof where !== 'undefined') {
			if (arr.length === 1) {
				return where[arr[0]];
			} else {
				// 'where' is object, get the deep value
				let _where = where[arr[0]];
				// 'arr' is array
				let _arr = arr.splice(1);
				return extractFrom(_arr, _where, delimiter);
			}
		} else return null;
	};

	/**
	 * Set deep value to passed object by specific path
	 * @param { Object } obj
	 * @param { Array } arrPath
	 * @param {*} value
	 * @param {Int} i
	 */
	const setTo = (obj, arrPath, value, i = 0) => {
		// get current segment of path
		let segment = arrPath[i];

		if (i != arrPath.length - 1) {
			// if segment is not last
			if (typeof obj[segment] != 'object') {
				// segment data not found: set empty object
				obj[segment] = {};
			}

			// go to next depth level
			setTo(obj[segment], arrPath, value, ++i);
		} else {
			// if last, set value of recursion
			obj[segment] = value;
		}
	};

	class HTTPRequest {

		async request(method, endpoint, data) {

			let headers = {
				'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json; charset=utf-8'
			};

			const { host, port, headers: confHeaders } = this.conf;
			if (confHeaders) Object.keys(confHeaders).forEach(key => {
				headers[key] = confHeaders[key];
			});

			const url = `${host}${port ? `:${port}` : ''}/${endpoint}`;
			let fetchRes = await window.fetch(url, {
				method,
				headers,
				body: data ? JSON.stringify(data) : null,
				credentials: this.conf.credentials || "include"
			});
			return await fetchRes.text();
		}

		getRequest(endpoint, data) {
			return this.request('GET', endpoint, data);
		}

		postRequest(endpoint, data) {
			return this.request('POST', endpoint, data);
		}
	}

	const getSubscribersPath = path => (path + '.__local_subscribers').split('.');

	class BmpStorage extends HTTPRequest {

		constructor() {
			super();

			this.storage = {};
			this.subscribers = {};
		}

		throttleNotify(target) {
			clearTimeout(this.duringNotifier);
			this.duringNotifier = setTimeout(() => {
				this.notifySubscribers(target);
			});
		}

		get dataStore() {
			return this.storage;
		}

		getFromStorage(path) {
			return extractFrom(path.split('.'), this.storage);
		}

		setToStorage(path, data) {
			setTo(this.storage, path.split('.'), data);
			this.throttleNotify(path);
		}

		notifySubscribers(target) {
			const allSubscribers = {};
			target.split('.').reduce((tree, segment) => {
				tree += `${tree ? '.' : ''}${segment}`;
				const subs = this._getSubscribers(tree);
				if (subs) allSubscribers[tree] = subs;
				return tree;
			}, '');

			const arSubs = Object.keys(allSubscribers);
			if (arSubs.length) {
				arSubs.forEach(subscriberPath => {
					const subs = allSubscribers[subscriberPath];
					Object.keys(subs).forEach(key => subs[key](this.getFromStorage(subscriberPath), target));
				});
			}
		}

		subscribe(path, fn) {
			const subID = parseInt(Math.random() * 10000, 10);
			setTo(this.subscribers, [...getSubscribersPath(path), subID], fn);
			// console.log( 'sub', getSubscribersPath( path )+'.'+subscribers.length )
			return subID;
		}

		unsubscribe(path, id) {
			const subs = this._getSubscribers(path);
			// console.log( 'unsub', `${path}.${id}`, subs )
			if (subs && subs[id]) {
				delete subs[id];
			}
		}

		_getSubscribers(path) {
			const subscribersPath = getSubscribersPath(path);
			return extractFrom(subscribersPath, this.subscribers);
		}

	}

	const instance$1 = new BmpStorage();

	var support = {
		searchParams: 'URLSearchParams' in self,
		iterable: 'Symbol' in self && 'iterator' in Symbol,
		blob: 'FileReader' in self && 'Blob' in self && function () {
			try {
				new Blob();
				return true;
			} catch (e) {
				return false;
			}
		}(),
		formData: 'FormData' in self,
		arrayBuffer: 'ArrayBuffer' in self
	};

	function isDataView(obj) {
		return obj && DataView.prototype.isPrototypeOf(obj);
	}

	if (support.arrayBuffer) {
		var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

		var isArrayBufferView = ArrayBuffer.isView || function (obj) {
			return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
		};
	}

	function normalizeName(name) {
		if (typeof name !== 'string') {
			name = String(name);
		}
		if (/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(name)) {
			throw new TypeError('Invalid character in header field name');
		}
		return name.toLowerCase();
	}

	function normalizeValue(value) {
		if (typeof value !== 'string') {
			value = String(value);
		}
		return value;
	}

	// Build a destructive iterator for the value list
	function iteratorFor(items) {
		var iterator = {
			next: function () {
				var value = items.shift();
				return { done: value === undefined, value: value };
			}
		};

		if (support.iterable) {
			iterator[Symbol.iterator] = function () {
				return iterator;
			};
		}

		return iterator;
	}

	function Headers(headers) {
		this.map = {};

		if (headers instanceof Headers) {
			headers.forEach(function (value, name) {
				this.append(name, value);
			}, this);
		} else if (Array.isArray(headers)) {
			headers.forEach(function (header) {
				this.append(header[0], header[1]);
			}, this);
		} else if (headers) {
			Object.getOwnPropertyNames(headers).forEach(function (name) {
				this.append(name, headers[name]);
			}, this);
		}
	}

	Headers.prototype.append = function (name, value) {
		name = normalizeName(name);
		value = normalizeValue(value);
		var oldValue = this.map[name];
		this.map[name] = oldValue ? oldValue + ', ' + value : value;
	};

	Headers.prototype['delete'] = function (name) {
		delete this.map[normalizeName(name)];
	};

	Headers.prototype.get = function (name) {
		name = normalizeName(name);
		return this.has(name) ? this.map[name] : null;
	};

	Headers.prototype.has = function (name) {
		return this.map.hasOwnProperty(normalizeName(name));
	};

	Headers.prototype.set = function (name, value) {
		this.map[normalizeName(name)] = normalizeValue(value);
	};

	Headers.prototype.forEach = function (callback, thisArg) {
		for (var name in this.map) {
			if (this.map.hasOwnProperty(name)) {
				callback.call(thisArg, this.map[name], name, this);
			}
		}
	};

	Headers.prototype.keys = function () {
		var items = [];
		this.forEach(function (value, name) {
			items.push(name);
		});
		return iteratorFor(items);
	};

	Headers.prototype.values = function () {
		var items = [];
		this.forEach(function (value) {
			items.push(value);
		});
		return iteratorFor(items);
	};

	Headers.prototype.entries = function () {
		var items = [];
		this.forEach(function (value, name) {
			items.push([name, value]);
		});
		return iteratorFor(items);
	};

	if (support.iterable) {
		Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
	}

	function consumed(body) {
		if (body.bodyUsed) {
			return Promise.reject(new TypeError('Already read'));
		}
		body.bodyUsed = true;
	}

	function fileReaderReady(reader) {
		return new Promise(function (resolve, reject) {
			reader.onload = function () {
				resolve(reader.result);
			};
			reader.onerror = function () {
				reject(reader.error);
			};
		});
	}

	function readBlobAsArrayBuffer(blob) {
		var reader = new FileReader();
		var promise = fileReaderReady(reader);
		reader.readAsArrayBuffer(blob);
		return promise;
	}

	function readBlobAsText(blob) {
		var reader = new FileReader();
		var promise = fileReaderReady(reader);
		reader.readAsText(blob);
		return promise;
	}

	function readArrayBufferAsText(buf) {
		var view = new Uint8Array(buf);
		var chars = new Array(view.length);

		for (var i = 0; i < view.length; i++) {
			chars[i] = String.fromCharCode(view[i]);
		}
		return chars.join('');
	}

	function bufferClone(buf) {
		if (buf.slice) {
			return buf.slice(0);
		} else {
			var view = new Uint8Array(buf.byteLength);
			view.set(new Uint8Array(buf));
			return view.buffer;
		}
	}

	function Body() {
		this.bodyUsed = false;

		this._initBody = function (body) {
			this._bodyInit = body;
			if (!body) {
				this._bodyText = '';
			} else if (typeof body === 'string') {
				this._bodyText = body;
			} else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
				this._bodyBlob = body;
			} else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
				this._bodyFormData = body;
			} else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
				this._bodyText = body.toString();
			} else if (support.arrayBuffer && support.blob && isDataView(body)) {
				this._bodyArrayBuffer = bufferClone(body.buffer);
				// IE 10-11 can't handle a DataView body.
				this._bodyInit = new Blob([this._bodyArrayBuffer]);
			} else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
				this._bodyArrayBuffer = bufferClone(body);
			} else {
				throw new Error('unsupported BodyInit type');
			}

			if (!this.headers.get('content-type')) {
				if (typeof body === 'string') {
					this.headers.set('content-type', 'text/plain;charset=UTF-8');
				} else if (this._bodyBlob && this._bodyBlob.type) {
					this.headers.set('content-type', this._bodyBlob.type);
				} else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
					this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
				}
			}
		};

		if (support.blob) {
			this.blob = function () {
				var rejected = consumed(this);
				if (rejected) {
					return rejected;
				}

				if (this._bodyBlob) {
					return Promise.resolve(this._bodyBlob);
				} else if (this._bodyArrayBuffer) {
					return Promise.resolve(new Blob([this._bodyArrayBuffer]));
				} else if (this._bodyFormData) {
					throw new Error('could not read FormData body as blob');
				} else {
					return Promise.resolve(new Blob([this._bodyText]));
				}
			};

			this.arrayBuffer = function () {
				if (this._bodyArrayBuffer) {
					return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
				} else {
					return this.blob().then(readBlobAsArrayBuffer);
				}
			};
		}

		this.text = function () {
			var rejected = consumed(this);
			if (rejected) {
				return rejected;
			}

			if (this._bodyBlob) {
				return readBlobAsText(this._bodyBlob);
			} else if (this._bodyArrayBuffer) {
				return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
			} else if (this._bodyFormData) {
				throw new Error('could not read FormData body as text');
			} else {
				return Promise.resolve(this._bodyText);
			}
		};

		if (support.formData) {
			this.formData = function () {
				return this.text().then(decode);
			};
		}

		this.json = function () {
			return this.text().then(JSON.parse);
		};

		return this;
	}

	// HTTP methods whose capitalization should be normalized
	var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

	function normalizeMethod(method) {
		var upcased = method.toUpperCase();
		return methods.indexOf(upcased) > -1 ? upcased : method;
	}

	function Request(input, options) {
		options = options || {};
		var body = options.body;

		if (input instanceof Request) {
			if (input.bodyUsed) {
				throw new TypeError('Already read');
			}
			this.url = input.url;
			this.credentials = input.credentials;
			if (!options.headers) {
				this.headers = new Headers(input.headers);
			}
			this.method = input.method;
			this.mode = input.mode;
			this.signal = input.signal;
			if (!body && input._bodyInit != null) {
				body = input._bodyInit;
				input.bodyUsed = true;
			}
		} else {
			this.url = String(input);
		}

		this.credentials = options.credentials || this.credentials || 'same-origin';
		if (options.headers || !this.headers) {
			this.headers = new Headers(options.headers);
		}
		this.method = normalizeMethod(options.method || this.method || 'GET');
		this.mode = options.mode || this.mode || null;
		this.signal = options.signal || this.signal;
		this.referrer = null;

		if ((this.method === 'GET' || this.method === 'HEAD') && body) {
			throw new TypeError('Body not allowed for GET or HEAD requests');
		}
		this._initBody(body);
	}

	Request.prototype.clone = function () {
		return new Request(this, { body: this._bodyInit });
	};

	function decode(body) {
		var form = new FormData();
		body.trim().split('&').forEach(function (bytes) {
			if (bytes) {
				var split = bytes.split('=');
				var name = split.shift().replace(/\+/g, ' ');
				var value = split.join('=').replace(/\+/g, ' ');
				form.append(decodeURIComponent(name), decodeURIComponent(value));
			}
		});
		return form;
	}

	function parseHeaders(rawHeaders) {
		var headers = new Headers();
		// Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
		// https://tools.ietf.org/html/rfc7230#section-3.2
		var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
		preProcessedHeaders.split(/\r?\n/).forEach(function (line) {
			var parts = line.split(':');
			var key = parts.shift().trim();
			if (key) {
				var value = parts.join(':').trim();
				headers.append(key, value);
			}
		});
		return headers;
	}

	Body.call(Request.prototype);

	function Response(bodyInit, options) {
		if (!options) {
			options = {};
		}

		this.type = 'default';
		this.status = options.status === undefined ? 200 : options.status;
		this.ok = this.status >= 200 && this.status < 300;
		this.statusText = 'statusText' in options ? options.statusText : 'OK';
		this.headers = new Headers(options.headers);
		this.url = options.url || '';
		this._initBody(bodyInit);
	}

	Body.call(Response.prototype);

	Response.prototype.clone = function () {
		return new Response(this._bodyInit, {
			status: this.status,
			statusText: this.statusText,
			headers: new Headers(this.headers),
			url: this.url
		});
	};

	Response.error = function () {
		var response = new Response(null, { status: 0, statusText: '' });
		response.type = 'error';
		return response;
	};

	var redirectStatuses = [301, 302, 303, 307, 308];

	Response.redirect = function (url, status) {
		if (redirectStatuses.indexOf(status) === -1) {
			throw new RangeError('Invalid status code');
		}

		return new Response(null, { status: status, headers: { location: url } });
	};

	var DOMException = self.DOMException;
	try {
		new DOMException();
	} catch (err) {
		DOMException = function (message, name) {
			this.message = message;
			this.name = name;
			var error = Error(message);
			this.stack = error.stack;
		};
		DOMException.prototype = Object.create(Error.prototype);
		DOMException.prototype.constructor = DOMException;
	}

	function fetch$1(input, init) {
		return new Promise(function (resolve, reject) {
			var request = new Request(input, init);

			if (request.signal && request.signal.aborted) {
				return reject(new DOMException('Aborted', 'AbortError'));
			}

			var xhr = new XMLHttpRequest();

			function abortXhr() {
				xhr.abort();
			}

			xhr.onload = function () {
				var options = {
					status: xhr.status,
					statusText: xhr.statusText,
					headers: parseHeaders(xhr.getAllResponseHeaders() || '')
				};
				options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
				var body = 'response' in xhr ? xhr.response : xhr.responseText;
				resolve(new Response(body, options));
			};

			xhr.onerror = function () {
				reject(new TypeError('Network request failed'));
			};

			xhr.ontimeout = function () {
				reject(new TypeError('Network request failed'));
			};

			xhr.onabort = function () {
				reject(new DOMException('Aborted', 'AbortError'));
			};

			xhr.open(request.method, request.url, true);

			if (request.credentials === 'include') {
				xhr.withCredentials = true;
			} else if (request.credentials === 'omit') {
				xhr.withCredentials = false;
			}

			if ('responseType' in xhr && support.blob) {
				xhr.responseType = 'blob';
			}

			request.headers.forEach(function (value, name) {
				xhr.setRequestHeader(name, value);
			});

			if (request.signal) {
				request.signal.addEventListener('abort', abortXhr);

				xhr.onreadystatechange = function () {
					// DONE (success or failure)
					if (xhr.readyState === 4) {
						request.signal.removeEventListener('abort', abortXhr);
					}
				};
			}

			xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
		});
	}

	function closestPolyfill (e) {
		e.closest = e.closest || function (css) {
			var node = this;

			while (node) {
				if (node.msMatchesSelector) {
					// ie 9-11
					if (node.msMatchesSelector(css)) return node;else node = node.parentElement;
				} else if (node.webkitMatchesSelector) {
					// webkit
					if (node.webkitMatchesSelector(css)) return node;else node = node.parentElement;
				} else {
					// other
					if (node.matches(css)) return node;else node = node.parentElement;
				}
			}
			return null;
		};
	}

	if (!window.fetch) window.fetch = fetch$1;
	if (!Element.prototype.closest) closestPolyfill(Element.prototype);

	// it is function because variable has cursor and bugs sometimes.
	// Function will return new regexp instance every time it need
	const slugRegex = _ => /\/:([\w-]+(?:{.*})?)/g; // like /benefit/:slug/ or /benefit/:slug{param1|param2}/

	/**
	 * Convert passed pattern to valid regular expression
	 * @private
	 * @param {string} pattern bmp-based pattern than will be converted to regular expression
	 */
	const _convertToRegExp = pattern => {
		// "{", "}", "|", "\", "^", "~", "[", "]", "`"
		return pattern.replace(slugRegex(), '\/([\\w-\%\.\'\"\(\)]+)');
	};

	/**
	 * Returns true if pathname of url is match pattern
	 * @param {string} url
	 * @returns {Boolean}
	 * @example
	 * isPatternMatchUrl( '/benefits/:slug/', '/benefits/event/' ) // -> true
	 * isPatternMatchUrl( '/fake/:slug/', '/benefits/event/' ) // -> false
	 * isPatternMatchUrl( '/benefits/:slug{event1|event2}/', '/benefits/event1/' ) // -> true
	 * isPatternMatchUrl( '/benefits/:slug{event1|event2}/', '/benefits/event3/' ) // -> false
	 */
	const isPatternMatchUrl = (pattern, pathname = location.pathname) => {

		if (slugRegex().test(pattern)) {
			// pattern has dynamic segments
			if (/{|}/.test(pattern)) {
				// pattern has "value" of dynamic segments
				const vals = extractValues(pattern, pathname);
				return Object.keys(vals).length > 0;
			} else {
				// pattern has only dynamic segments without value declaration
				const regexp = _convertToRegExp(pattern); //replace all dynamic segments to regexp values
				return new RegExp(`^${regexp}$`).test(pathname); // test pathname to according to regular expression
			}
		} else {
			return pattern === pathname; // simply string
		}
		return false; //default
	};

	/**
	 * Parser for extected values in ":key{value1|value2}" syntax near dynamic pathname segment
	 * and return clear key of this paramenets, test of expect and array of values
	 * @param {String} key single segment of url pattern
	 * @private
	 * @returns {ExpectResult}
	 * @example
	 * _parseExpectedVals( ":slug" ) // -> { key: "slug", expectValues: [] }
	 * _parseExpectedVals( ":slug{a|b}" ) // -> { key: "slug", expectValues: ['a', 'b'] }
	 */
	const _parseExpectedVals = key => {

		const isExpected = /{.*}/.test(key); // check for exists {} brackets in key
		let expectValues = [];
		if (isExpected) {
			expectValues = key.replace(/.*?[\w-]+{(.*)}/, '$1').split('|'); // get values from key
		}
		key = key.replace(/.*?([\w-]+)(?:{.*})?/, '$1'); // remove trash from key

		return { key, expectValues };
	};

	/**
	 * Extracts values from pathname by pattern. Returns pair key:value
	 * @param {String} pattern patter of url that will be parsed
	 * @param {String} pathname location pathname without base
	 * @returns {Object} extracted values
	 * @example
	 * extractValues( '/benefits/:slug/:action/', '/benefits/lotte-plaza/share/' )
	 * // -> { slug: 'lotte-plaza', action: 'share' }
	 */
	const extractValues = (pattern, pathname = location.pathname) => {

		// parse keys from pattern
		const paramsList = pattern.match(slugRegex());

		// parse values from pathname
		const regexpPattern = _convertToRegExp(pattern); // replace all dynamic segments to regexp values
		const regexp = new RegExp(`^${regexpPattern}$`);
		const urlSegments = pathname.match(regexp); // array segments of url, first will contains full match

		let values = [];
		if (Array.isArray(paramsList) && urlSegments) {
			// collect params and segments to object
			values = paramsList.reduce((acc, param, index) => {
				if (urlSegments[index + 1]) {
					const val = urlSegments[index + 1]; // skip full match element
					const { key, expectValues } = _parseExpectedVals(param); // ask for expected vals (like :slug{s1|s2|s3})
					if (!expectValues.length || expectValues.indexOf(val) >= 0) {
						acc[key] = val; // (not expected anything) or (expected array contains received value)
					}
				}

				return acc;
			}, {});
		}

		return values;
	};

	/**
	 * Replace all double+ slashes and check for exists / in end end start of url
	 * @method
	 * @param {string} path path that will be unified
	 */
	const unifyPathname = path => {
		if (path === '/' || path == '') return '/';
		return path.replace(/^\/?([^?#]+?)\/?((?=\?|#).*)?$/, '/$1/$2') // add end slash and start slash
		.replace(/\/\/+/g, '/'); // remove multiple slashes
	};

	var _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	// config of router that can be changed with static method
	let config = null;

	const trackView = view => {
		if (typeof ga == 'function') ga('send', 'pageview');
	};

	/**
	 * Router web-component class. <br/>
	 * Creates 'bmp-view' elements based on location pathname and base html-tag <br/>
	 * Work on bmp-based config file that will be required relative to web path <br/>
	 * Bmp-based config supports url pattern syntax with expected/unexpected parameters: <br/>
	 * /benefit/:slug/ <br/>
	 * /benefit/:slug{lotte-plaza|carhopper}/ <br/>
	 * @class
	 * @example
	 * ... config.js:
	 *  routes: [
	 *    { url: '/benefit/', template: 'Benefit list' },
	 *    { url: '/benefit/:slug/', template: 'Benefit detail' }
	 *    { url: '/benefit/:slug{carhopper}/', template: 'Benefit carhopper detail' }
	 *  ]
	 * ...
	 * <bmp-router data-config="./config.js"></bmp-router>
	 */
	class BmpRouter extends HTMLElement {

		/** @constructor */
		constructor() {
			super();
			// preset options
			this.scrollRegistry = {};
			this.currentRoute = '';
		}

		static config(confObj) {
			config = confObj;
		}

		static get is() {
			return 'bmp-router';
		}

		/**
		* Getter, returns base path from "base" tag without url origin
		* @example
		* <base href="http://localhost/foo/bar/" />
		* ...
		* <script>console.log( RouterInstance.basepath )</script> // -> /foo/bar/
		*/
		get basepath() {
			return document.baseURI.replace(/https?:\/\/[\w.-]+(\:[0-9]+)?/g, ''); // remove domain and protocol
		}

		// static getMetatags(requestURI, { routes, metaDefaults }) {
		// 	const view = this.getViewConf(requestURI, routes)

		// 	// view meta object is not required, return default in this case
		// 	if (!view || typeof view.meta !== 'object')
		// 		return metaDefaults

		// 	return Object.keys(metaDefaults).reduce( (result, tag) => {
		// 		// if view don't contain tag, take default
		// 		if (view.meta.hasOwnProperty(tag)) {
		// 			// view meta element can be function
		// 			// it means that meta tag contains dynamic content
		// 			// like el => `${el.title} Blog Post | JetSmarter`
		// 			if (typeof view.meta[tag] === 'function') {
		// 				// get custom element {constructor, tagName} instance
		// 				const component = customElements.get(view.tagName)
		// 				if ( component && component.constructor.lastElement )
		// 					// call meta fn with passed last loaded element
		// 					result[tag] = view.meta[tag]( component.constructor.lastElement )
		// 			} else {
		// 				// pass string in metatag
		// 				result[tag] = view.meta[tag]
		// 			}
		// 		}
		// 		return result
		// 	}, metaDefaults)
		// }

		async connectedCallback() {

			if (!this.hasAttribute('ssr')) {
				this.config = await this.requireConfig();
				await this._refreshViews();
			}

			this.handlePopstate = async ev => {
				ev.preventDefault();
				if (!this.config) this.config = await this.requireConfig();
				await this._refreshViews();
				trackView(location.pathname);
			};
			window.addEventListener('popstate', this.handlePopstate, false);
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.handlePopstate, false);
		}

		/**
		* Returns config file exports that was declarated in "data-config" attribute
		* @returns {Promise}
		*/
		requireConfig() {
			if (config) {
				return config;
			} else {
				const confFilePath = this.getAttribute('data-config');
				if (!confFilePath) throw new Error("Configuration file not found");

				return new Promise(resolve => {
					require([confFilePath], resolve);
				});
			}
		}

		/**
		* Removes basepath from location.pathname and return unify pathname
		* @return {string} pathname of current state
		*/
		getCurrentPathname(pathname = location.pathname) {
			if (this.basepath) {
				// remove basepath from pathname
				pathname = pathname.replace(new RegExp(`^${this.basepath}(.*)$`), '$1');
			}
			return unifyPathname(pathname); // remove all double slashas and add first slash/end slash
		}

		/**
		* Getter
		* @return {Array} current views list in router
		*/
		get views() {
			return [...this.children].filter(node => node.tagName != this.config.viewTag);
		}

		static getViewConf(pathname, urlConf) {
			return urlConf.find(route => {
				return isPatternMatchUrl(route.pattern, pathname);
			});
		}

		static statusCode(uri, routes) {
			return this.getViewConf(uri, routes) ? 200 : 404;
		}

		/**
		* Load view template from config then create view and insert it to dom
		* Trying to get dynamic params from location, add id to view's attributes
		* @param {string} pathname pathname of view that need to be created
		* @private
		* @example
		* <script>RouterInstance._createView( '/benefits/lotte-plaza/' )</script>
		* ...
		*  <bmp-router>
		*    <bmp-view params='{"slug":"lotte-plaza"}'>Lotte plaza</bmp-view>
		*  </bmp-router>
		* ...
		*/
		async _createView(pathname) {
			const view = document.createElement(this.config.viewTag);
			view.setAttribute('pathname', pathname);
			const viewConf = BmpRouter.getViewConf(pathname, this.config.routes);

			if (viewConf) {
				const params = extractValues(viewConf.pattern, this.getCurrentPathname());
				let { tagName, attributes } = viewConf;
				const component = document.createElement(tagName);
				if (params) {
					const jsonParams = JSON.stringify(params);
					view.setAttribute('params', jsonParams);
					if (attributes) {
						if (attributes.hasOwnProperty('view-params')) attributes['view-params'] = jsonParams;
						Object.keys(attributes).forEach(key => component.setAttribute(key, attributes[key].toString()));
					}
				}

				view.appendChild(component);
			} else {
				view.innerHTML = `<${this.config.not_found_tag} />`;
			}

			this.appendChild(view);
			if (this.config.seoblocks) await this.updateMeta(viewConf);
		}

		async generateSeo(data, tagName) {
			if (typeof data !== 'function') return data; // probably static data

			const component = customElements.get(tagName);
			try {
				// get last loaded element
				const lastElement = await component.getLastElement();
				// generate dynamic data
				return data(lastElement || {});
			} catch (e) {
				// data function throws an error, return empty object
				return null;
			}
		}

		async updateMeta(viewConf) {
			const { seoblocks: seoblocks$$1, seoDefaults: seoDefaults$$1 } = this.config;
			const jsonld = [...seoDefaults$$1.jsonld]; // jsonld = array of items
			if (!viewConf || !viewConf.seoSlug) {
				this.setMetatags(seoDefaults$$1.meta);
			} else {
				const seoblock = seoblocks$$1.find(item => item.slug === viewConf.seoSlug);
				if (seoblock) {
					if (!seoblock.meta) this.setMetatags(seoDefaults$$1.meta); // meta for this slug not defined

					// view view seo (metatags) and schema (ld+json)
					const [viewSeo, viewSchema] = await Promise.all([this.generateSeo(seoblock.meta, viewConf.tagName), this.generateSeo(seoblock.jsonld, viewConf.tagName)]);
					// merge viewSeo with default
					this.setMetatags(_extends$3({}, seoDefaults$$1.meta, viewSeo));
					if (viewSchema) {
						// support f	or 2 formats: [{ ... }] and  {...}
						if (Array.isArray(viewSchema)) jsonld.push(...viewSchema);else jsonld.push(viewSchema);
					}
				}
			}

			this.setJsonLD(jsonld);
		}

		/**
		* Set ld+json schema to script tag. If tag not exists, create it
		* @param {Array} schemas json format
		*/
		setJsonLD(schemas) {
			if (typeof schemas == 'object' || Array.isArray(schemas) && schemas.length) {

				const existsScript = this.querySelector('[type="application/ld+json"]');
				const content = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
				if (!existsScript || window.IS_SSR) {
					const newScript = document.createElement('script');
					newScript.setAttribute('type', 'application/ld+json');
					newScript.innerHTML = content;
					this.appendChild(newScript);
				} else {
					existsScript.innerHTML = content;
				}
			}
		}

		async setMetatags(seo) {
			document.title = seo.title || '';['title', 'description', 'keywords'].forEach(metakey => {
				const metatag = document.querySelector(`meta[name="${metakey}"]`);
				const val = seo[metakey];
				if (window.IS_SSR || !metatag) {
					const newTag = document.createElement('meta');
					newTag.setAttribute('name', metakey);
					newTag.setAttribute('content', val);
					document.head.appendChild(newTag);
				} else {
					metatag.setAttribute('content', val);
				}
			});
		}

		/**
		* Caches current scroll position
		* @param {Bolean} isBack what
		*/
		_updateScroll(pathname) {
			const isBack = this.currentRoute.includes(pathname);
			if (isBack) {
				// get cached scroll position and set it to view
			} else {
				// cache current scroll position
				this.scrollRegistry[pathname] = window.pageYOffset;
			}
		}

		/**
		* Refreshing view elements in DOM. Delete all "old" views and create view by current pathname
		* @private
		*/
		async _refreshViews() {
			let pathname = this.getCurrentPathname();
			if (pathname != this.currentRoute) {
				// fired only for changed path


				if (this.views.length) {
					// destroy old view(s)
					this.views.forEach(view => view.setAttribute('state', 'anim-out'));
				}
				// create new view with current pathname
				await this._createView(pathname);
				// update scroll of current state
				this._updateScroll(pathname);
				// cache current route
				this.currentRoute = pathname;
			}
		}

		/**
		* Creates new popstate event for window history with passed pathname
		* @param {string} pathname pathname that
		* @param {string} title Title of page
		* @example
		* <script> RouterInstance.go( '/benefits/lotte-plaza/' ) </script>
		*/
		go(rawPathname, title = null) {

			const oldpathname = location.pathname;
			const pathname = unifyPathname(`${this.basepath}/${rawPathname}`);

			const urlToGo = location.origin + pathname;
			// send url to state params, so we can detect what state is
			window.history.pushState({ 'url': urlToGo }, title, urlToGo);
			window.dispatchEvent(new Event('popstate'));

			if (unifyPathname(location.pathname) != oldpathname.replace(/(?=\?|#).*/, '')) window.scrollTo(0, 0);
		}

		/**
		* Returns back by history browser
		* @example
		* <script> RouterInstance.back() </script>
		*/
		back() {
			window.history.back();
		}
	}

	customElements.define(BmpRouter.is, BmpRouter);

	const getDuration = el => {
		let { transitionDuration } = window.getComputedStyle(el);
		if (/^[0-9\.]+s?/.test(transitionDuration)) {
			// seconds
			transitionDuration = 1000 * parseFloat(transitionDuration);
		}
		return parseFloat(transitionDuration);
	};

	/**
	 * View base class. All events must be changed by attribte
	 * @class
	 * @example
	 * <bmp-view></bmp-view>
	 */
	class BmpView extends HTMLElement {

		constructor() {
			super();
		}

		static get is() {
			return 'bmp-view';
		}
		static get observedAttributes() {
			return ['state', 'pathname'];
		}

		get animDelay() {
			return parseFloat(this.getAttribute('anim-delay'));
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (name == 'state') {
				if (newValue === 'anim-out') {
					// remove view with delay
					this.style.position = 'absolute';
					this.style.top = `${-window.pageYOffset}px`;
					setTimeout(_ => {
						this.parentNode.removeChild(this);
					}, this.animDelay);
				}
			}
		}

		connectedCallback() {
			this.setAttribute('anim-delay', getDuration(this));

			setTimeout(_ => {
				this.setAttribute('state', 'anim-in'); // delay for animate trigger
			}, 50);
		}

		disconnectedCallback() {}

	}

	/** TODO: defferent method for web-component polyffil v0 */
	customElements.define(BmpView.is, BmpView);

	const replaceLink = (link, origin = window.location.origin) => {
		const href = link.getAttribute('href');

		if (href && !/^(http|\/\/)/.test(href)) {
			link.href = origin + unifyPathname(href);
		}
	};

	const refClick = function (ev) {
		ev.preventDefault();

		const link = this.querySelector('a');
		if (link) document.querySelector('bmp-router').go(link.pathname + link.search);
	};

	/**
	 * Prevent default action behavior and handle click event, call router to navigate somewhere
	 * Defines web-component as "bmp-anchor" tag
	 * @class
	 * @example
	 * <bmp-anchor>
	 *  <a href="/">Home</a>
	 * </bmp-anchor>
	 * <bmp-anchor>
	 *  <a href="/about/">About</a>
	 * </bmp-anchor>
	 */
	class BmpAnchor extends HTMLElement {

		static get is() {
			return 'bmp-anchor';
		}

		constructor() {
			super();
		}

		connectedCallback() {
	[...this.querySelectorAll('a')].forEach(el => replaceLink(el));
			this.linksObserver = new MutationObserver(mutationRecords => {
				mutationRecords.forEach(mutationRecord => {
					[...mutationRecord.addedNodes].forEach(el => replaceLink(el));
				});
			});
			this.linksObserver.observe(this, { childList: true, subtree: true });
			this.addEventListener('click', refClick, false);
		}

		disconnectedCallback() {
			this.linksObserver.disconnect();
			this.removeEventListener('click', refClick, false);
		}

	}

	customElements.define(BmpAnchor.is, BmpAnchor);

	const routes = [
	// Home page
	{
		pattern: '/',
		tagName: 'jetsm-home',
		seoSlug: 'home'
	},
	// FAQ
	{
		pattern: '/faq/',
		tagName: 'jetsm-faq-list',
		seoSlug: 'faq'
	},
	// Legal
	{ pattern: '/legal/',
		tagName: 'jetsm-legal-list',
		seoSlug: 'legal'
	}, { pattern: '/legal/public-charter-agreements/',
		tagName: 'jetsm-pca',
		seoSlug: 'pca'
	}, { pattern: '/legal/public-charter-agreements/:document_number/',
		tagName: 'jetsm-pca-detail',
		seoSlug: 'pca-detail',
		attributes: { 'view-params': true }
	}, { pattern: '/legal/:legal_slug/',
		tagName: 'jetsm-legal-detail',
		seoSlug: 'legal',
		attributes: { 'view-params': true }
	},

	// Profile
	{ pattern: '/profile/',
		skipSitemap: true,
		tagName: 'profile-edit',
		seoSlug: 'profile'
	}, { pattern: '/profile/promo/',
		skipSitemap: true,
		tagName: 'profile-promo',
		seoSlug: 'profile'
	}, { pattern: '/profile/verify/',
		skipSitemap: true,
		tagName: 'profile-verify',
		seoSlug: 'profile'
	}, { pattern: '/profile/payment-methods/',
		skipSitemap: true,
		tagName: 'profile-payment',
		seoSlug: 'profile'
	},
	// Authorization
	{ pattern: '/login/',
		skipSitemap: true,
		tagName: 'jetsm-login',
		seoSlug: 'login'
	}, { pattern: '/logout/',
		skipSitemap: true,
		tagName: 'jetsm-logout',
		seoSlug: 'logout'
	}, { pattern: '/signup/',
		skipSitemap: true,
		tagName: 'jetsm-sign-up',
		slug: 'login'
	},
	// Web forms
	{ pattern: '/partnership/',
		tagName: 'jetsm-form',
		seoSlug: 'form-partnership',
		attributes: {
			'with-scafold': true,
			'data-slug': "v4-partnership",
			'bg-contain': true,
			'data-bg': "https://jetsmarter.com/data/site-v5/assets/airline.jpg"
		}
	}, { pattern: '/nbaa17/',
		tagName: 'jetsm-form',
		seoSlug: 'form-nbaa',
		attributes: {
			'with-scafold': true,
			'data-slug': "v4-nbaa17",
			'bg-contain': true,
			'data-bg': "https://jetsmarter.com/data/site-v5/assets/plane.jpg"
		}
	}, { pattern: '/owners/request-form/',
		tagName: 'jetsm-form',
		seoSlug: 'form-owners',
		attributes: {
			'with-scafold': true,
			'data-slug': "owners-program",
			'class': "template-light",
			'data-bg': "https://jetsmarter.com/data/site-v5/assets/airline.jpg"
		}
	},

	// Experience
	{
		pattern: '/experience/',
		tagName: 'jetsm-page',
		seoSlug: 'experience',
		attributes: {
			'data-template': "experience"
		}
	},

	// About
	{
		pattern: '/about/',
		tagName: 'jetsm-page',
		seoSlug: 'about',
		attributes: { 'data-template': "about" }
	}, {
		pattern: '/about/:board_member/',
		tagName: 'jetsm-page',
		seoSlug: 'about-detail',
		attributes: {
			'data-template': "about-detail",
			'view-params': true
		}
	},

	// News
	{
		pattern: '/news/',
		tagName: 'jetsm-news-list',
		seoSlug: 'news'
	}, {
		pattern: '/blog/',
		tagName: 'jetsm-news-list',
		seoSlug: 'blog'
	}, {
		pattern: '/blog/:slug/',
		tagName: 'jetsm-news-detail',
		seoSlug: 'blog-detail',
		attributes: {
			'view-params': true
		}
	},

	// Career
	{
		pattern: '/career/',
		tagName: 'jetsm-career',
		seoSlug: 'career'
	},

	// How it works
	{
		pattern: '/how-it-works/',
		tagName: 'jetsm-hiw',
		seoSlug: 'how-it-works'
	},

	// Reviews
	{
		pattern: '/reviews/',
		tagName: 'jetsm-page',
		seoSlug: 'reviews',
		attributes: { 'data-template': "community" }
	},
	// Contact us
	{
		pattern: '/contact-us/',
		tagName: 'jetsm-page',
		seoSlug: 'contact-us',
		attributes: { 'data-template': "contacts" }
	},

	// Download the app
	{
		pattern: '/download/',
		tagName: 'jetsm-download',
		seoSlug: 'download'
	},

	// Safety and security
	{
		pattern: '/safety-security/',
		tagName: 'jetsm-page',
		seoSlug: 'safety-security',
		attributes: { 'data-template': "safety" }
	}, {
		pattern: '/safety-security/:company/',
		tagName: 'jetsm-page',
		seoSlug: 'safety-security-detail',
		attributes: { 'data-template': "safety-detail", 'view-params': true }
	},

	// Owners & fleet
	{
		pattern: '/owners/',
		tagName: 'jetsm-page',
		seoSlug: 'owners',
		attributes: { 'data-template': "owners" }
	}, {
		pattern: '/fleet/',
		tagName: 'jetsm-page',
		seoSlug: 'fleet',
		attributes: { 'data-template': "fleet" }
	},

	// My trips
	{
		pattern: '/my-trips/',
		skipSitemap: true,
		tagName: 'jetsm-my-trips',
		seoSlug: 'my-trips'
	}, {
		pattern: '/my-trips/:slug/',
		skipSitemap: true,
		seoSlug: 'my-trips',
		tagName: 'jetsm-my-trips-detail',
		attributes: { 'view-params': true }
	},

	// Webproduct pages
	// TODO: make it more flexible, like array of patterns ['pattern1', 'pattern2'], tmpl: '<web-product />'
	{
		pattern: '/flights/',
		tagName: 'routes-list',
		seoSlug: 'flights'
	}, {
		pattern: '/flights/checkout/',
		tagName: 'jet-flights',
		/** TODO: Implement is SSR */
		skipSitemap: true,
		attributes: { 'is-checkout': true, 'view-params': true },
		seoSlug: 'flights'
	}, {
		pattern: '/flights/:route/',
		tagName: 'jet-flights',
		seoSlug: 'flights',
		skipSitemap: true,
		attributes: { 'view-params': true }
	}, {
		pattern: '/flights/:route/:shuttleId/',
		tagName: 'jet-flights',
		seoSlug: 'flights',
		attributes: { 'view-params': true }
	}];
	const viewTag = 'bmp-view';
	const not_found_tag = 'page-404';
	const seoblock = window.ENV === 'production' ? '/data/jscomv5/seoblock.js' : './seoblock.js';

	var appConfig = /*#__PURE__*/Object.freeze({
		routes: routes,
		viewTag: viewTag,
		not_found_tag: not_found_tag,
		seoblock: seoblock
	});

	const ENV = 'production';
	const SERVER_NAME = 'https://jetsmarter.com';
	const BASE_URI = '/';

	var ENV$1 = /*#__PURE__*/Object.freeze({
		ENV: ENV,
		SERVER_NAME: SERVER_NAME,
		BASE_URI: BASE_URI
	});

	const FX = {
		// shadowDefault: 'rgba(0, 0, 0, 0.1) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0px',
		// shadowHover: 'rgba(0, 0, 0, 0.1) 0px 3px 2px -1px, rgba(0, 0, 0, 0.07) 0px 3px 2px 0px, rgba(0, 0, 0, 0.06) 0px 3px 4px 0px',
		shadowDefault: '0 0px 0px 0px rgba(0, 0, 0, 0.2), 0 0px 0px 0px rgba(0,0,0, 0.14), 0 0px 0px 0px rgba(0,0,0, 0.12)',
		shadowHover: '0 5px 5px -3px rgba(0,0,0, 0.2), 0 3px 10px 1px rgba(0,0,0, 0.14), 0 1px 14px 2px rgba(0,0,0, 0.12)',
		transSpeedFast: '.25s',
		radiusSmall: '6px',
		radiusMedium: '12px',

		shadow: {
			default: '0 0px 0px 0px rgba(0, 0, 0, 0.2), 0 0px 0px 0px rgba(0,0,0, 0.14), 0 0px 0px 0px rgba(0,0,0, 0.12)',
			hover: '0 5px 5px -3px rgba(0,0,0, 0.2), 0 3px 10px 1px rgba(0,0,0, 0.14), 0 1px 14px 2px rgba(0,0,0, 0.12)'
		},

		scale: {
			active: '0.93',
			hover: '1.01'
		},

		radius: {
			small: '6px',
			medium: '12px'
		},

		speed: {
			fast: '0.25s',
			medium: '0.5',
			logn: '0.75'
		},

		media: {
			mob: '479px',
			tab: '839px'
		}

	};

	const COLOR = {
		dark: '#44423E',
		darkMedium: '#837E74',
		darkBlured: '#44423E',
		neutral: '#CECBC3',
		light: '#EEECE7',
		lightBorder: '#A7A299',
		gold: '#D3A87B',
		primary: '#FE6A57',
		white: '#fff'
	};

	const Shell = {
		generate: ({ lang, css, js = '', html, head, baseURI = false }) => {
			return `
				<!DOCTYPE html>
				<html lang="${lang}">
					<head>
						<meta charset="UTF-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1.0" />
						<meta http-equiv="X-UA-Compatible" content="ie=edge" />
						${baseURI ? `<base href="${baseURI}" />` : ''}
						<style>${Shell.getResetCss()}</style>
						<style>${Shell.getFontFaces()}</style>
						<style>${Shell.grid()}</style>
						<style>${css}</style>
						${head || ''}

						<script crossorigin="anonymous" src="/data/jscomv5/assets/libs/polyfills/webcomponents-loader.js"></script>
						<script crossorigin="anonymous" src="/data/jscomv5/assets/libs/polyfills/babel-polyfill.min.js"></script>
						<script crossorigin="anonymous" src="/data/jscomv5/assets/libs/polyfills/custom-element-es5-adapter.js"></script>

						${Shell.getIcons()}

					</head>
					<body>
						${html}
						<script>${js}</script>
						<!--<script async crossorigin="anonymous" src="/data/jscomv5/assets/libs/rollbar.js"></script>-->
						<script crossorigin="anonymous" src="/data/jscomv5/assets/libs/require.js"></script>
						<script>
							window.SERVER_NAME = "${SERVER_NAME}";
							window.facbookPixelID = 209432422790198;
							window.hidenav = false;
							window.ENV = 'production';
							window.apiGateway = 'https://api.jetsmarter.com';

							requirejs.config({
								waitSeconds : 0,
								paths: {
									"bmp-core": "https://cdn.boomfunc.io/bmp-core/0.0.15/index",
									"bmp-router": "https://cdn.boomfunc.io/bmp-router/0.0.16/index",
									"seoblock": "https://jetsmarter.com/data/jscomv5/seoblock"
								}
							});
							document.addEventListener( 'WebComponentsReady', function() {
								requirejs([ '/data/jscomv5/index.js' ])
							})

						</script>
						<script async crossorigin="anonymous" onload="window.ReactAppLoaded && window.ReactAppLoaded();" src="https://jetsmarter.com/data/webp/integratedApp.js"></script>
					</body>
				</html>
			`;
		},

		getMetatags: ({ title, description, keywords, image }) => {
			return `
				<meta name="description" content="${description}">
				<meta name="keywords" content="${keywords}">

				<meta id="ogtitle" property="og:title" content="${title}" />
				<meta id="ogsite_name" property="og:site_name" content="jetsmarter.com"/>
				<meta id="ogdescription" property="og:description" content="${description}" />
				<meta id="ogimage" property="og:image" content="${image}" />

				<meta name="twitter:card" content="summary" />
				<meta name="twitter:site" content="@jetsmarter.com" />
				<meta id="twtitle" name="twitter:title" content="${title}" />
				<meta id="twdesription" name="twitter:description" content="${description}" />
				<meta id="twimage" name="twitter:image" content="${image}" />
			`;
		},

		getIcons() {
			return `
				<link rel="apple-touch-icon" sizes="57x57" href="${SERVER_NAME}/data/website/favicons/apple-icon-57x57.png">
				<link rel="apple-touch-icon" sizes="60x60" href="${SERVER_NAME}/data/website/favicons/apple-icon-60x60.png">
				<link rel="apple-touch-icon" sizes="72x72" href="${SERVER_NAME}/data/website/favicons/apple-icon-72x72.png">
				<link rel="apple-touch-icon" sizes="76x76" href="${SERVER_NAME}/data/website/favicons/apple-icon-76x76.png">
				<link rel="apple-touch-icon" sizes="114x114" href="${SERVER_NAME}/data/website/favicons/apple-icon-114x114.png">
				<link rel="apple-touch-icon" sizes="120x120" href="${SERVER_NAME}/data/website/favicons/apple-icon-120x120.png">
				<link rel="apple-touch-icon" sizes="144x144" href="${SERVER_NAME}/data/website/favicons/apple-icon-144x144.png">
				<link rel="apple-touch-icon" sizes="152x152" href="${SERVER_NAME}/data/website/favicons/apple-icon-152x152.png">
				<link rel="apple-touch-icon" sizes="180x180" href="${SERVER_NAME}/data/website/favicons/apple-icon-180x180.png">
				<link rel="icon" type="image/png" sizes="192x192"  href="${SERVER_NAME}/data/website/favicons/android-icon-192x192.png">
				<link rel="icon" type="image/png" sizes="32x32" href="${SERVER_NAME}/data/website/favicons/favicon-32x32.png">
				<link rel="icon" type="image/png" sizes="96x96" href="${SERVER_NAME}/data/website/favicons/favicon-96x96.png">
				<link rel="icon" type="image/png" sizes="16x16" href="${SERVER_NAME}/data/website/favicons/favicon-16x16.png">
				<link rel="manifest" href="${SERVER_NAME}/data/website/favicons/manifest.json">

				<meta name="msapplication-TileColor" content="#da532c">
				<meta name="msapplication-TileImage" content="/data/website/favicons/ms-icon-144x144.png">
				<meta name="theme-color" content="#ffffff">
			`;
		},

		getResetCss() {
			return `html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{word-break:break-word;margin:0;padding:0;border:0;font-size:100%;font:inherit;vertical-align:baseline}input{word-break: normal;}html{-webkit-text-size-adjust:100%}body *{-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}sup{vertical-align:super;font-size:0.5em}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block}body{-webkit-font-smoothing:antialiased;line-height:1}ol,ul{list-style:none}blockquote,q{quotes:none}blockquote:before,blockquote:after,q:before,q:after{content:'';content:none}table{border-collapse:collapse;border-spacing:0}button,canvas{outline:none}html,body{min-height:100%;height:100%}body{position:relative}.overflow-hidden{overflow: hidden;}`;
		},

		getFontFaces() {
			return `
				@font-face {
					font-family: 'Gotham';
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Bold.eot");
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Bold.eot?#iefix") format("embedded-opentype"), url("https://jetsmarter.com/assets/fonts/Gotham-Bold.woff") format("woff"), url("https://jetsmarter.com/assets/fonts/Gotham-Bold.ttf") format("truetype"), url("https://jetsmarter.com/assets/fonts/Gotham-Bold.svg#6a327a217ddd10461b1acdc4d224fee0") format("svg");
					font-style: normal;
					font-weight: 500
				}

				@font-face {
					font-family: 'Gotham';
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Medium.eot");
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Medium.eot?#iefix") format("embedded-opentype"), url("https://jetsmarter.com/assets/fonts/Gotham-Medium.woff") format("woff"), url("https://jetsmarter.com/assets/fonts/Gotham-Medium.ttf") format("truetype"), url("https://jetsmarter.com/assets/fonts/Gotham-Medium.svg#bdc473fae2f64b1c45b8886bcff81bae") format("svg");
					font-style: normal;
					font-weight: 400
				}

				@font-face {
					font-family: 'Gotham';
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Book.eot");
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Book.eot?#iefix") format("embedded-opentype"), url("https://jetsmarter.com/assets/fonts/Gotham-Book.woff") format("woff"), url("https://jetsmarter.com/assets/fonts/Gotham-Book.ttf") format("truetype"), url("https://jetsmarter.com/assets/fonts/Gotham-Book.svg#7510147900d23fa3ad697e74bf146ea2") format("svg");
					font-style: normal;
					font-weight: 300
				}

				@font-face {
					font-family: 'Gotham';
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Light.eot");
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Light.eot?#iefix") format("embedded-opentype"), url("https://jetsmarter.com/assets/fonts/Gotham-Light.woff") format("woff"), url("https://jetsmarter.com/assets/fonts/Gotham-Light.ttf") format("truetype"), url("https://jetsmarter.com/assets/fonts/Gotham-Light.svg#bf16822e282b4d885cff891f3a65335d") format("svg");
					font-style: normal;
					font-weight: 200
				}

				@font-face {
					font-family: 'Gotham';
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Thin.eot");
					src: url("https://jetsmarter.com/assets/fonts/Gotham-Thin.eot?#iefix") format("embedded-opentype"), url("https://jetsmarter.com/assets/fonts/Gotham-Thin.woff") format("woff"), url("https://jetsmarter.com/assets/fonts/Gotham-Thin.ttf") format("truetype"), url("https://jetsmarter.com/assets/fonts/Gotham-Thin.svg#2612f69d108fca39cb109c03ae310193") format("svg");
					font-style: normal;
					font-weight: 100
				}
			`;
		},

		grid() {
			return `:root{--mdc-layout-grid-margin-desktop:24px;--mdc-layout-grid-gutter-desktop:24px;--mdc-layout-grid-column-width-desktop:72px;--mdc-layout-grid-margin-tablet:16px;--mdc-layout-grid-gutter-tablet:16px;--mdc-layout-grid-column-width-tablet:72px;--mdc-layout-grid-margin-phone:16px;--mdc-layout-grid-gutter-phone:16px;--mdc-layout-grid-column-width-phone:72px}@media (min-width:840px){.mdc-layout-grid{box-sizing:border-box;margin:0 auto;padding:24px;padding:var(--mdc-layout-grid-margin-desktop,24px)}}@media (min-width:480px) and (max-width:839px){.mdc-layout-grid{box-sizing:border-box;margin:0 auto;padding:16px;padding:var(--mdc-layout-grid-margin-tablet,16px)}}@media (max-width:479px){.mdc-layout-grid{box-sizing:border-box;margin:0 auto;padding:16px;padding:var(--mdc-layout-grid-margin-phone,16px)}}@media (min-width:840px){.mdc-layout-grid__inner{display:flex;flex-flow:row wrap;align-items:stretch;margin:-12px;margin:calc(var(--mdc-layout-grid-gutter-desktop,24px) / 2 * -1)}@supports (display:grid){.mdc-layout-grid__inner{display:grid;margin:0;grid-gap:24px;grid-gap:var(--mdc-layout-grid-gutter-desktop,24px);grid-template-columns:repeat(12,minmax(0,1fr))}}}@media (min-width:480px) and (max-width:839px){.mdc-layout-grid__inner{display:flex;flex-flow:row wrap;align-items:stretch;margin:-8px;margin:calc(var(--mdc-layout-grid-gutter-tablet,16px) / 2 * -1)}@supports (display:grid){.mdc-layout-grid__inner{display:grid;margin:0;grid-gap:16px;grid-gap:var(--mdc-layout-grid-gutter-tablet,16px);grid-template-columns:repeat(8,minmax(0,1fr))}}}@media (max-width:479px){.mdc-layout-grid__inner{display:flex;flex-flow:row wrap;align-items:stretch;margin:-8px;margin:calc(var(--mdc-layout-grid-gutter-phone,16px) / 2 * -1)}@supports (display:grid){.mdc-layout-grid__inner{display:grid;margin:0;grid-gap:16px;grid-gap:var(--mdc-layout-grid-gutter-phone,16px);grid-template-columns:repeat(4,minmax(0,1fr))}}}@media (min-width:840px){.mdc-layout-grid__cell{width:calc(33.33333% - 24px);width:calc(33.33333% - var(--mdc-layout-grid-gutter-desktop,24px));box-sizing:border-box;margin:12px;margin:calc(var(--mdc-layout-grid-gutter-desktop,24px) / 2)}@supports (display:grid){.mdc-layout-grid__cell{width:auto;grid-column-end:span 4}}@supports (display:grid){.mdc-layout-grid__cell{margin:0}}.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-desktop{width:calc(8.33333% - 24px);width:calc(8.33333% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-desktop{width:auto;grid-column-end:span 1}}.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-desktop{width:calc(16.66667% - 24px);width:calc(16.66667% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-desktop{width:auto;grid-column-end:span 2}}.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-desktop{width:calc(25% - 24px);width:calc(25% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-desktop{width:auto;grid-column-end:span 3}}.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-desktop{width:calc(33.33333% - 24px);width:calc(33.33333% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-desktop{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-desktop{width:calc(41.66667% - 24px);width:calc(41.66667% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-desktop{width:auto;grid-column-end:span 5}}.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-desktop{width:calc(50% - 24px);width:calc(50% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-desktop{width:auto;grid-column-end:span 6}}.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-desktop{width:calc(58.33333% - 24px);width:calc(58.33333% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-desktop{width:auto;grid-column-end:span 7}}.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-desktop{width:calc(66.66667% - 24px);width:calc(66.66667% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-desktop{width:auto;grid-column-end:span 8}}.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-desktop{width:calc(75% - 24px);width:calc(75% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-desktop{width:auto;grid-column-end:span 9}}.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-desktop{width:calc(83.33333% - 24px);width:calc(83.33333% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-desktop{width:auto;grid-column-end:span 10}}.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-desktop{width:calc(91.66667% - 24px);width:calc(91.66667% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-desktop{width:auto;grid-column-end:span 11}}.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-desktop{width:calc(100% - 24px);width:calc(100% - var(--mdc-layout-grid-gutter-desktop,24px))}@supports (display:grid){.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-desktop{width:auto;grid-column-end:span 12}}}@media (min-width:480px) and (max-width:839px){.mdc-layout-grid__cell{width:calc(50% - 16px);width:calc(50% - var(--mdc-layout-grid-gutter-tablet,16px));box-sizing:border-box;margin:8px;margin:calc(var(--mdc-layout-grid-gutter-tablet,16px) / 2)}@supports (display:grid){.mdc-layout-grid__cell{width:auto;grid-column-end:span 4}}@supports (display:grid){.mdc-layout-grid__cell{margin:0}}.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-tablet{width:calc(12.5% - 16px);width:calc(12.5% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-tablet{width:auto;grid-column-end:span 1}}.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-tablet{width:calc(25% - 16px);width:calc(25% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-tablet{width:auto;grid-column-end:span 2}}.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-tablet{width:calc(37.5% - 16px);width:calc(37.5% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-tablet{width:auto;grid-column-end:span 3}}.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-tablet{width:calc(50% - 16px);width:calc(50% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-tablet{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-tablet{width:calc(62.5% - 16px);width:calc(62.5% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-tablet{width:auto;grid-column-end:span 5}}.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-tablet{width:calc(75% - 16px);width:calc(75% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-tablet{width:auto;grid-column-end:span 6}}.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-tablet{width:calc(87.5% - 16px);width:calc(87.5% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-tablet{width:auto;grid-column-end:span 7}}.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-tablet{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-tablet{width:auto;grid-column-end:span 8}}.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-tablet{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-tablet{width:auto;grid-column-end:span 8}}.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-tablet{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-tablet{width:auto;grid-column-end:span 8}}.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-tablet{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-tablet{width:auto;grid-column-end:span 8}}.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-tablet{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-tablet,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-tablet{width:auto;grid-column-end:span 8}}}@media (max-width:479px){.mdc-layout-grid__cell{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px));box-sizing:border-box;margin:8px;margin:calc(var(--mdc-layout-grid-gutter-phone,16px) / 2)}@supports (display:grid){.mdc-layout-grid__cell{width:auto;grid-column-end:span 4}}@supports (display:grid){.mdc-layout-grid__cell{margin:0}}.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-phone{width:calc(25% - 16px);width:calc(25% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-1,.mdc-layout-grid__cell--span-1-phone{width:auto;grid-column-end:span 1}}.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-phone{width:calc(50% - 16px);width:calc(50% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-2,.mdc-layout-grid__cell--span-2-phone{width:auto;grid-column-end:span 2}}.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-phone{width:calc(75% - 16px);width:calc(75% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-3,.mdc-layout-grid__cell--span-3-phone{width:auto;grid-column-end:span 3}}.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-4,.mdc-layout-grid__cell--span-4-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-5,.mdc-layout-grid__cell--span-5-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-6,.mdc-layout-grid__cell--span-6-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-7,.mdc-layout-grid__cell--span-7-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-8,.mdc-layout-grid__cell--span-8-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-9,.mdc-layout-grid__cell--span-9-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-10,.mdc-layout-grid__cell--span-10-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-11,.mdc-layout-grid__cell--span-11-phone{width:auto;grid-column-end:span 4}}.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-phone{width:calc(100% - 16px);width:calc(100% - var(--mdc-layout-grid-gutter-phone,16px))}@supports (display:grid){.mdc-layout-grid__cell--span-12,.mdc-layout-grid__cell--span-12-phone{width:auto;grid-column-end:span 4}}}.mdc-layout-grid__cell--align-top{align-self:flex-start}@supports (display:grid){.mdc-layout-grid__cell--align-top{align-self:start}}.mdc-layout-grid__cell--align-middle{align-self:center}.mdc-layout-grid__cell--align-bottom{align-self:flex-end}@supports (display:grid){.mdc-layout-grid__cell--align-bottom{align-self:end}}`;
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent = instance.define({
		name: 'scroll-btn',
		cssjs: {}
	});

	class ScrollTo extends HTMLElement {

		constructor() {
			super();
		}

		easing(t, b, c, d) {
			// easeInOutQuad
			t /= d / 2;
			if (t < 1) {
				return c / 2 * t * t + b;
			}
			t--;
			return -c / 2 * (t * (t - 2) - 1) + b;
		}

		showHide() {
			window.addEventListener('scroll', () => {
				if (window.pageYOffset >= document.body.offsetHeight) {
					this.classList.add('visible');
				} else {
					this.classList.remove('visible');
				}
			});
		}

		connectedCallback() {
			this.showHide();
			bmpCssComponent.attachStyles(this);
			const options = {
				to: parseInt(this.getAttribute('to'), 10),
				duration: parseInt(this.getAttribute('duration'), 10)
			};

			this.addEventListener('click', ev => {

				ev.preventDefault();
				this.animateScroll(isNaN(options.to) ? 0 : options.to, isNaN(options.duration) ? 500 : options.duration);
			});
		}

		moveElement(amount) {
			document.documentElement.scrollTop = amount;
			document.body.parentNode.scrollTop = amount;
			document.body.scrollTop = amount;
		}

		currentPosition() {
			return document.documentElement.scrollTop || document.body.parentNode.scrollTop || document.body.scrollTop;
		}

		animateScroll(to, duration, currentTime = 0) {

			let start = this.currentPosition();
			let change = to - start;
			let increment = 20;

			// increment the time
			currentTime += increment;
			// find the value with the quadratic in-out easing function
			const val = this.easing(currentTime, start, change, duration);
			// move the document.body
			this.moveElement(val);
			// do the animation unless its over
			if (currentTime < duration) {
				window.requestAnimationFrame(() => this.animateScroll(to, duration, currentTime));
			} else {
				// done
			}
		}

	}

	customElements.define('scroll-btn', ScrollTo);

	let bmpCssComponent$1 = instance.define({
		name: 'jetsm-float-input',
		cssjs: {
			display: 'block',
			position: 'relative',
			label: {
				'top': '7px',
				'left': '0',
				'position': 'absolute',
				'transition-duration': '.25s',
				'text-transform': 'capitalize',
				'color': '#fff',
				'font-weight': '200',
				'text-align': 'left',
				'width': '100%',
				'transition-duration': '.25s'
			},
			'&.focused label': {
				// transform: 'translate3d(0, -130%, 0)',
				'font-size': '20px',
				'-webkit-transform': 'translate3d(-10%, -130%, 0) scale(.8)',
				'transform': 'translate3d(-10%, -130%, 0) scale(.8)'
			}
		}
	});

	class FloatInput extends HTMLElement {

		connectedCallback() {
			bmpCssComponent$1.attachStyles(this);
			const input = this.querySelector('input');

			input.addEventListener('focus', () => {
				this.classList.add('focused');
			});

			input.addEventListener('blur', () => {
				if (input.value == '') {
					this.classList.remove('focused');
				}
			});

			if (input.value > '') this.classList.add('focused');
		}

	}

	customElements.define('float-input', FloatInput);

	const FONT = {
		primary: 'Gotham, sans-serif',
		secondary: 'Roboto, sans-serif'
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const tag = document.createElement('style');

	const typography = `
		.h1-style {
			font-family: Gotham, sans-serif;
			font-weight: 500;
			font-size: 64px;
			line-height: 40px;
			letter-spacing: -3px;
		}
		.h2-style {
			font-family: Gotham, sans-serif;
			font-weight: 400;
			font-size: 48px;
			line-height: 40px;
			letter-spacing: -2px
		}
		.h3-style {
			font-family: Gotham, sans-serif;
			font-weight: 400;
			font-size: 36px;
			line-height: 40px;
			letter-spacing: -2px
		}
		.h4-style {
			font-family: Roboto, sans-serif;
			font-weight: 300;
			font-size: 24px;
			line-height: 30px;
		}
		.h5-style {
			font-family: Roboto, sans-serif;
			font-weight: 300;
			font-size: 20px;
			line-height: 30px;
		}
		.h6-style {
			font-family: Roboto, sans-serif;
			font-size: 18px;
			line-height: 30px;
		}
		.p-style {
			font-family: Roboto, sans-serif;
			font-weight: 300;
			font-size: 20px;
			line-height: 30px;
		}
		.p-small-style {
			font-family: Roboto, sans-serif;
			font-weight: 400;
			font-size: 13px;
			line-height: 21px;
		}
		.button-style {

		}

		.link-button-primary a {
			text-decoration: none;
			display: block;
			max-width: 350px;
			width: 100%;
			text-align: center;
			height: 50px;
			background: ${COLOR.primary};
			color: ${COLOR.white};
			line-height: 50px;
			font-family: "Roboto";
			font-size: 24px;
			letter-spacing: -0.5px;
			border-radius: 6px;
			font-weight: 300;
			cursor: pointer;
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
		}
		.link-button-primary.disabled a {
			background: ${COLOR.light};
		}
		.link-button-primary a:hover {
			box-shadow: ${FX.shadow.hover};
			transition-duration: ${FX.speed.fast};
			transform: scale(${FX.scale.hover});
		}
		.link-button-primary a:active:hover {
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
			transform: scale(1);
		}
		.link-button-primary button:disabled {
			background: ${COLOR.neutral};
			color: ${COLOR.white};
		}
		.link-button-primary button:hover:disabled {
			background: ${COLOR.neutral};
			color: ${COLOR.white};
			box-shadow: ${FX.shadow.default};
			transform: scale(1);
		}

		.link-button-primary button {
			text-decoration: none;
			display: block;
			max-width: 350px;
			width: 100%;
			text-align: center;
			height: 50px;
			background: ${COLOR.primary};
			color: ${COLOR.white};
			line-height: 50px;
			font-family: "Roboto";
			font-size: 24px;
			letter-spacing: -0.5px;
			border: 0;
			border-radius: 6px;
			font-weight: 300;
			cursor: pointer;
			outline: none;
			padding: 0;
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
		}
		.link-button-primary button:hover {
			box-shadow: ${FX.shadow.hover};
			transition-duration: ${FX.speed.fast};
			transform: scale(${FX.scale.hover});
		}
		.link-button-primary button:active:hover {
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
			transform: scale(1);
		}

		.link-button-secondary a {
			text-decoration: none;
			display: block;
			max-width: 350px;
			width: 100%;
			text-align: center;
			height: 50px;
			background: ${COLOR.light};
			color: ${COLOR.primary};
			line-height: 50px;
			font-family: "Roboto";
			font-size: 24px;
			letter-spacing: -0.5px;
			border-radius: 6px;
			font-weight: 300;
			cursor: pointer;
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
		}
		.link-button-secondary a:hover {
			box-shadow: ${FX.shadow.hover};
			transition-duration: ${FX.speed.fast};
			transform: scale(${FX.scale.hover});
		}
		.link-button-secondary a:active:hover {
			box-shadow: ${FX.shadow.default};
			transition-duration: ${FX.speed.fast};
			transform: scale(1);
		}

		@media (max-width: 500px) {
			.h2-style {
				font-size: 36px;
			}
		}

		@keyframes ghost-loading {
			0% { transform: translate3d(-200%, 0, 0) }
			100% { transform: translate3d(200%, 0, 0) }
		}
	`;

	tag.appendChild(document.createTextNode(typography));
	tag.setAttribute('type', 'text/css');
	document.head.appendChild(tag);

	const h1 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h1',
			{ 'class': 'h1-style', style: style },
			children
		);
	};

	const h2 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h2',
			{ 'class': 'h2-style', style: style },
			children
		);
	};

	const h3 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h3',
			{ 'class': 'h3-style', style: style },
			children
		);
	};

	const h4 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h4',
			{ 'class': 'h4-style', style: style },
			children
		);
	};

	const h5 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h5',
			{ 'class': 'h5-style', style: style },
			children
		);
	};

	const h6 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'h6',
			{ 'class': 'h6-style', style: style },
			children
		);
	};

	const text = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'p',
			{ 'class': 'p-style', style: style },
			children
		);
	};

	const textSmall = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'p',
			{ 'class': 'p-small-style', style: style },
			children
		);
	};

	const linkButtonPrimary$1 = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'div',
			{ 'class': 'link-button-primary', style: style },
			children
		);
	};

	const linkButtonSecondary = (style, ...children) => {
		return BMPVD.createBMPVirtulaDOMElement(
			'div',
			{ 'class': 'link-button-secondary', style: style },
			children
		);
	};

	const cssjs = {
		display: 'block',
		'font-family': 'Roboto',
		'font-weight': '200',
		'position': 'relative',
		'margin-bottom': '10px',
		'select': {
			'opacity': '0',
			'position': 'absolute',
			'width': '0.001px',
			'height': '0.001px',
			'@media (max-width: 640px)': {
				'width': '100%',
				'height': '100%',
				'top': '0',
				'left': '0',
				'z-index': '4'
			}
		},
		'.selectbox_wrapper': {
			'margin-bottom': '20px'
		},
		'.selectbox_label': {
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
				'i': {
					'border-color': COLOR.primary
				}
			},
			i: {
				'position': 'absolute',
				'top': '18px',
				'right': '20px',
				'width': '10px',
				'height': '10px',
				'border-top': `2px solid ${COLOR.lightBorder}`,
				'border-left': `2px solid ${COLOR.lightBorder}`,
				transform: 'rotate(-135deg)',
				transition: 'transform .3s, top .3s'
			}
		},
		'.selectbox_options': {
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
				'&:hover': {
					'color': '#fff',
					'background-color': COLOR.primary
				}
			}
		},
		'.selectbox_wrapper.opened': {
			'.selectbox_options': {
				'visibility': 'visible',
				'opacity': '1',
				'top': 'calc(100% + 1px)'
			},
			'.selectbox_label i': {
				'top': '1em',
				transform: 'rotate(45deg)'
			}
		}
	};

	let bmpCssComponent$2 = instance.define({
		name: 'jetsm-selectbox', cssjs
	});

	class JetsmSelectbox extends HTMLElement {

		connectedCallback() {
			bmpCssComponent$2.attachStyles(this);

			this.select = this.querySelector('select');
			this.options = [...this.select.querySelectorAll('option')];
			if (!this.options.length) return;

			this.render();
			this._handleChange();

			// open/close the dropdown
			var wrap = this.select.parentNode.querySelector('.selectbox_wrapper');
			var optionsWrap = wrap.querySelector('.selectbox_options');
			this.label = wrap.querySelector('.selectbox_label');

			this.label.addEventListener('click', () => {
				this.select.focus();
				if (!/(iphone|ipad|ipod|android)/gi.test(navigator.userAgent.toLowerCase())) wrap.classList.toggle('opened');
			});
			document.body.addEventListener('click', event => {
				if (event.target != this.label && event.target.parentNode != this.label) wrap.classList.remove('opened');
			});

			// click on fake option
			var fakeOptions = [...optionsWrap.querySelectorAll('.selectbox_option')];[...fakeOptions].forEach(option => {
				option.addEventListener('click', ev => {
					ev.preventDefault();
					this.select.value = option.getAttribute('data-value');
					this.select.dispatchEvent(new Event('change'));
				});
			});

			this.fakeOptions = fakeOptions;
			const depends = this.getAttribute('depends-of');
			if (depends) this._handleDepends(depends);
		}

		_handleChange() {
			// change label html when select changed
			this.select.addEventListener('change', () => {
				this.label.querySelector('span').innerHTML = this.options[this.select.selectedIndex].innerHTML;
			});
		}

		_handleDepends(selector) {
			const dependSelect = document.querySelector(`${selector} select`);
			dependSelect.addEventListener('change', () => {
				const val = dependSelect.value;
				this.fakeOptions.forEach(el => {
					const elVal = el.getAttribute('data-value');
					if (val && elVal.toLowerCase() != 'other' && elVal.indexOf(val) != 0) el.style.display = 'none';else el.style.display = 'block';
				});

				this.options.forEach(option => {
					if (val && option.value.toLowerCase() != 'other' && !option.value.includes(val)) option.setAttribute('hidden', 'hidden');else option.removeAttribute('hidden');
				});
			}, false);
		}

		render() {

			// create template
			this.select.insertAdjacentHTML('beforeBegin', `
				<div class="selectbox_wrapper">
					<div class="selectbox_label">
						<span>${this.options[0].innerHTML}</span><i></i>
					</div>
					<div class="selectbox_options">
						${this.options.map((option, i) => {
				if (i === 0) return '';
				return `<div class="selectbox_option" data-value="${option.value}">${option.innerHTML}</div>`;
			}).join('')}
					</div>
				</div>
			`);
		}

	}

	customElements.define('jetsm-selectbox', JetsmSelectbox);

	const cssjs$1 = {
		'display': 'block',

		//===================================== DEFAULT SLIDER STYLES start
		'bmp-slider': {
			'opacity': '0',
			'visibility': 'hidden',
			'display': 'block',

			'&.prevent__move': {
				'.swish__slider_inner': {
					'cursor': 'default'
				}
			},

			'&.bmp-slider-ready': {
				'opacity': '1',
				'visibility': 'visible'
			},

			'img': {
				'user-drag': 'none',
				'user-select': 'none',
				'-moz-user-select': 'none',
				'-webkit-user-drag': 'none',
				'-webkit-user-select': 'none',
				'-ms-user-select': 'none'
			},

			'.swish__slider': {
				'position': 'relative',
				'.thumbs__content_inner': {
					'opacity': '0',
					'display': 'none',
					'visibility': 'hidden'
				}
			},

			'.swish__slider_inner': {
				'overflow': 'hidden',
				'position': 'relative'
			},

			'.swish__list': {
				'margin': '0',
				'padding': '0',
				'width': '10000000px',
				'display': 'block',
				'float': 'left'
			},

			'.swish__item, cloned': {
				'list-style-type': 'none',
				'display': 'block',
				'float': 'left'
			},

			'.swish__item_inner': {
				'overflow': 'hidden',
				'margin': 'auto',
				'img': {
					'display': 'block'
				}
			},

			'.swish__nav': {
				'cursor': 'pointer'
			},

			'.swish__nav_inner': {
				'margin': 'auto',
				'position': 'relative',

				'&:before': {
					'content': '""',
					'display': 'table'
				},
				'&:after': {
					'content': '""',
					'display': 'table',
					'clear': 'both'
				}
			},

			'.swish__thumbs': {
				'position': 'relative'
			},

			'.swish__thumbs_inner': {
				'overflow': 'hidden',
				'position': 'relative'
			},

			'.swish__thimbs_list': {
				'margin': '0',
				'padding': '0',
				'width': '10000000px',
				'display': 'block',
				'float': 'left',
				'overflow': 'hidden'
			},

			'.swish__thumb_item': {
				'float': 'left',
				'position': 'relative',
				'cursor': 'pointer'
			},

			'.thumbs__overlay': {
				'display': 'block',
				'position': 'absolute',
				'top': '0',
				'left': '0',
				'width': '100%',
				'height': '100%'
			}
		},
		//===================================== DEFAULT SLIDER STYLES end

		'.swish__ui': {
			'max-width': '100%',
			'margin': 'auto',
			'position': 'relative',

			'.swish__slider_inner': {
				'cursor': '-webkit-grab',
				'cursor': 'grab'
			},

			'&.grab': {
				'.swish__slider_inner': {
					'cursor': '-webkit-grabbing',
					'cursor': 'grabbing'
				}
			},

			'.swish__item': {
				'position': 'relative',
				'overflow': 'hidden',
				'width': '100%',
				'opacity': '1',

				'img': {
					'display': 'block',
					'margin': 'auto',
					'user-drag': 'none',
					'user-select': 'none',
					'-moz-user-select': 'none',
					'-webkit-user-drag': 'none',
					'-webkit-user-select': 'none',
					'-ms-user-select': 'none'
				}
			},

			'.swish__item_inner': {
				'opacity': '1',
				'position': 'relative',
				'height': '100%',
				'background-position': '50% 50%',
				'background-size': 'cover'
			},

			'.swish__prev': {
				'position': 'absolute',
				'display': 'block',
				'width': '50px',
				'height': '50px',
				'top': '10px',
				'left': '10px',
				'height': '300px',
				'padding': '0px',
				'display': 'flex',
				'align-items': 'center',
				'cursor': 'pointer',
				'transition-duration': FX.transSpeedFast,

				'svg': {
					'use': {
						'transition-duration': FX.transSpeedFast
					}
				},

				'&:hover': {
					'transform': 'translate(-5px, 0)',
					'svg': {
						'use': {
							'transition-duration': FX.transSpeedFast,
							'fill': COLOR.primary
						}
					}
				}
			},

			'.swish__next': {
				'position': 'absolute',
				'display': 'block',
				'width': '50px',
				'height': '50px',
				'top': '10px',
				'right': '10px',
				'height': '300px',
				'padding': '0px',
				'display': 'flex',
				'align-items': 'center',
				'transform': 'rotate(180deg)',
				'cursor': 'pointer',
				'transition-duration': FX.transSpeedFast,

				'svg': {
					'use': {
						'transition-duration': FX.transSpeedFast
					}
				},

				'&:hover': {
					'transform': 'translate(5px, 0) rotate(180deg)',
					'svg': {
						'use': {
							'transition-duration': FX.transSpeedFast,
							'fill': COLOR.primary
						}
					}
				}

				// '.swish__item[lazy-src]': {
				// 	'.swish__item_inner': {
				// 		opacity: 0
				// 	}
				// }
			} }

	};

	let bmpCssComponent$3 = instance.define({
		name: 'swish-slider', cssjs: cssjs$1
	});

	// TODO: make bmp-slider.js as external dependency
	require(['https://jetsmarter.com/data/site-v5/scripts/bmp-slider/bmp-slider-1.1.7.js'], () => {});
	// require(['http://localhost:9002/bmp-slider/dist/scripts/bmp-slider.js'], () => { })

	class SwishSlider extends HTMLElement {

		constructor() {
			super();
		}

		connectedCallback() {
			bmpCssComponent$3.attachStyles(this);
		}

	}

	if (!customElements.get('swish-slider')) customElements.define('swish-slider', SwishSlider);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	class METextField extends HTMLElement {
		constructor() {
			super();
		}
		connectedCallback() {
			this.innerHTML = `
				<div class="mdc-text-field">
					<input type="text" id="my-text-field" class="mdc-text-field__input"/>
					<label class="mdc-floating-label" for="my-text-field">${this.getAttribute('label')}</label>
					<div class="mdc-line-ripple"></div>
				</div>
			`;
			this.mdlComponent = new mdc.textField.MDCTextField(this);
		}
		disconnectedCallback() {
			this.mdlComponent.destroy();
		}
	}

	if (!customElements.get('me-text-field')) customElements.define('me-text-field', METextField);

	const TextField = ({ label }) => BMPVD.createBMPVirtulaDOMElement('me-text-field', { label: label });

	const getUrlParams = (...params) => {
		const vals = params.map(paramName => {
			const reg = new RegExp(`${paramName}=(.*?)(?=&|$)`);
			const param = reg.exec(location.search);
			return param && param.length > 1 ? param[1] : false;
		});
		return vals.length === 1 ? vals[0] : vals;
	};

	const getPathSegments = (pathname = location.pathname) => {
		return pathname.split('/').filter(s => s != '');
	};

	const isActive = (link, strict = false, pathname = location.pathname) => {
		if (strict) return link === pathname;else return link != '/' && pathname.indexOf(link) == 0 || link === pathname;
	};

	/**
	 * @param (Object)
	 * @slack
	 * { type: number } { default: 0 } or e.g. 30
	 * @element
	 * { type: css selector } { required } e.g '.block'
	 * @duration
	 * { type: number } { default: 1000 } e.g. 500
	 */
	const smoothScroll = ({ slack = 0, element, duration = 1000 } = {}) => {

		var startingY = window.pageYOffset;
		var elementY = window.pageYOffset + document.querySelector(element).getBoundingClientRect().top;
		var targetY = document.body.scrollHeight - elementY < window.innerHeight ? document.body.scrollHeight - window.innerHeight : elementY;
		var diff = targetY - startingY;
		var easing = function (t) {
			return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
		};
		var start;
		if (!diff) return;

		const step = timestamp => {
			if (!start) start = timestamp;
			var time = timestamp - start;
			var percent = Math.min(time / duration, 1);
			percent = easing(percent);
			window.scrollTo(0, startingY + (diff - slack) * percent);
			if (time < duration) {
				window.requestAnimationFrame(step);
			}
		};
		window.requestAnimationFrame(step);
	};

	var _extends$4 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	/** grid settings */
	const gridMarginAndGutterDefaults = {
		phone: { margin: '10px', gutter: '10px' },
		tablet: { margin: '10px', gutter: '10px' },
		desktop: { margin: '10px', gutter: '10px' }
	};

	const genMarginAndGutter = mod => {
		let updatedMod = _extends$4({}, gridMarginAndGutterDefaults, mod);
		let classNameFirstPart = '--mdc-layout-grid';

		return Object.keys(updatedMod).map(device => {
			return Object.keys(updatedMod[device]).map(property => `${classNameFirstPart}-${property}-${device}:${updatedMod[device][property]}`).join(';');
		}).join(';');
	};
	/** /grid settings */

	const legal = () => {
		return ME.container({
			mod: { style: `color: ${COLOR.light};background: ${COLOR.dark}; font-size: 14px; line-height: 16px; padding: 20px 0` },
			children: [ME.layout.grid({
				children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 10 }, ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'p',
						{ style: 'font-size: 10px; line-height: 13px; color: #CECBC3;' },
						'\xA9 2019 JetSmarter Inc.',
						BMPVD.createBMPVirtulaDOMElement('br', null),
						'JetSmarter does not own or operate any aircraft. All flights are performed by FAA-licensed and DOT-registered air carriers. JetSmarter offers a number of programs including private charters, for which JetSmarter acts solely as your agent in arranging the flight, and Public Charters, for which JetSmarter acts as principal in buying and reselling the air transportation. Seats made available under the Public Charter Program are subject to the Public Charter rules contained in 14 CFR 380. All flights are subject to availability and such other terms and conditions available at ',
						BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/legal/', target: '_blank', style: 'color: #FE6A57' },
								'jetsmarter.com/legal/'
							)
						)
					))]
				}))]
			})]
		});
	};

	const hidenav = getUrlParams('hidenav');
	/** mdcCardModDefault */
	const mdcCardModDefault = {
		img: 'http://placehold.it/250x250',
		style: `background: #FFF`
		/** /mdcCardModDefault */

	};const ME = {
		button: (obj = { label: 'label', onclick, style: { elevation: 0 } }) => {
			return BMPVD.createBMPVirtulaDOMElement(
				'button',
				{ className: `mdc-button mdc-elevation--z${obj.style.elevation}`, onClick: e => {
						obj.onclick(e);
					} },
				obj.label
			);
		},
		indent: (mod, ...children) => {
			/** Indentions of block
		 * @param { Object } mod { common | phone | tablet | desktop : { top, left, right: 'p10', bottom: 'm20' } )
		 * @param { Array } children
		 * @example <script>ME.indent({ mod: { phone: { top: 'm10', bottom: 'm20' } }, <h1>Headline</h1>, <p>text</p> );</script>
		 */
			let className = Object.keys(mod).map(media => {
				return Object.keys(mod[media]).map(side => {
					return `mdc-indent mdc-indent-${media}-${side}`;
				});
			});
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: className },
				children
			);
		},
		scafold: ({ appBar, body, footer, sidebar, contentBackground }) => {
			// TODO proper errors
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				appBar,
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'main-divider', style: contentBackground ? `background-image: url( ${contentBackground} )` : '' },
					sidebar ? ME.container({
						mod: { className: 'stretch' },
						children: [ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 4 }, sidebar), ME.layout.cell({ common: 8 }, body)]
						})]
					}) : body
				),
				hidenav === false ? footer : legal(),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ onclick: ev => smoothScroll({ element: '.jet-search-wrapper' }), 'class': 'scroll-to-top', to: '0' },
					BMPVD.createBMPVirtulaDOMElement('span', null)
				)
			);
		},
		layout: {
			/** Twelve column grid layout
		 * @param { Object } mod { phone | tablet | desktop : { margin, gutter } )
		 * @param { Array } children
		 * @example ME.layout.grid({ mod: { phone: { gutter: '10px', margin: '10px' } }, children: [ <h1>Headline</h1>, <p>text</p> ]})
		 */
			grid: ({ mod = gridMarginAndGutterDefaults, children = null }) => BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'mdc-layout-grid', style: genMarginAndGutter(mod) },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'mdc-layout-grid__inner' },
					children
				)
			),

			inner: (...children) => BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'mdc-layout-grid__inner' },
				children
			),

			/** Twelve column grid cell
		 * @param { Object } mod { desktop | tablet | phone | common: <Num { max 12 }>, align: <String { top | middle | bottom }> }
		 * @example ME.layout.cell({ desktop: 4, tablet: 6, phone: 12, align: 'top' },<h1>Headline</h1>,<p>text</p>)
		 */
			cell: (mod, ...children) => {
				let common = mod && typeof mod.common != 'undefined' ? mod.common === 0 ? 'hide' : `mdc-layout-grid__cell--span-${mod.common}` : 'mdc-layout-grid__cell';
				let desktop = mod && typeof mod.desktop != 'undefined' ? mod.desktop === 0 ? 'hide-desktop' : `mdc-layout-grid__cell--span-${mod.desktop}-desktop` : null;
				let tablet = mod && typeof mod.tablet != 'undefined' ? mod.tablet === 0 ? 'hide-tablet' : `mdc-layout-grid__cell--span-${mod.tablet}-tablet` : null;
				let phone = mod && typeof mod.phone != 'undefined' ? mod.phone === 0 ? 'hide-phone' : `mdc-layout-grid__cell--span-${mod.phone}-phone` : null;
				let align = mod && typeof mod.align != 'undefined' ? `mdc-layout-grid__cell--align-${mod.align}` : null;
				let className = [common, desktop, tablet, phone, align].join(' ');

				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': className },
					children
				);
			}
		},

		appBar: ({ menuLabel, title }) => {
			return BMPVD.createBMPVirtulaDOMElement(
				'header',
				{ 'class': 'mdc-top-app-bar' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'mdc-top-app-bar__row' },
					BMPVD.createBMPVirtulaDOMElement(
						'section',
						{ 'class': 'mdc-top-app-bar__section mdc-top-app-bar__section--align-start' },
						BMPVD.createBMPVirtulaDOMElement(
							'a',
							{ href: '#', 'class': 'material-icons mdc-top-app-bar__navigation-icon' },
							menuLabel
						),
						BMPVD.createBMPVirtulaDOMElement(
							'span',
							{ 'class': 'mdc-top-app-bar__title' },
							title
						)
					),
					BMPVD.createBMPVirtulaDOMElement('section', { 'class': 'mdc-top-app-bar__section mdc-top-app-bar__section--align-end', role: 'toolbar' })
				)
			);
		},
		/**
		* @param { Object } mod { style, className }
		* @param { Array } children
		*/
		container: ({ mod, children }) => BMPVD.createBMPVirtulaDOMElement(
			'div',
			mod,
			children
		),

		/**
		* @param { Object } mod { img<URL>, style<String> }
		* @param { Object } children
		*/
		card: ({ mod = mdcCardModDefault, children = null }) => {
			let newMod = _extends$4({}, mdcCardModDefault, mod);
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'mdc-card', style: newMod.style },
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'mdc-card__media mdc-card__media--16-9 demo-card__media',
					style: `background-image: url('${newMod.img}')` }),
				children
			);
		},

		form: {
			textField: ({ label }) => {
				return TextField({ label });
			},
			checkbox: ({ checkmark, label }) => {
				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'mdc-form-field' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'mdc-checkbox' },
						BMPVD.createBMPVirtulaDOMElement('input', { type: 'checkbox', id: 'my-checkbox', 'class': 'mdc-checkbox__native-control' }),
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ 'class': 'mdc-checkbox__background' },
							checkmark
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'label',
						{ 'for': 'my-checkbox' },
						label
					)
				);
			}
		}
	};

	const svgIcon = {
		preloader({ inline = true } = {}) {
			return `
				<div class="preloader ${inline ? "inline" : ""}">
					<svg class="spinner__outer" width="66px" height="66px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
						<circle class="spinner__path" fill="none" stroke-width="2" cx="33" cy="33" r="30"></circle>
					</svg>
					<svg class="spinner__inner" width="66px" height="66px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
						<circle class="spinner__path" fill="none" stroke-width="4" cx="33" cy="33" r="26"></circle>
					</svg>
				</div>`;
		},

		pin() {
			return `
				<svg width="16px" height="22px" viewBox="0 0 16 22" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g transform="translate(-4.000000, -1.000000)" stroke="#837E74" stroke-width="1" fill="none" fill-rule="evenodd">
							<path d="M12,2.4 C8.024,2.4 4.8,5.6232 4.8,9.6 C4.8,15.7096 12,21.6 12,21.6 C12,21.6 19.2,15.7096 19.2,9.6 C19.2,5.6232 15.9768,2.4 12,2.4 L12,2.4 Z M12,12.8727273 C10.1925517,12.8727273 8.72727273,11.4074483 8.72727273,9.6 C8.72727273,7.79255172 10.1925517,6.32727273 12,6.32727273 C13.8074483,6.32727273 15.2727273,7.79255172 15.2727273,9.6 C15.2727273,11.4074483 13.8074483,12.8727273 12,12.8727273 L12,12.8727273 Z"></path>
						</g>
				</svg>
				`;
		},

		clickMe() {
			return `
			<svg width="16px" height="32px" viewBox="0 0 16 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<g stroke="none" stroke-width="1" fill="none" fill-rule="nonzero">
					<rect stroke="#EEECE7" x="0.5" y="0.5" width="15" height="31" rx="7.5"></rect>
					<circle fill="#EEECE7" cx="8" cy="9" r="3"></circle>
				</g>
			</svg>`;
		},

		searchHeader() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="21" height="22" viewBox="0 0 21 22">
				<path fill="none" stroke="#44423e" d="M10.07.5A9.5,9.5,0,1,1,.5,10,9.54,9.54,0,0,1,10.07.5Zm6.69,16.3,3.81,3.78"/>
			</svg>

			`;
		},

		location({ color = '#A7A299' } = {}) {
			return `<svg width="12px" height="16px" viewBox="0 0 12 16" version="1.1" xmlns="http://www.w3.org/2000/svg">
				<g troke="none" stroke-width="1" transform="translate(-4.000000, -2.000000)" fill=${color} fill-rule="evenodd">
					<path d="M10,2 C6.68666667,2 4,4.686 4,8 C4,13.0913333 10,18 10,18 C10,18 16,13.0913333 16,8 C16,4.686 13.314,2 10,2 L10,2 Z M10,10.7272727 C8.4937931,10.7272727 7.27272727,9.5062069 7.27272727,8 C7.27272727,6.4937931 8.4937931,5.27272727 10,5.27272727 C11.5062069,5.27272727 12.7272727,6.4937931 12.7272727,8 C12.7272727,9.5062069 11.5062069,10.7272727 10,10.7272727 L10,10.7272727 Z" ></path>
				</g>
			</svg>`;
		},
		small_plane() {
			return `<svg width="18px" height="18px" viewBox="0 0 18 18">
					<g stroke="none" stroke-width="1" fill="none" transform="translate(-1.000000, -1.000000)" fill="#5E94D9" fill-rule="evenodd">
						<path d="M11.4742857,8.6779 L5.15714286,1 L3.68285714,1 L7.50742857,8.6815 L4.67028571,8.6815 L2.26342857,6.0337 L1,6.0337 L3.08714286,10 L1,13.9672 L2.26342857,13.9672 L4.67028571,11.3194 L7.50828571,11.3194 L3.68285714,19 L5.15714286,19 L11.4734286,11.323 C11.8617143,11.323 15.7642857,11.3194 15.7642857,11.3194 C17.506,11.3194 19,10.7254 19,10 C19,9.2746 17.5471429,8.6815 15.7642857,8.6815 C15.7642857,8.6815 11.8617143,8.6779 11.4742857,8.6779 Z" fill="#5E94D9"></path>
					</g>
			</svg>`;
		},

		searchorigin() {
			return `
				<svg width="22px" height="14px" viewBox="0 0 22 14" version="1.1" xmlns="http://www.w3.org/2000/svg">
				<g stroke="none" transform="translate(-1.000000, -4.000000)"  stroke-width="1" fill="#A7A299" fill-rule="nonzero">
						<path d="M1.38909412,3.50211853 L4.4660172,8.50211853 C5.74806848,9.1687852 7.38909412,9.50211853 9.38909412,9.50211853 C12.3890941,9.50211853 16.3890941,9.50211853 20.3890941,9.50211853 C24.3890941,9.50211853 20.3890941,6.50211853 16.3890941,6.50211853 C13.7224275,6.50211853 10.7224275,6.50211853 7.38909412,6.50211853 L3.38909412,3.50211853 L1.38909412,3.50211853 Z" transform="translate(11.717521, 6.502119) rotate(-21.000000) translate(-11.717521, -6.502119) "></path>
						<rect x="3" y="17" width="18" height="1"></rect>
				</g>
				</svg>
			`;
		},

		searchdestination() {
			return `
				<svg width="21px" height="12px" viewBox="0 0 21 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<g transform="translate(-1.000000, -6.000000)" stroke="none" stroke-width="1" fill="#A7A299" fill-rule="nonzero">
					<rect x="3" y="17" width="18" height="1"></rect>
					<g transform="translate(1.000000, 5.537077)">
							<path d="M0.389094124,0.50211853 L3.4660172,5.50211853 C4.74806848,6.1687852 6.38909412,6.50211853 8.38909412,6.50211853 C11.3890941,6.50211853 15.3890941,6.50211853 19.3890941,6.50211853 C23.3890941,6.50211853 19.3890941,3.50211853 15.3890941,3.50211853 C12.7224275,3.50211853 9.72242746,3.50211853 6.38909412,3.50211853 L2.38909412,0.50211853 L0.389094124,0.50211853 Z"></path>
							<circle cx="9" cy="8" r="1"></circle>
							<circle cx="11" cy="8" r="1"></circle>
							<circle cx="18" cy="8" r="1"></circle>
					</g>
				</g>
				</svg>
			`;
		},

		// searchClose() {
		// 	return `
		// 		<svg width="12px" height="10px" viewBox="0 0 12 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
		// 			<g transform="translate(-1.000000, -2.000000)" stroke="#44423E" stroke-width="1" fill="none" fill-rule="nonzero" stroke-linecap="round">
		// 				<path d="M2,2 L12,12" id="Path-7"></path>
		// 				<path d="M12,2 L2,12" id="Path-6"></path>
		// 			</g>
		// 		</svg>
		// 	`
		// },
		// searchClose() {
		// 	return `
		// 		<svg width="12px" height="10px" viewBox="0 0 12 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
		// 			<g transform="translate(-1.000000, -2.000000)" stroke="#44423E" stroke-width="1" fill="none" fill-rule="nonzero" stroke-linecap="round">
		// 				<path d="M2,2 L12,12" id="Path-7"></path>
		// 				<path d="M12,2 L2,12" id="Path-6"></path>
		// 			</g>
		// 		</svg>
		// 	`
		// },

		close({ color = '#44423E' } = {}) {
			return `
			<svg width="29" height="29" xmlns="http://www.w3.org/2000/svg">
				<path d="M.571.571L28.43 28.43M28.429.571L.57 28.43" stroke="${color}" fill="none" stroke-linecap="round"></path>
			</svg>`;
		},

		closeSmall() {
			return `
			<svg width="18px" height="18px" viewBox="0 0 18 18" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<rect id="Rectangle-5-Copy-3" fill="#eae8e4" transform="translate(9.088835, 10.000000) rotate(-45.000000) translate(-9.088835, -10.000000) " x="-3.16116524" y="9.5" width="24.5" height="1" rx="0.5"></rect>
				<rect id="Rectangle-5-Copy-3" fill="#eae8e4" transform="translate(9.088835, 10.000000) rotate(-315.000000) translate(-9.088835, -10.000000) " x="-3.16116524" y="9.5" width="24.5" height="1" rx="0.5"></rect>
			</svg>`;
		},

		searchClose() {
			return `
			<svg width="14px" class="search-close-btn" height="14px" viewBox="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round">
					<path d="M2,2 L12,12" id="Path-7" stroke="#44423E" fill-rule="nonzero"></path>
					<path d="M12,2 L2,12" id="Path-6" stroke="#44423E" fill-rule="nonzero"></path>
				</g>
			</svg>
			`;
		},
		swipeSearch() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="31" height="17" viewBox="0 0 31 17">
				<path fill="none" stroke="#837e74" stroke-linecap="round" d="M25,14H7Q1,14,1,8m21,3,3,3-3,3M7,4H25q6,0,6,6M10,1,7,4l3,3" transform="translate(-0.5 -0.48)"/>
			</svg>`;
		},

		googlePlay() {
			return `
			<svg width="126px" height="39px" viewBox="0 0 126 39" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
					<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
							<g transform="translate(-889.000000, -231.000000)" fill="#AAA59C" fill-rule="nonzero">
									<g transform="translate(725.000000, 231.000000)">
											<g id="g-play-light" transform="translate(164.000000, 0.000000)">
													<path d="M119.845923,0 L5.66201378,0 C2.53041932,0.00965560762 -0.00243330479,2.54606152 1.7543092e-06,5.66995515 L1.7543092e-06,32.8813616 C0.0012128914,36.0122907 2.54529815,38.5501086 5.68395956,38.5513167 L119.867869,38.5513167 C123.00653,38.5501086 125.550615,36.0122907 125.551827,32.8813616 L125.551827,5.66995515 C125.532558,2.53798399 122.98568,0.00715213847 119.845923,0 Z M124.432592,32.8813616 C124.420581,35.4032889 122.374079,37.4447499 119.845923,37.4567308 L5.66201378,37.4567308 C3.13385823,37.4447499 1.08735557,35.4032889 1.07534512,32.8813616 L1.07534512,5.66995515 C1.08735557,3.14802781 3.13385823,1.10656679 5.66201378,1.09458594 L119.845923,1.09458594 C122.374079,1.10656679 124.420581,3.14802781 124.432592,5.66995515 L124.432592,32.8813616 Z M44.0890799,21.0817251 L38.1637185,21.0817251 L38.1637185,22.8330626 L42.355363,22.8330626 C42.157851,25.2849351 40.0949474,26.3357376 38.1637185,26.3357376 C35.5639096,26.3296924 33.4612608,24.2224223 33.467321,21.6290181 C33.4733812,19.035614 35.5858554,16.9381451 38.1856643,16.9441903 C39.3648333,16.9396778 40.4990121,17.3953745 41.345857,18.21391 L42.5748209,16.9441903 C41.3813743,15.7942257 39.7788782,15.1642559 38.1198269,15.1928528 C34.4329354,15.2147445 31.6019293,18.3014769 31.6019293,21.6290181 C31.6193029,23.3592472 32.3250384,25.0117159 33.5638631,26.2228554 C34.8026877,27.4339948 36.4731097,28.1045812 38.20761,28.0870751 C41.6750438,28.0870751 44.1988088,25.7227695 44.1988088,22.2200945 C44.2066856,21.8376744 44.169861,21.4556414 44.0890799,21.0817251 Z M49.13661,19.8120055 C46.8366446,19.8240809 44.980823,21.6916327 44.9888826,23.9859497 C44.9969422,26.2802668 46.8658388,28.1347986 49.1658326,28.1307946 C51.4658263,28.1267907 53.3282227,26.2657631 53.3282546,23.971432 C53.284363,21.2130755 51.1336763,19.8120055 49.13661,19.8120055 Z M49.13661,26.467088 C47.819863,26.467088 46.7664654,25.4162855 46.7664654,23.9495403 C46.7664654,22.4827951 47.7979172,21.4319926 49.13661,21.4319926 C50.3436281,21.4319926 51.462863,22.3952283 51.462863,23.9495403 C51.462863,25.5038523 50.3436281,26.467088 49.13661,26.467088 Z M58.3099473,19.8120055 C56.0099819,19.8240809 54.1541604,21.6916327 54.1622199,23.9859497 C54.1702795,26.2802668 56.0391761,28.1347986 58.3391699,28.1307946 C60.6391636,28.1267907 62.50156,26.2657631 62.5015919,23.971432 C62.4796461,21.2130755 60.3070136,19.8120055 58.3099473,19.8120055 Z M58.3318931,26.467088 C57.0151461,26.467088 55.9617485,25.4162855 55.9617485,23.9495403 C55.9617485,22.4827951 56.9932003,21.4319926 58.3318931,21.4319926 C59.5389112,21.4319926 60.6581461,22.3952283 60.6581461,23.9495403 C60.6581461,25.5038523 59.5389112,26.467088 58.3318931,26.467088 Z M69.5461882,20.7533494 C68.9703878,20.1331528 68.1548393,19.7901902 67.3077184,19.8120055 C65.0692485,19.8120055 63.3135859,21.7603684 63.3135859,23.9495403 C63.3135859,26.4451962 65.3545437,28.1089669 67.2638268,28.1089669 C68.4488991,28.1089669 69.0853268,27.6492408 69.5461882,27.1019478 L69.5461882,27.9119414 C69.5461882,29.3349031 68.6683569,30.1886801 67.3516099,30.1886801 C66.4080687,30.1801481 65.5648892,29.5991805 65.222869,28.721935 L63.6208268,29.3786866 C64.1914172,30.5827311 65.3325979,31.8305591 67.3516099,31.8305591 C69.568134,31.8305591 71.2579593,30.4294891 71.2579593,27.5178905 L71.2579593,20.0747061 L69.5242425,20.0747061 L69.5242425,20.7533494 L69.5461882,20.7533494 Z M67.4393931,26.467088 C66.2543208,26.467088 65.1350858,25.5038523 65.1350858,23.971432 C65.1350858,22.3733366 66.2762666,21.4319926 67.4613388,21.4319926 C68.558628,21.4319926 69.6778629,22.3733366 69.6778629,23.9495403 C69.6778629,25.5695275 68.558628,26.467088 67.4393931,26.467088 Z M82.8453328,22.2200945 C82.2966882,20.9065914 81.0457786,19.7901137 79.3998448,19.7901137 C77.2930497,19.7901137 75.5154412,21.4538844 75.5154412,23.9276486 C75.5154412,26.5327631 77.4905617,28.0870751 79.5973569,28.0870751 C81.3530195,28.0870751 82.4283629,27.1238395 83.0867364,26.2700625 L81.6602605,25.3068269 C81.2334595,26.0235649 80.4549181,26.4578059 79.6193027,26.4451962 C78.748036,26.4814672 77.941376,25.9882807 77.5783448,25.1973683 L83.1525737,22.8987378 L82.8453328,22.2200945 Z M77.2711039,23.8400817 C77.1174834,22.6360372 78.2586641,21.4101009 79.4437364,21.4101009 C80.0826475,21.380373 80.6812459,21.7215866 80.9799412,22.2857697 L77.2711039,23.8400817 Z M72.6844352,15.6306872 L74.5059352,15.6306872 L74.5059352,27.8462662 L72.6844352,27.8462662 L72.6844352,15.6306872 Z M97.1978749,15.6306872 L99.0193749,15.6306872 L99.0193749,27.8462662 L97.1978749,27.8462662 L97.1978749,15.6306872 Z M91.9308869,15.6306872 L87.4978388,15.6306872 L87.4978388,27.868158 L89.3193388,27.868158 L89.3193388,23.4241391 L91.9089412,23.4241391 C94.0663583,23.4301842 95.8202032,21.6904613 95.8262634,19.538359 C95.8323235,17.3862567 94.0883041,15.6367325 91.9308869,15.6306872 Z M91.9308869,21.5852347 L89.3412845,21.5852347 L89.3412845,17.4695916 L91.9308869,17.4695916 C93.0701971,17.4695916 93.9937906,18.3909097 93.9937906,19.5274131 C93.9937906,20.6639166 93.0701971,21.5852347 91.9308869,21.5852347 Z M113.437754,25.2411517 L111.045664,19.7901137 L109.048598,19.7901137 L112.450194,27.5178905 L110.540911,31.8305591 L112.537977,31.8305591 L117.848857,19.7901137 L115.85179,19.7901137 L113.437754,25.2411517 Z M100.7092,21.1255086 L102.179568,22.1106359 C103.254911,20.2498398 106.283429,20.6876742 106.480941,22.6798206 C105.570405,22.4104256 104.620185,22.2993461 103.671881,22.3514448 C102.267351,22.4827951 101.060333,23.3803556 100.862821,24.8471008 C100.753092,25.6352026 100.928658,26.62033 101.477303,27.2114064 C102.333188,28.1308586 103.759664,28.2622089 104.922791,27.9338331 C105.550422,27.7529407 106.103912,27.3771882 106.502887,26.8611389 L106.502887,27.8462662 L108.324387,27.8462662 L108.324387,23.4460308 C108.631628,18.9363367 102.881833,17.8636425 100.7092,21.1255086 Z M104.505821,26.3357376 C102.399025,26.9049223 101.872327,23.4898142 105.010574,23.9495403 C105.527728,24.0165129 106.03568,24.1413522 106.524833,24.3216995 C106.276468,25.313548 105.500119,26.0879852 104.505821,26.3357376 Z M21.7482728,18.6955278 L10.292574,12.4782797 C10.1682239,12.4150396 10.0350678,12.3707636 9.89754991,12.3469294 L19.0269957,21.4319926 L21.7482728,18.6955278 Z M9.23917642,12.456388 C8.97582702,12.60963 8.77831497,12.9380058 8.77831497,13.463407 C8.77831497,14.5798847 8.86609811,29.3130114 8.86609811,30.2543553 C8.86609811,30.7359731 9.01971859,31.1081323 9.28306798,31.2832661 L18.6319716,21.8479353 L9.23917642,12.456388 Z M26.1374294,21.1036169 L22.2530258,18.9801202 L19.4220198,21.8260436 L22.2530258,24.6500753 L26.1374294,22.5265786 C26.5982908,22.263878 27.1030438,21.6290181 26.1374294,21.1036169 Z M10.0511704,31.3051578 C10.1355169,31.2778647 10.2164992,31.2411453 10.292574,31.1956992 L21.726327,24.9346676 L19.0050499,22.2419862 L10.0511704,31.3051578 Z M46.9200859,11.0991014 C47.2671979,10.9898309 47.5883052,10.8110498 47.8637546,10.5737002 C48.1483288,10.340132 48.3801734,10.0491751 48.5440739,9.71992312 C48.726322,9.34508256 48.8165888,8.93237925 48.8074233,8.51587859 C48.8165888,8.09937793 48.726322,7.68667462 48.5440739,7.31183406 C48.3805977,6.9760606 48.1489219,6.67786047 47.8637546,6.43616531 C47.5827889,6.20678823 47.2632912,6.02890322 46.9200859,5.91076406 C46.5869661,5.80132872 46.2392899,5.7422956 45.8886341,5.73563031 L44.0012968,5.73563031 L44.0012968,11.2523434 L45.8886341,11.2523434 C46.2395979,11.2784305 46.5919751,11.2260781 46.9200859,11.0991014 Z M44.7693992,10.5737002 L44.7693992,6.45805703 L45.7350136,6.45805703 C46.0795065,6.45329147 46.4218667,6.51268569 46.7445196,6.63319078 C47.0119871,6.72842194 47.252764,6.88604257 47.4467847,7.09291687 C47.6257953,7.28384117 47.7672403,7.5066252 47.8637546,7.74966844 C48.0392913,8.24546879 48.0392913,8.78628839 47.8637546,9.28208875 C47.7672403,9.52513198 47.6257953,9.74791601 47.4467847,9.93884031 C47.252764,10.1457146 47.0119871,10.3033352 46.7445196,10.3985664 C46.4218667,10.5190715 46.0795065,10.5784657 45.7350136,10.5737002 L44.7693992,10.5737002 Z M52.4504232,8.60344547 C52.7986942,8.46051608 53.0752433,8.18464824 53.2185256,7.83723531 C53.2886047,7.65548661 53.3257583,7.46276399 53.3282546,7.26805062 C53.3422583,7.02491699 53.289123,6.78261073 53.1746341,6.56751562 C53.0793725,6.37394669 52.9357779,6.20808886 52.7576642,6.08589781 C52.5670523,5.96837504 52.3599516,5.87983627 52.1431823,5.82319719 C51.8979047,5.76990389 51.6480052,5.74057639 51.3970257,5.73563031 L49.7072004,5.73563031 L49.7072004,11.2523434 L50.4753028,11.2523434 L50.4753028,8.80047093 L51.1995136,8.80047093 L52.6698811,11.2742352 L53.591604,11.2742352 L52.0115076,8.73479578 C52.1645063,8.71753034 52.313163,8.67304321 52.4504232,8.60344547 Z M50.4972485,8.12182765 L50.4972485,6.45805703 L51.3531341,6.45805703 C51.5295318,6.45990364 51.7055618,6.47453666 51.8798329,6.50184047 C52.0204908,6.52592973 52.1548398,6.57804784 52.274857,6.6550825 C52.371505,6.72635588 52.4534691,6.81555098 52.5162606,6.91778312 C52.5811357,7.03863912 52.6115005,7.1749439 52.6040437,7.31183406 C52.6192336,7.55633372 52.5019995,7.7902244 52.2968028,7.92480218 C52.0119028,8.09185405 51.6826925,8.16822596 51.3531341,8.14371937 L50.4972485,8.14371937 L50.4972485,8.12182765 Z M54.798622,10.5955919 C55.0642623,10.8561929 55.3770267,11.0641889 55.7203449,11.20856 C56.0816535,11.3588599 56.4701043,11.4333779 56.8615256,11.4274772 C57.2531193,11.4353673 57.6419775,11.3607711 58.0027064,11.20856 C58.6991101,10.9224947 59.2521393,10.3708279 59.5389112,9.67613968 C59.6915198,9.3086295 59.7662391,8.91359318 59.758369,8.51587859 C59.7662391,8.118164 59.6915198,7.72312768 59.5389112,7.3556175 C59.2521393,6.66092932 58.6991101,6.10926253 58.0027064,5.82319719 C57.6413978,5.67289728 57.252947,5.59837924 56.8615256,5.60428 C56.469932,5.59638987 56.0810738,5.67098608 55.7203449,5.82319719 C55.0239411,6.10926253 54.4709119,6.66092932 54.1841401,7.3556175 C54.0315314,7.72312768 53.9568122,8.118164 53.9646823,8.51587859 C53.9568122,8.91359318 54.0315314,9.3086295 54.1841401,9.67613968 C54.3288678,10.0186121 54.5373774,10.330606 54.798622,10.5955919 Z M54.9083509,7.68399328 C54.999042,7.42504475 55.140822,7.18684563 55.3253208,6.98345828 C55.5116464,6.78213164 55.735198,6.61859764 55.9836943,6.50184047 C56.5455064,6.2683288 57.1775449,6.2683288 57.739357,6.50184047 C57.9923298,6.6109489 58.2173724,6.77557359 58.3977304,6.98345828 C58.5822293,7.18684563 58.7240093,7.42504475 58.8147003,7.68399328 C58.911938,7.95840402 58.9638212,8.24675527 58.9683208,8.53777031 C58.9707423,8.82941243 58.9186457,9.11894967 58.8147003,9.39154734 C58.7240093,9.65049587 58.5822293,9.88869499 58.3977304,10.0920823 C58.2114049,10.293409 57.9878533,10.456943 57.739357,10.5737002 C57.1775449,10.8072118 56.5455064,10.8072118 55.9836943,10.5737002 C55.7307215,10.4645917 55.5056789,10.299967 55.3253208,10.0920823 C55.140822,9.88869499 54.999042,9.65049587 54.9083509,9.39154734 C54.8111132,9.1171366 54.7592301,8.82878535 54.7547305,8.53777031 C54.7483374,8.24580551 54.8005693,7.95551567 54.9083509,7.68399328 Z M60.6800919,5.75752203 L61.4481943,5.75752203 L61.4481943,11.2742352 L60.6800919,11.2742352 L60.6800919,5.75752203 Z M65.5520557,11.0991014 C65.8991677,10.9898309 66.220275,10.8110498 66.4957244,10.5737002 C66.7802986,10.340132 67.0121432,10.0491751 67.1760437,9.71992312 C67.3582918,9.34508256 67.4485586,8.93237925 67.4393931,8.51587859 C67.4485586,8.09937793 67.3582918,7.68667462 67.1760437,7.31183406 C67.0125675,6.9760606 66.7808917,6.67786047 66.4957244,6.43616531 C66.2147587,6.20678823 65.895261,6.02890322 65.5520557,5.91076406 C65.2189359,5.80132872 64.8712597,5.7422956 64.5206039,5.73563031 L62.6332666,5.73563031 L62.6332666,11.2523434 L64.5206039,11.2523434 C64.8714458,11.2753081 65.2231495,11.2230558 65.5520557,11.0991014 Z M63.401369,10.5737002 L63.401369,6.45805703 L64.3669834,6.45805703 C64.7114763,6.45329147 65.0538365,6.51268569 65.3764895,6.63319078 C65.6439569,6.72842194 65.8847338,6.88604257 66.0787545,7.09291687 C66.2577651,7.28384117 66.3992101,7.5066252 66.4957244,7.74966844 C66.6712611,8.24546879 66.6712611,8.78628839 66.4957244,9.28208875 C66.3992101,9.52513198 66.2577651,9.74791601 66.0787545,9.93884031 C65.8847338,10.1457146 65.6439569,10.3033352 65.3764895,10.3985664 C65.0538365,10.5190715 64.7114763,10.5784657 64.3669834,10.5737002 L63.401369,10.5737002 Z M71.8285497,5.75752203 L69.4145135,11.2742352 L70.2484533,11.2742352 L70.8409894,9.87316515 L73.4525376,9.87316515 L74.0450738,11.2742352 L74.8790135,11.2742352 L72.4869232,5.75752203 L71.8285497,5.75752203 Z M71.1262846,9.17263015 L72.1357906,6.74264937 L73.1452967,9.17263015 L71.1262846,9.17263015 Z M76.1518689,8.82236265 L76.9858087,8.82236265 C77.2447055,8.82954874 77.5033154,8.80006614 77.7539111,8.73479578 C77.9753183,8.68062764 78.1840308,8.58396414 78.368393,8.45020343 C78.5402418,8.32711803 78.6765005,8.1609898 78.7634171,7.96858562 C78.9605623,7.53909753 78.9685205,7.04690595 78.7853629,6.61129906 C78.6983576,6.41894971 78.5621161,6.25284254 78.3903388,6.12968125 C78.2059766,5.99592054 77.9972641,5.89925704 77.7758569,5.8450889 C77.5250215,5.78110839 77.2665931,5.75164648 77.0077545,5.75752203 L75.3837665,5.75752203 L75.3837665,11.2742352 L76.1518689,11.2742352 L76.1518689,8.82236265 Z M76.1518689,6.43616531 L76.9638629,6.43616531 C77.2795856,6.41070445 77.5951234,6.48747528 77.86364,6.6550825 C78.0673752,6.79922122 78.1766194,7.04231943 78.1489352,7.28994234 C78.1669186,7.53595668 78.059717,7.77450957 77.86364,7.92480218 C77.5951234,8.09240941 77.2795856,8.16918024 76.9638629,8.14371937 L76.1518689,8.14371937 L76.1518689,6.43616531 Z M82.7794954,6.12968125 C82.5951332,5.99592054 82.3864207,5.89925704 82.1650135,5.8450889 C81.9141781,5.78110839 81.6557497,5.75164648 81.3969111,5.75752203 L79.7729231,5.75752203 L79.7729231,11.2742352 L80.5410255,11.2742352 L80.5410255,8.82236265 L81.3749653,8.82236265 C81.6338621,8.82954874 81.8924721,8.80006614 82.1430677,8.73479578 C82.3644749,8.68062764 82.5731874,8.58396414 82.7575496,8.45020343 C82.9293984,8.32711803 83.0656572,8.1609898 83.1525737,7.96858562 C83.3497189,7.53909753 83.3576771,7.04690595 83.1745195,6.61129906 C83.0732411,6.42817295 82.9393834,6.2649722 82.7794954,6.12968125 Z M82.2527966,7.92480218 C81.98428,8.09240941 81.6687422,8.16918024 81.3530195,8.14371937 L80.5410255,8.14371937 L80.5410255,6.45805703 L81.3530195,6.45805703 C81.6687422,6.43259617 81.98428,6.509367 82.2527966,6.67697422 C82.4565318,6.82111294 82.565776,7.06421115 82.5380918,7.31183406 C82.5509577,7.55074323 82.4440537,7.78043093 82.2527966,7.92480218 Z M89.802146,11.1866683 C90.4985498,10.9006029 91.051579,10.3489361 91.3383508,9.65424797 C91.4909595,9.28673778 91.5656787,8.89170146 91.5578086,8.49398687 C91.5656787,8.09627228 91.4909595,7.70123596 91.3383508,7.33372578 C91.051579,6.6390376 90.4985498,6.08737081 89.802146,5.80130547 C89.4408374,5.65100556 89.0523866,5.57648752 88.6609653,5.58238828 C88.2693717,5.57449816 87.8805134,5.64909436 87.5197846,5.80130547 C86.8233808,6.08737081 86.2703516,6.6390376 85.9835797,7.33372578 C85.8309711,7.70123596 85.7562519,8.09627228 85.7641219,8.49398687 C85.7562519,8.89170146 85.8309711,9.28673778 85.9835797,9.65424797 C86.2703516,10.3489361 86.8233808,10.9006029 87.5197846,11.1866683 C88.2523494,11.4790069 89.0695811,11.4790069 89.802146,11.1866683 Z M87.1028147,10.0701906 C86.9183158,9.86680327 86.7765358,9.62860415 86.6858448,9.36965562 C86.5886071,9.09524488 86.5367239,8.80689363 86.5322243,8.51587859 C86.5298029,8.22423647 86.5818994,7.93469923 86.6858448,7.66210156 C86.7765358,7.40315303 86.9183158,7.16495391 87.1028147,6.96156656 C87.2891402,6.76023993 87.5126919,6.59670592 87.7611882,6.47994875 C88.3230002,6.24643708 88.9550388,6.24643708 89.5168508,6.47994875 C89.7698237,6.58905718 89.9948663,6.75368187 90.1752243,6.96156656 C90.3597232,7.16495391 90.5015032,7.40315303 90.5921942,7.66210156 C90.6894319,7.9365123 90.7413151,8.22486355 90.7458147,8.51587859 C90.7482361,8.80752071 90.6961396,9.09705795 90.5921942,9.36965562 C90.5015032,9.62860415 90.3597232,9.86680327 90.1752243,10.0701906 C89.9888988,10.2715173 89.7653471,10.4350513 89.5168508,10.5518084 C88.9550388,10.7853201 88.3230002,10.7853201 87.7611882,10.5518084 C87.5160878,10.429431 87.2934931,10.2665969 87.1028147,10.0701906 Z M96.276152,10.0482989 L93.3134713,5.75752203 L92.4575857,5.75752203 L92.4575857,11.2742352 L93.2256881,11.2742352 L93.2256881,6.93967484 L96.1883689,11.2742352 L97.0442544,11.2742352 L97.0442544,5.75752203 L96.276152,5.75752203 L96.276152,10.0482989 Z M33.664833,9.89505687 L36.2763811,9.89505687 L36.8689173,11.2961269 L37.7248028,11.2961269 L35.3327125,5.75752203 L34.6523932,5.75752203 L32.2383571,11.2742352 L33.0722968,11.2742352 L33.664833,9.89505687 Z M34.9815799,6.74264937 L35.991086,9.17263015 L33.9720739,9.17263015 L34.9815799,6.74264937 Z M38.9976582,6.93967484 L41.9603389,11.2742352 L42.7942787,11.2742352 L42.7942787,5.75752203 L42.0481221,5.75752203 L42.0481221,10.0482989 L39.0854414,5.75752203 L38.2295558,5.75752203 L38.2295558,11.2742352 L38.9976582,11.2742352 L38.9976582,6.93967484 Z" id="Shape"></path>
											</g>
									</g>
							</g>
					</g>
			</svg>`;
		},
		appStore() {
			return `
				<svg width="126px" height="39px" viewBox="0 0 126 39" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
								<g transform="translate(-725.000000, -231.000000)" fill="#AAA59C" fill-rule="nonzero">
										<g transform="translate(725.000000, 231.000000)">
												<g id="appstore-light">
														<path d="M30.591013,19.1552539 C30.5690663,16.5063559 32.7856871,15.2366362 32.8734741,15.1709611 C31.9740107,13.9120657 30.5378103,13.1431563 28.988901,13.0912478 C27.3648422,12.9161141 25.7846768,14.0544834 24.9507007,14.0544834 C24.1167246,14.0544834 22.8218669,13.1131395 21.4392222,13.1350312 C19.6299271,13.1926932 17.9822225,14.1887985 17.0937676,15.7620375 C15.2063479,18.9801202 16.6109393,23.6868397 18.410572,26.2919542 C19.3103884,27.5616739 20.3638319,28.9846356 21.7464766,28.9408522 C23.0852278,28.875177 23.5900028,28.0870751 25.2140616,28.0870751 C26.8381204,28.0870751 27.2990019,28.9408522 28.7035933,28.8970687 C30.1520782,28.875177 31.0518946,27.6273491 31.9297642,26.3357376 C32.5755394,25.427642 33.0719228,24.4225839 33.4001958,23.3584639 C33.4001958,23.3584639 30.6349065,22.3295531 30.591013,19.1552539 Z M27.9574042,11.3836937 C28.6816466,10.4861333 29.1864216,9.26019703 29.0327945,8.03426078 C27.9793509,8.07804422 26.6844932,8.7566875 25.9163573,9.63235625 C25.2579551,10.3985664 24.6434463,11.6682861 24.7970735,12.8504389 C25.9821975,12.9380058 27.1892682,12.2812542 27.9574042,11.3836937 Z M44.3296726,17.8636425 L40.7743007,28.7657184 L42.5958801,28.7657184 L43.5834835,25.5695275 L47.1827489,25.5695275 L48.2142457,28.7657184 L50.1016654,28.7657184 L46.5243467,17.8636425 L44.3296726,17.8636425 Z M43.9126846,24.2122409 L44.8344477,21.3663175 C45.0758618,20.468757 45.2514357,19.768222 45.3611694,19.3084959 L45.4050629,19.3084959 C45.6684238,20.3811901 45.8659445,21.0817251 45.9537314,21.3663175 L46.8754945,24.2122409 L43.9126846,24.2122409 Z M55.9175517,20.7314576 C54.7104809,20.7314576 53.8326113,21.1911837 53.2400493,22.1325276 L53.1961558,22.1325276 L53.0864221,20.8846997 L51.5282036,20.8846997 C51.572097,21.7603684 51.5940438,22.6360372 51.5940438,23.4679225 L51.5940438,31.9400176 L53.349783,31.9400176 L53.349783,27.8243745 C53.8106646,28.568693 54.5568538,28.9408522 55.6102973,28.9408522 C56.5379053,28.9561996 57.4294896,28.5829906 58.0683322,27.9119414 C58.8145214,27.1457312 59.1656693,26.073037 59.1656693,24.7376422 C59.1656693,23.5335976 58.8584149,22.570362 58.2219594,21.8479353 C57.6819211,21.1236662 56.8221239,20.7070974 55.9175517,20.7314576 Z M56.8612615,26.7954637 C56.5055392,27.2977065 55.919043,27.5860995 55.3030429,27.5616739 C54.7766015,27.5815411 54.2690386,27.3645595 53.9203983,26.9705975 C53.5678002,26.5728503 53.3795665,26.0565054 53.3936765,25.5257441 L53.3936765,24.2122409 C53.3974064,24.0338027 53.4269745,23.8568393 53.4814635,23.6868397 C53.5827557,23.2463769 53.8302292,22.8529548 54.1837592,22.570362 C54.5815883,22.2370826 55.1001341,22.0832397 55.6158954,22.1454738 C56.1316567,22.2077078 56.5984699,22.4804486 56.905155,22.8987378 C57.2712387,23.4570699 57.4552214,24.1146883 57.4318768,24.7814256 C57.4424998,25.4938943 57.2441662,26.1939306 56.8612615,26.7954637 Z M65.0693425,20.7314576 C63.8622718,20.7314576 62.9844021,21.1911837 62.3918401,22.1325276 L62.3479467,22.1325276 L62.238213,20.8846997 L60.6799944,20.8846997 C60.7238879,21.7603684 60.7458346,22.6360372 60.7458346,23.4679225 L60.7458346,31.9400176 L62.5015738,31.9400176 L62.5015738,27.8243745 C62.9624554,28.568693 63.7305913,28.9408522 64.7620881,28.9408522 C65.6896961,28.9561996 66.5812805,28.5829906 67.2201231,27.9119414 C67.9443655,27.1457312 68.3174601,26.073037 68.3174601,24.7376422 C68.3174601,23.5335976 68.0102057,22.570362 67.3737503,21.8479353 C66.8273175,21.1314098 65.9717662,20.7168981 65.0693425,20.7314576 Z M65.9911056,26.7954637 C65.6353833,27.2977065 65.0488871,27.5860995 64.432887,27.5616739 C63.9064456,27.5815411 63.3988827,27.3645595 63.0502424,26.9705975 C62.6976443,26.5728503 62.5094106,26.0565054 62.5235206,25.5257441 L62.5235206,24.2122409 C62.5272505,24.0338027 62.5568186,23.8568393 62.6113075,23.6868397 C62.7125998,23.2463769 62.9600733,22.8529548 63.3136032,22.570362 C63.7114324,22.2370826 64.2299782,22.0832397 64.7457395,22.1454738 C65.2615007,22.2077078 65.728314,22.4804486 66.0349991,22.8987378 C66.4010828,23.4570699 66.5850655,24.1146883 66.5617209,24.7814256 C66.5397741,25.6133109 66.3642002,26.2919542 65.9911056,26.7954637 Z M75.8012986,22.4827951 C75.2305324,22.282417 74.6911279,22.0023351 74.1991866,21.6509098 C73.8753339,21.389154 73.68937,20.9939633 73.6944115,20.5782156 C73.6900722,20.2017795 73.8503198,19.8421264 74.1333464,19.5930883 C74.5495449,19.2635744 75.073483,19.0997667 75.603778,19.1333622 C76.3372186,19.12296 77.0615786,19.2960695 77.7106651,19.6368717 L78.1495999,18.21391 C77.3713059,17.83715 76.5121884,17.6567366 75.6476715,17.6885087 C74.5283877,17.6885087 73.6285713,17.9731011 72.9482224,18.5422858 C72.2848542,19.0746945 71.904351,19.8822461 71.9167256,20.7314576 C71.9167256,22.1106359 72.8823821,23.1395467 74.8136953,23.8619734 C75.3657873,24.043272 75.8792842,24.3253584 76.3280204,24.6938587 C76.6296718,24.9865307 76.7964918,25.3906491 76.788902,25.8103364 C76.8127198,26.2705446 76.6074326,26.7128535 76.2402335,26.9924892 C75.8671389,27.2989733 75.3623638,27.4303236 74.6820149,27.4303236 C73.7869675,27.4421161 72.9060197,27.2072806 72.136193,26.7516803 L71.7192049,28.1965337 C72.4434473,28.6562598 73.3871572,28.875177 74.5722812,28.875177 C75.8451921,28.875177 76.8547422,28.5468012 77.5789846,27.9119414 C78.2285801,27.3446707 78.5906747,26.5179543 78.566588,25.6570944 C78.5909323,24.9656153 78.3472763,24.2913611 77.886239,23.7744066 C77.4473042,23.2927887 76.7450085,22.8549544 75.8012986,22.4827951 Z M82.4731078,18.9363367 L80.7393153,19.461738 L80.7393153,20.9065914 L79.576138,20.9065914 L79.576138,22.2200945 L80.7393153,22.2200945 L80.7393153,26.1824956 C80.7393153,27.167623 80.9368359,27.8900497 81.3318773,28.3059923 C81.7651808,28.7413043 82.3637024,28.9721525 82.9778828,28.9408522 C83.4467657,28.9562764 83.9147296,28.8895921 84.3605275,28.7438267 L84.316634,27.4084319 C84.0573463,27.4667734 83.7923537,27.4961432 83.5265513,27.4959987 C82.8462024,27.4959987 82.4950545,27.0143809 82.4950545,26.0511453 L82.4950545,22.2419862 L84.4483144,22.2419862 L84.4483144,20.9284831 L82.4950545,20.9284831 L82.4950545,18.9363367 L82.4731078,18.9363367 Z M89.3643843,20.7314576 C88.1573136,20.7314576 87.191657,21.1255086 86.4674146,21.8917187 C85.7431721,22.6579289 85.3920243,23.664948 85.3920243,24.8908842 C85.3588578,25.9493078 85.7272161,26.9812524 86.4235211,27.7805911 C87.1258168,28.5468012 88.0475799,28.9189605 89.2107571,28.9189605 C90.4178279,28.9189605 91.3834845,28.5249095 92.1296736,27.7149159 C92.8319693,26.9487058 93.1831172,25.9416867 93.1831172,24.7376422 C93.1831172,23.5335976 92.8539161,22.6141455 92.1735671,21.869827 C91.4430211,21.1077566 90.4207574,20.6935031 89.3643843,20.7314576 Z M90.8787094,26.6641134 C90.4836681,27.2989733 89.9569463,27.6273491 89.2985441,27.6273491 C88.6287753,27.6419416 88.0083508,27.2774023 87.696432,26.6860051 C87.3701661,26.1205378 87.2033307,25.4775622 87.2136037,24.8252091 C87.1869673,24.1640998 87.3548031,23.5096593 87.696432,22.9425212 C88.0209942,22.352702 88.6460566,21.9904007 89.3204908,22.0011773 C89.9843462,21.9876981 90.5977577,22.3531227 90.9006562,22.9425212 C91.5522931,24.0999825 91.5439522,25.5143791 90.8787094,26.6641134 Z M98.4942284,20.7314576 C98.0358364,20.7281325 97.588889,20.8741792 97.2213175,21.1474003 C96.8101135,21.4663525 96.5043062,21.9010354 96.3434478,22.3952283 L96.2995543,22.3952283 L96.2337141,20.8846997 L94.6974423,20.8846997 C94.7413358,21.6290181 94.7413358,22.4609034 94.7413358,23.3584639 L94.7413358,28.7438267 L96.497075,28.7438267 L96.497075,24.6281836 C96.4783749,24.077226 96.6317571,23.5340845 96.9360098,23.0738716 C97.2672722,22.6089985 97.8134306,22.3448584 98.3844947,22.3733366 C98.5681372,22.37616 98.7514064,22.3907848 98.9331632,22.41712 L98.9331632,20.7533494 C98.8014828,20.7533494 98.6478556,20.7314576 98.4942284,20.7314576 Z M103.541979,20.7095659 C102.463793,20.6688834 101.42997,21.1398393 100.754743,21.9792856 C100.080065,22.8139495 99.7294541,23.8631447 99.7671394,24.9346676 C99.7671394,26.1387122 100.118287,27.1019478 100.820583,27.8243745 C101.522879,28.5468012 102.488535,28.8970687 103.717553,28.8970687 C104.62672,28.9229728 105.531269,28.7589217 106.373108,28.4154509 L106.087801,27.2114064 C105.399396,27.4644037 104.670629,27.5905055 103.93702,27.5835656 C103.31197,27.6146063 102.69658,27.4203509 102.203228,27.0362726 C101.700508,26.5849905 101.420025,25.9374999 101.435092,25.2630434 L106.724256,25.2630434 C106.771745,25.0030906 106.793795,24.7391494 106.790096,24.4749416 C106.818869,23.5976556 106.573439,22.7331546 106.087801,22.0011773 C105.539132,21.1474003 104.683209,20.7095659 103.541979,20.7095659 Z M101.478985,23.9933237 C101.51001,23.497533 101.693989,23.0234449 102.005707,22.6360372 C102.322845,22.1755323 102.85028,21.9042555 103.410298,21.9136105 C103.976288,21.877336 104.516274,22.1550679 104.81489,22.6360372 C105.058793,23.0379921 105.180756,23.501812 105.166038,23.971432 L101.478985,23.9933237 Z M45.4050629,13.310165 C45.9976249,12.8285472 46.2829326,12.1061205 46.2829326,11.1428848 C46.2829326,10.2891078 46.0195717,9.63235625 45.4709032,9.17263015 C44.9880749,8.7566875 44.2638324,8.55966203 43.3201226,8.55966203 C42.8206981,8.56100537 42.3219943,8.59758283 41.8277442,8.66912062 L41.8277442,13.9231331 C42.2503,13.9709961 42.6754038,13.9929291 43.1006552,13.9888083 C44.0882585,13.9888083 44.8563944,13.7698911 45.4050629,13.310165 Z M42.6836671,9.28208875 C42.9145998,9.23428698 43.150147,9.2122598 43.3859628,9.21641359 C44.0224183,9.21641359 44.5271933,9.39154734 44.8563944,9.71992312 C45.2129166,10.1140436 45.3949162,10.6349942 45.3611694,11.1647766 C45.3611694,11.8653116 45.1855955,12.3907128 44.8125009,12.762872 C44.4394063,13.1350312 43.9346313,13.310165 43.2762291,13.310165 C43.0784376,13.3177774 42.8803522,13.3104593 42.6836671,13.2882733 L42.6836671,9.28208875 Z M49.0043284,10.0045155 C48.4693155,9.98330694 47.95055,10.1902929 47.5777902,10.5737002 C47.2181173,10.9759479 47.0292482,11.5018858 47.0510685,12.0404453 C47.0358109,12.5609175 47.2158109,13.0683378 47.5558435,13.463407 C47.9048152,13.8415334 48.4015667,14.0493263 48.9165414,14.0325917 C49.4563552,14.0560836 49.9788234,13.8396025 50.3430796,13.4415153 C50.7027525,13.0392675 50.8916216,12.5133296 50.8698013,11.9747702 C50.8850589,11.454298 50.7050589,10.9468777 50.3650263,10.5518084 C50.0099855,10.1848655 49.5152387,9.985871 49.0043284,10.0045155 Z M49.7285708,12.9380058 C49.5760695,13.2198313 49.2814948,13.396133 48.9604349,13.3977319 C48.6329344,13.3989254 48.3305156,13.2229567 48.1703522,12.9380058 C48.0064508,12.6595792 47.9229023,12.3413759 47.9289381,12.0185536 C47.9193274,11.6953157 48.0031306,11.3761421 48.1703522,11.0991014 C48.3222562,10.8061867 48.6300503,10.6270903 48.9604349,10.6393753 C49.2835483,10.6334819 49.5817306,10.8119428 49.7285708,11.0991014 C49.8924723,11.377528 49.9760207,11.6957312 49.969985,12.0185536 C49.9843053,12.3423086 49.9001517,12.6628171 49.7285708,12.9380058 Z M53.43757,13.9450248 L53.9862385,12.2593625 C54.1195697,11.851605 54.2222719,11.4345089 54.2934929,11.0115345 L54.3154396,11.0115345 C54.4032266,11.4274772 54.4910135,11.8434198 54.622694,12.2593625 L55.127469,13.9450248 L55.9175517,13.9450248 L57.1465691,10.0920823 L56.2906463,10.0920823 L55.807818,11.8872033 C55.6980843,12.3469294 55.6102973,12.762872 55.5444571,13.156923 L55.5225103,13.156923 C55.4347234,12.7409803 55.3469364,12.3250377 55.215256,11.8872033 L54.6885342,10.0920823 L53.9862385,10.0920823 L53.43757,11.9309867 C53.2839428,12.4344962 53.1742091,12.8285472 53.1083689,13.156923 L53.0864221,13.156923 C53.0205819,12.762872 52.9327949,12.3469294 52.8230612,11.909095 L52.3841264,10.0701906 L51.4843101,10.0701906 L52.6255406,13.9231331 L53.43757,13.9231331 L53.43757,13.9450248 Z M61.4042368,13.9450248 L61.4042368,11.6463944 C61.4042368,11.0772097 61.2506096,10.661267 60.9433553,10.3766747 C60.7041944,10.1418773 60.3789197,10.0152591 60.0435389,10.0264072 C59.7644236,10.0210624 59.4898201,10.0971499 59.2534562,10.2453244 C59.068633,10.3639208 58.9114692,10.5206906 58.7925747,10.7050505 L58.7706279,10.7050505 L58.7267345,10.1139741 L57.9585985,10.1139741 C57.9805453,10.508025 57.9805453,10.8801842 57.9805453,11.20856 L57.9805453,13.9669166 L58.8584149,13.9669166 L58.8584149,11.6463944 C58.8541786,11.4051431 58.940254,11.1709805 59.0998291,10.9896428 C59.2534031,10.797751 59.4904906,10.6917369 59.7362845,10.7050505 C60.2630063,10.7050505 60.5263672,11.055318 60.5263672,11.7339612 L60.5263672,13.9450248 L61.4042368,13.9450248 Z M62.655201,8.31885312 L63.5330707,8.31885312 L63.5330707,13.9450248 L62.655201,13.9450248 L62.655201,8.31885312 Z M66.5178274,10.0045155 C65.9828145,9.98330694 65.464049,10.1902929 65.0912892,10.5737002 C64.7316163,10.9759479 64.5427472,11.5018858 64.5645675,12.0404453 C64.5493099,12.5609175 64.7293099,13.0683378 65.0693425,13.463407 C65.4245803,13.8457254 65.9298298,14.0537183 66.4519872,14.0325917 C66.9918009,14.0560836 67.5142691,13.8396025 67.8785253,13.4415153 C68.2314827,13.0366135 68.4125287,12.5105411 68.3833003,11.9747702 C68.3985579,11.454298 68.2185579,10.9468777 67.8785253,10.5518084 C67.5234845,10.1848655 67.0287377,9.985871 66.5178274,10.0045155 Z M67.2640166,12.9380058 C67.1171763,13.2251644 66.818994,13.4036252 66.4958806,13.3977319 C66.1683802,13.3989254 65.8659613,13.2229567 65.705798,12.9380058 C65.5418965,12.6595792 65.4583481,12.3413759 65.4643838,12.0185536 C65.4440456,11.6941876 65.5286716,11.3718801 65.705798,11.0991014 C65.857702,10.8061867 66.165496,10.6270903 66.4958806,10.6393753 C66.8233811,10.6381818 67.1258,10.8141505 67.2859633,11.0991014 C67.4498648,11.377528 67.5334132,11.6957312 67.5273774,12.0185536 C67.5133514,12.3414403 67.423118,12.6564653 67.2640166,12.9380058 Z M72.3117669,13.0255727 L72.3117669,11.6026109 C72.3117669,10.5299167 71.8069919,10.0045155 70.775495,10.0045155 C70.3073291,9.98780756 69.8437524,10.101516 69.4367439,10.3328912 L69.6123178,10.9020759 C69.9118933,10.7067993 70.2641386,10.6075013 70.6218679,10.6174836 C71.1705364,10.6174836 71.4338973,10.8801842 71.4338973,11.3836937 L71.4338973,11.4493689 C70.7096548,11.4493689 70.1390396,11.5588275 69.7439982,11.8215281 C69.3635216,12.0429699 69.1358614,12.4550952 69.1514362,12.8942223 C69.1469736,13.2090982 69.2749928,13.5114314 69.5043942,13.7277763 C69.7337957,13.9441212 70.0435857,14.0546789 70.358507,14.0325917 C70.8021495,14.0540849 71.2283077,13.8578896 71.4997375,13.5071905 L71.5216842,13.5071905 L71.5875244,13.9450248 L72.3776071,13.9450248 C72.304967,13.6442614 72.2827198,13.3335812 72.3117669,13.0255727 Z M71.455844,12.6315217 L71.4338973,12.7847637 C71.3906373,12.9700498 71.2814676,13.1333938 71.1266429,13.2444898 C70.9741773,13.3571971 70.789688,13.4185394 70.5999211,13.4196236 C70.4454388,13.4297675 70.2938926,13.3740747 70.182933,13.2663816 C70.0639761,13.1434541 70.0005486,12.9773743 70.0073591,12.8066555 C70.0073591,12.2812542 70.4901874,12.0185536 71.455844,12.0185536 L71.455844,12.6315217 Z M74.9453758,14.0325917 C75.4653945,14.0701102 75.9576715,13.794437 76.19634,13.3320567 L76.2182867,13.3320567 L76.2621802,13.9450248 L77.0303161,13.9450248 C77.0083694,13.6166491 76.9864226,13.2882733 76.9864226,12.8942223 L76.9864226,8.31885312 L76.108553,8.31885312 L76.108553,10.5299167 C75.8890856,10.1796492 75.5379378,10.0045155 75.011216,10.0045155 C74.5465832,9.9954448 74.102806,10.196656 73.8041452,10.5518084 C73.4598112,10.9786875 73.2806742,11.5147513 73.2993702,12.062337 C73.2761493,12.576549 73.4398071,13.0818388 73.7602518,13.4852987 C74.052277,13.836747 74.4877861,14.0378661 74.9453758,14.0325917 Z M74.4625475,11.055318 C74.6338374,10.8036178 74.9264539,10.6618461 75.2306834,10.6831587 C75.4428887,10.6752776 75.6490799,10.7543831 75.8012986,10.9020759 C75.9607806,11.0371391 76.069191,11.2225197 76.108553,11.4274772 C76.1287272,11.5134993 76.1361217,11.6020114 76.1304997,11.6901778 L76.1304997,12.3250377 C76.1340953,12.5794396 76.0487327,12.8271447 75.8890856,13.0255727 C75.7265597,13.2330313 75.4722276,13.347603 75.2087366,13.3320567 C74.9086258,13.3338087 74.6247576,13.1962756 74.4406007,12.9598975 C74.2567422,12.6892797 74.1644608,12.3671045 74.1772398,12.0404453 C74.1607827,11.6896651 74.261094,11.3433041 74.4625475,11.055318 Z M82.0122262,14.0325917 C82.55204,14.0560836 83.0745082,13.8396025 83.4387644,13.4415153 C83.7917218,13.0366135 83.9727677,12.5105411 83.9435394,11.9747702 C83.958797,11.454298 83.778797,10.9468777 83.4387644,10.5518084 C83.0809957,10.1731386 82.5774916,9.96586425 82.0561197,9.98262375 C81.5211068,9.96141522 81.0023414,10.1684012 80.6295816,10.5518084 C80.2699087,10.9540562 80.0810395,11.4799941 80.1028598,12.0185536 C80.0876022,12.5390258 80.2676022,13.046446 80.6076348,13.4415153 C80.9621416,13.8402643 81.4785134,14.0575625 82.0122262,14.0325917 Z M81.2440903,11.0991014 C81.3959943,10.8061867 81.7037884,10.6270903 82.034173,10.6393753 C82.3572864,10.6334819 82.6554686,10.8119428 82.8023089,11.0991014 C82.9662104,11.377528 83.0497588,11.6957312 83.043723,12.0185536 C83.0474235,12.3410937 82.9640362,12.6586833 82.8023089,12.9380058 C82.6498075,13.2198313 82.3552328,13.396133 82.034173,13.3977319 C81.7066725,13.3989254 81.4042536,13.2229567 81.2440903,12.9380058 C81.0801888,12.6595792 80.9966404,12.3413759 81.0026762,12.0185536 C81.0095438,11.6973974 81.0922544,11.3823849 81.2440903,11.0991014 Z M85.8748526,13.9450248 L85.8748526,11.6463944 C85.8706163,11.4051431 85.9566917,11.1709805 86.1162667,10.9896428 C86.2698408,10.797751 86.5069283,10.6917369 86.7527222,10.7050505 C87.279444,10.7050505 87.5428049,11.055318 87.5428049,11.7339612 L87.5428049,13.9450248 L88.4206745,13.9450248 L88.4206745,11.6463944 C88.453605,11.1812177 88.2951107,10.7227365 87.9817397,10.3766747 C87.7425788,10.1418773 87.4173041,10.0152591 87.0819233,10.0264072 C86.802808,10.0210624 86.5282045,10.0971499 86.2918406,10.2453244 C86.1081784,10.3581785 85.9569553,10.5165647 85.8529058,10.7050505 L85.8309591,10.7050505 L85.7870656,10.1139741 L85.0189297,10.1139741 C85.0408764,10.508025 85.0408764,10.8801842 85.0408764,11.20856 L85.0408764,13.9669166 L85.8748526,13.9669166 L85.8748526,13.9450248 Z M93.7317857,10.7269422 L93.7317857,10.0920823 L92.7661291,10.0920823 L92.7661291,9.12884672 L91.9102062,9.39154734 L91.9102062,10.0920823 L91.339591,10.0920823 L91.339591,10.7269422 L91.9102062,10.7269422 L91.9102062,12.6753052 C91.9102062,13.156923 91.9979932,13.5071905 92.1955139,13.7261077 C92.4124407,13.9352781 92.7061372,14.0461279 93.0075433,14.0325917 C93.2377106,14.043209 93.4679654,14.0135732 93.6878922,13.9450248 L93.6659455,13.2882733 C93.5360759,13.3160801 93.4037255,13.3307488 93.2709041,13.3320567 C92.941703,13.3320567 92.7661291,13.0912478 92.7661291,12.60963 L92.7661291,10.7269422 L93.7317857,10.7269422 Z M95.5533652,11.6245027 C95.5539634,11.5208262 95.5687306,11.4177151 95.5972586,11.3180186 C95.70168,10.9472701 96.045304,10.6947083 96.4312348,10.7050505 C96.9579566,10.7050505 97.2213175,11.055318 97.2213175,11.755853 L97.2213175,13.9669166 L98.0991871,13.9669166 L98.0991871,11.6682861 C98.1315904,11.1965647 97.9735466,10.7315043 97.6602523,10.3766747 C97.4234735,10.1382341 97.0965381,10.0109694 96.7604359,10.0264072 C96.2836319,10.0019456 95.8336878,10.2475242 95.5972586,10.661267 L95.5753119,10.661267 L95.5753119,8.31885312 L94.6974423,8.31885312 L94.6974423,13.9450248 L95.5753119,13.9450248 L95.5753119,11.6245027 L95.5533652,11.6245027 Z M102.334908,13.7917828 L102.203228,13.2007064 C101.867593,13.3296416 101.509198,13.3892242 101.149784,13.3758402 C100.842587,13.3897831 100.540063,13.2969321 100.293861,13.1131395 C100.038003,12.8962811 99.8997179,12.5717194 99.9207665,12.2374708 L102.532429,12.2374708 C102.551966,12.1070823 102.559313,11.9751647 102.554375,11.8434198 C102.575897,11.4141606 102.452233,10.9901331 102.203228,10.6393753 C101.914162,10.2287328 101.432464,9.99677209 100.930317,10.0264072 C100.404385,10.0009057 99.8981813,10.2289406 99.5696187,10.6393753 C99.2392718,11.0471581 99.0677975,11.5602913 99.0867904,12.0842287 C99.0609278,12.6102831 99.251132,13.124128 99.6135122,13.5071905 C99.9952939,13.8722554 100.512038,14.0625749 101.04005,14.0325917 C101.483633,14.041438 101.924324,13.9594812 102.334908,13.7917828 Z M100.184127,10.9458594 C100.338302,10.7233963 100.593374,10.5920764 100.864476,10.5955919 C101.140079,10.5713081 101.405015,10.7077065 101.544825,10.9458594 C101.664571,11.1437522 101.725462,11.3715193 101.720399,11.6026109 L99.9207665,11.6026109 C99.9522863,11.3652151 100.042819,11.1394499 100.184127,10.9458594 Z M119.479252,0.153242031 L6.13247726,0.153242031 C2.77307541,0.160464176 0.0516789166,2.68496258 0.0438934812,5.80130547 L0.0438934812,33.0127119 C0.0451958644,36.1436411 2.78095061,38.6814589 6.15607643,38.682667 L119.502851,38.682667 C122.877977,38.6814589 125.613732,36.1436411 125.615034,33.0127119 L125.615034,5.80130547 C125.589108,2.67489716 122.849604,0.15314953 119.479252,0.153242031 Z M124.411477,33.0127119 C124.398562,35.5346392 122.197877,37.5761002 119.479252,37.5880811 L6.13247726,37.5880811 C3.41385236,37.5761002 1.21316772,35.5346392 1.20025242,33.0127119 L1.20025242,5.80130547 C1.21710192,3.28445205 3.41927242,1.25138703 6.13247726,1.24782797 L119.479252,1.24782797 C122.197877,1.25980882 124.398562,3.30126985 124.411477,5.82319719 L124.411477,33.0127119 Z" id="bd0d525a-ff0f-4654-bd8d-c85290d6ce62"></path>
												</g>
										</g>
								</g>
						</g>
				</svg>`;
		},

		facebook() {
			return `
				<svg width="10px" height="20px" viewBox="0 0 10 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
								<g transform="translate(-1179.000000, -30.000000)" fill="#AAA59C">
										<g transform="translate(1179.000000, 30.000000)">
												<path d="M8.75928133,9.8128021 L6.01147902,9.8128021 L6.01147902,19.6129039 L1.93740172,19.6129039 L1.93740172,9.8128021 L0,9.8128021 L0,6.35075868 L1.93740172,6.35075868 L1.93740172,4.11066629 C1.93740172,2.50891557 2.69821063,0 6.04746323,0 L9.06499589,0.0130026961 L9.06499589,3.37314127 L6.87570473,3.37314127 C6.51646745,3.37314127 6.01147902,3.55275991 6.01147902,4.3168951 L6.01147902,6.35408495 L9.11488995,6.35408495 L8.75928133,9.8128021 Z"></path>
										</g>
								</g>
						</g>
				</svg>
			`;
		},

		linkedin() {
			return `

				<svg width="18px" height="19px" viewBox="0 0 18 19" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
								<g id="Footer" transform="translate(-1297.000000, -31.000000)" fill="#AAA59C">
										<g id="Group-3" transform="translate(1179.000000, 30.000000)">
												<path d="M135.961835,12.4488571 L135.961835,19.6745571 L132.111516,19.6745571 L132.111516,12.9333571 C132.111516,11.2401857 131.555198,10.0844429 130.161659,10.0844429 C129.09742,10.0844429 128.465014,10.8626286 128.186356,11.6163857 C128.085071,11.8856429 128.058627,12.2599429 128.058627,12.6375 L128.058627,19.6745571 L124.20756,19.6745571 C124.20756,19.6745571 124.2592,8.25637143 124.20756,7.0743 L128.058627,7.0743 L128.058627,8.85975714 C128.050894,8.8736 128.040167,8.88744286 128.033431,8.90101429 L128.058627,8.90101429 L128.058627,8.85975714 C128.57029,8.00312857 129.48335,6.77844286 131.528754,6.77844286 C134.06262,6.77844286 135.961835,8.57882857 135.961835,12.4488571 Z M120.17887,1 C118.86142,1 118,1.9405 118,3.17685714 C118,4.38661429 118.836972,5.35452857 120.128228,5.35452857 L120.153674,5.35452857 C121.49657,5.35452857 122.331546,4.38661429 122.331546,3.17685714 C122.30635,1.9405 121.49657,1 120.17887,1 Z M118.229013,19.6745571 L122.078334,19.6745571 L122.078334,7.0743 L118.229013,7.0743 L118.229013,19.6745571 Z" id="linkedin-logo"></path>
										</g>
								</g>
						</g>
				</svg>
			`;
		},

		instagram() {
			return `
				<svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
								<g id="Footer" transform="translate(-1212.000000, -30.000000)" fill="#AAA59C">
										<g id="Group-3" transform="translate(1179.000000, 30.000000)">
												<path d="M46.76001,-2.85079315e-21 L39.2400221,-2.85079315e-21 C35.7937708,-1.77635684e-15 33.0000321,2.79373868 33.0000321,6.23998999 L33.0000321,13.7399779 C32.9947167,15.3983887 33.649795,16.9906975 34.8205967,18.1652518 C35.9913985,19.3398061 37.5816028,19.9999764 39.2400221,19.9999679 L46.74001,19.9999679 C48.3984208,20.0052833 49.9907296,19.350205 51.1652839,18.1794033 C52.3398382,17.0086015 53.0000085,15.4183972 53,13.7599779 L53,6.23998999 C53,2.79373868 50.2062613,-1.77635684e-15 46.76001,-1.77635684e-15 L46.76001,-2.85079315e-21 Z M50.500004,13.7599779 C50.4890701,15.8209736 48.8210057,17.489038 46.76001,17.4999719 L39.2400221,17.4999719 C37.1790264,17.489038 35.510962,15.8209736 35.5000281,13.7599779 L35.5000281,6.23998999 C35.5000281,4.17444834 37.1744804,2.49999599 39.2400221,2.49999599 L46.74001,2.49999599 C48.8010057,2.51092988 50.4690701,4.17899429 50.480004,6.23998999 L50.480004,13.7399779 L50.500004,13.7599779 Z M43.000016,4.99999198 C40.2385967,4.99999198 38.0000241,7.23856463 38.0000241,9.99998395 C38.0000241,12.7614033 40.2385967,14.9999759 43.000016,14.9999759 C45.7614354,14.9999759 48.000008,12.7614033 48.000008,9.99998395 C48.000008,7.23856463 45.7614354,4.99999198 43.000016,4.99999198 L43.000016,4.99999198 Z M43.000016,12.4999799 C41.6193064,12.4999799 40.5000201,11.3806936 40.5000201,9.99998395 C40.5000201,8.61927429 41.6193064,7.49998796 43.000016,7.49998796 C44.3807257,7.49998796 45.500012,8.61927429 45.500012,9.99998395 C45.500012,11.3806936 44.3807257,12.4999799 43.000016,12.4999799 L43.000016,12.4999799 Z M49.260006,4.99999198 C49.2680889,5.51316386 48.964103,5.97995428 48.4914966,6.18008888 C48.0188901,6.38022348 47.4721235,6.27370112 47.1092112,5.91078879 C46.7462988,5.54787646 46.6397765,5.00110985 46.8399111,4.5285034 C47.0400457,4.05589694 47.5068361,3.75191102 48.020008,3.75999397 C48.70484,3.75999397 49.260006,4.31515998 49.260006,4.99999198 L49.260006,4.99999198 Z" id="Shape"></path>
										</g>
								</g>
						</g>
				</svg>`;
		},

		country() {
			return `
				<svg width="14px" height="16px" viewBox="0 0 14 16" version="1.1">
					<g stroke="none" stroke-width="1" transform="translate(-3.000000, -2.000000)" fill="#A7A299" fill-rule="evenodd">
						<path d="M3,16 L3,15 L8,15 L8,14 L3,14 L3,13 L8,13 L8,12 L3,12 L3,11 L8,11 L8,10 L3,10 L3,9.03883061 L10,6.03084338 L10,18 L3,18 L3,17 L8,17 L8,16 L3,16 Z" id="Combined-Shape"></path>
						<path d="M10,15 L10,14 L15,14 L15,12 L10,12 L10,11 L15,11 L15,9 L10,9 L10,8 L15,8 L15,6 L10,6 L10,2 L17,5.01290796 L17,18 L10,18 L10,17 L15,17 L15,15 L10,15 Z"></path>
					</g>
				</svg>
			`;
		},

		twitter() {
			return `

				<svg width="21px" height="17px" viewBox="0 0 21 17" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
						<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
								<g transform="translate(-1254.000000, -32.000000)" fill="#AAA59C">
										<g transform="translate(1179.000000, 30.000000)">
												<path d="M95.9957469,4.00178107 C95.2233655,4.34145676 94.3926677,4.57108367 93.5213346,4.67375487 C94.4109691,4.14533631 95.0937046,3.30951894 95.4159955,2.31231719 C94.5834366,2.8016961 93.661542,3.15674173 92.6804004,3.34794379 C91.8946807,2.5185818 90.7751929,2 89.5356603,2 C87.1570977,2 85.2280052,3.91171322 85.2280052,6.26884731 C85.2280052,6.60360462 85.266159,6.92913996 85.339985,7.24176455 C81.7600436,7.06378064 78.5861453,5.36448 76.4613209,2.78110038 C76.0906398,3.41157535 75.8781574,4.14533631 75.8781574,4.92766629 C75.8781574,6.40809897 76.6390616,7.71515872 77.7942217,8.48058177 C77.0885318,8.45844905 76.4237875,8.26663219 75.8434157,7.94632263 C75.8427953,7.96445916 75.8427953,7.98259569 75.8427953,8.00042482 C75.8427953,10.068604 77.3283113,11.7937262 79.2986594,12.1856597 C78.9375943,12.2834125 78.5563667,12.3356703 78.1639721,12.3356703 C77.8857287,12.3356703 77.6161707,12.3089266 77.3531267,12.2594354 C77.9015486,13.9550472 79.4919099,15.1892535 81.377265,15.2236821 C79.9026059,16.3687427 78.0457885,17.0511681 76.0270502,17.0511681 C75.6799438,17.0511681 75.3362496,17.0311871 75,16.9915327 C76.9055177,18.2029914 79.1702394,18.9097013 81.6027756,18.9097013 C89.5260443,18.9097013 93.8588249,12.4054498 93.8588249,6.763452 C93.8588249,6.57870531 93.8547924,6.39426603 93.846107,6.21136373 C94.6882819,5.60947686 95.4184771,4.85788676 95.9957469,4.00178107" ></path>
										</g>
								</g>
						</g>
				</svg>
			`;
		},

		logo() {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" width="212.6" height="40.81" viewBox="0 0 212.6 40.81">
					<path fill="#EEECE7" d="M30.95,30l-8.07-4H189.72l-8.07,4Zm26.91,5.38-8.07-4h113l-8.07,4Zm30.95,5.38-8.07-4h51.13l-8.07,4ZM8.07,24.66,0,20.63H71.31l8.07,4Zm125.14,0,8.07-4H212.6l-8.07,4ZM10.13,6.34a2.77,2.77,0,0,1-.91.88,5,5,0,0,1-1.44.58A8,8,0,0,1,5.85,8,8,8,0,0,1,3.93,7.8a5,5,0,0,1-1.44-.58,2.76,2.76,0,0,1-.91-.88,2.07,2.07,0,0,1-.32-1.11V3.94H3.1V5a1.29,1.29,0,0,0,.71,1.13,4,4,0,0,0,2,.43,3.93,3.93,0,0,0,2-.44A1.29,1.29,0,0,0,8.6,5V.19h1.85v5A2.07,2.07,0,0,1,10.13,6.34ZM24.57,7.79V.19h8.24V1.64H26.42V3.21h4.44V4.66H26.42V6.34h6.69V7.79ZM51.13,1.64V7.79H49.28V1.64H45.66V.19h9.09V1.64Zm22,0a7,7,0,0,0-1.71-.2,5.68,5.68,0,0,0-1.8.22q-.6.21-.6.58t.66.55a4.57,4.57,0,0,0,.59.09l.68,0,.77,0,.85.06a11.36,11.36,0,0,1,1.55.24,3.82,3.82,0,0,1,1.1.42,1.75,1.75,0,0,1,.66.67,2,2,0,0,1,.22,1A2.16,2.16,0,0,1,75,7.28,6.41,6.41,0,0,1,71.64,8,9.81,9.81,0,0,1,69,7.63a7.6,7.6,0,0,1-2.3-1.09l1-1.24a8.36,8.36,0,0,0,2,.89,7.18,7.18,0,0,0,2,.29,4.25,4.25,0,0,0,1.77-.29q.62-.29.62-.77A.46.46,0,0,0,73.94,5a1.31,1.31,0,0,0-.51-.21,4.87,4.87,0,0,0-.82-.09l-1.09-.05a15.06,15.06,0,0,1-1.94-.18,5.18,5.18,0,0,1-1.38-.41,2,2,0,0,1-.82-.67,1.7,1.7,0,0,1-.27-1A2,2,0,0,1,68.18.66,6.16,6.16,0,0,1,71.34,0a8,8,0,0,1,4.47,1.11L74.76,2.33A6.9,6.9,0,0,0,73.13,1.68ZM98.88,7.79V2.39h0L95.23,6.75,91.6,2.39h0v5.4H89.73V.19h2.16l3.34,4,3.34-4h2.16v7.6Zm64.53-6.15V7.79h-1.85V1.64h-3.62V.19H167V1.64Zm16.65,6.15V.19h8.24V1.64h-6.39V3.21h4.44V4.66h-4.44V6.34h6.69V7.79ZM122,7.79l-.87-1.64h-4.87l-.87,1.64h-1.87l4-7.6h2.28l4,7.6Zm-3.32-6.21L117,4.7h3.34Zm25.19,6.21L142,5.1h-3.5V7.79h-1.85V.19h6.23a3.68,3.68,0,0,1,1.18.18,2.57,2.57,0,0,1,.9.51,2.3,2.3,0,0,1,.58.79,2.45,2.45,0,0,1,.2,1A2.15,2.15,0,0,1,144,5L146,7.79Zm-.27-4.41a.94.94,0,0,0,.32-.75.89.89,0,0,0-.33-.72,1.41,1.41,0,0,0-.92-.27h-4.17v2h4.18A1.37,1.37,0,0,0,143.61,3.38Zm65.66,4.41L207.4,5.1h-3.5V7.79h-1.85V.19h6.23a3.68,3.68,0,0,1,1.18.18,2.59,2.59,0,0,1,.9.51,2.29,2.29,0,0,1,.58.79,2.44,2.44,0,0,1,.21,1A2.15,2.15,0,0,1,209.41,5l1.93,2.82ZM209,3.38a.94.94,0,0,0,.32-.75.89.89,0,0,0-.33-.72,1.41,1.41,0,0,0-.92-.27H203.9v2h4.18A1.37,1.37,0,0,0,209,3.38Z"/>
				</svg>
				`;
		},

		plane({ color = "#ff5c49" } = {}) {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22">
				<path fill="${color}" d="M14,9.38,5.54,0h-2l5.1,9.39H4.89L1.68,6.15H0L2.78,11,0,15.85H1.68l3.21-3.24H8.68L3.58,22h2L14,12.62h5.73C22,12.61,24,11.89,24,11s-1.94-1.61-4.31-1.61Z"/>
			</svg>
			`;
		},

		planeMedium({ color = "#fff", w = 28, h = 26 } = {}) {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 28 26">
				<path fill="${color}" d="M16.29,11.09,6.47,0H4.17l5.95,11.1H5.71L2,7.27H0L3.25,13,0,18.73H2l3.74-3.82h4.41L4.17,26h2.3l9.82-11.09H23c2.71,0,5-.86,5-1.91s-2.26-1.9-5-1.9Z"/>
			</svg>
			`;
		},

		check() {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="17px" height="13px" version="1.1" viewBox="0 0 17 13">
					<g fill="none" fill-rule="evenodd" stroke="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1">
						<polyline stroke="#625F57" stroke-width="2" points="2 6.06256104 6.65625 10.718811 15.375061 2"/>
					</g>
				</svg>`;
		},

		uncheck() {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="17px" height="13px" version="1.1" viewBox="0 0 17 13">
					<g fill="none" fill-rule="evenodd" stroke="none" stroke-linecap="round" stroke-width="1">
						<path stroke="#B3B1B4" stroke-width="2" d="M13.921875,1.46875 L3.875,11.515625"/>
						<path stroke="#B3B1B4" stroke-width="2" d="M3.875,1.46875 L13.921875,11.515625"/>
					</g>
				</svg>
			`;
		},

		backArrow() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13">
				<path fill="none" stroke="#44423e" stroke-linecap="round" stroke-linejoin="round" d="M6.5,12.13.94,6.57,6.5,1M1.12,6.57H12.24"/>
			</svg>`;
		},

		hamburger() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="22" height="17" viewBox="0 0 22 17">
				<path fill="#44423e" d="M.5,0h21a.5.5,0,0,1,.5.5h0a.5.5,0,0,1-.5.5H.5A.5.5,0,0,1,0,.5H0A.5.5,0,0,1,.5,0Zm0,8h21a.5.5,0,0,1,.5.5h0a.5.5,0,0,1-.5.5H.5A.5.5,0,0,1,0,8.5H0A.5.5,0,0,1,.5,8Zm0,8h21a.5.5,0,0,1,.5.5h0a.5.5,0,0,1-.5.5H.5a.5.5,0,0,1-.5-.5H0A.5.5,0,0,1,.5,16Z"/>
			</svg>`;
		},

		sliderArrow() {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50px" height="50px" version="1.1" viewBox="0 0 50 50">
					<g fill="none" fill-rule="evenodd" stroke="none" stroke-linecap="round" stroke-width="1">
							<polyline stroke="#EEECE7" stroke-width="2" points="5 15 25 35 45 15" transform="translate(25.000000, 25.000000) scale(-1, 1) rotate(-90.000000) translate(-25.000000, -25.000000) "/>
					</g>
				</svg>`;
		},

		sliderControl() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="50px" height="50px" version="1.1" viewBox="0 0 50 50">
			<defs>
					<path id="path-1" d="M44.2928932,14.2928932 C44.6834175,13.9023689 45.3165825,13.9023689 45.7071068,14.2928932 C46.0976311,14.6834175 46.0976311,15.3165825 45.7071068,15.7071068 L25,36.4142136 L4.29289322,15.7071068 C3.90236893,15.3165825 3.90236893,14.6834175 4.29289322,14.2928932 C4.68341751,13.9023689 5.31658249,13.9023689 5.70710678,14.2928932 L25,33.5857864 L44.2928932,14.2928932 Z"/>
					<filter id="filter-2" width="142.9%" height="180.3%" x="-21.4%" y="-40.2%" filterUnits="objectBoundingBox">
							<feOffset dx="0" dy="0" in="SourceAlpha" result="shadowOffsetOuter1"/>
							<feGaussianBlur in="shadowOffsetOuter1" result="shadowBlurOuter1" stdDeviation="3"/>
							<feColorMatrix in="shadowBlurOuter1" type="matrix" values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0"/>
					</filter>
			</defs>
			<g id="Elements/Arrow/Left-Copy" fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
					<g id="Path-2" fill-rule="nonzero" transform="translate(25.000000, 25.207107) scale(-1, 1) rotate(-90.000000) translate(-25.000000, -25.207107) ">
							<use fill="black" fill-opacity="1" filter="url(#filter-2)" xlink:href="#path-1"/>
							<use fill="#EEECE7" xlink:href="#path-1"/>
					</g>
				</g>
			</svg>
			`;
		},

		seat() {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="30px" height="30px" version="1.1" viewBox="0 0 30 30">
					<g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
							<rect width="26" height="26" x="2" y="2" fill="#837E74" fill-rule="nonzero" rx="4"/>
							<path stroke="#FFFFFF" d="M10.5,9.59949444 L10.5,17.4005056 C10.5,18.0043299 10.9944695,18.5 11.5994944,18.5 L19.4005056,18.5 C20.0043299,18.5 20.5,18.0055305 20.5,17.4005056 L20.5,9.59949444 C20.5,8.9956701 20.0055305,8.5 19.4005056,8.5 L11.5994944,8.5 C10.9956701,8.5 10.5,8.99446945 10.5,9.59949444 Z"/>
							<path stroke="#FFFFFF" d="M9.5,19.6095537 L9.5,21.3904463 C9.5,22.006889 9.98925378,22.5 10.5940552,22.5 L20.4059448,22.5 C21.0068019,22.5 21.5,22.0028192 21.5,21.3904463 L21.5,19.6095537 C21.5,18.993111 21.0107462,18.5 20.4059448,18.5 L10.5940552,18.5 C9.99319806,18.5 9.5,18.9971808 9.5,19.6095537 Z"/>
							<path stroke="#FFFFFF" d="M21,14 L22.5,14 C23.3284271,14 24,14.6711894 24,15.5016756 L24,19.4983244 C24,20.3276769 23.3228912,21 22.5046844,21 L22,21"/>
							<path stroke="#FFFFFF" d="M7,14 L8.5,14 C9.32842712,14 10,14.6711894 10,15.5016756 L10,19.4983244 C10,20.3276769 9.32289124,21 8.50468445,21 L8,21" transform="translate(8.500000, 17.500000) scale(-1, 1) translate(-8.500000, -17.500000) "/>
							<polyline stroke="#FFFFFF" stroke-width="0.799999952" points="12.1875 13.7460317 14.7647727 16.4444444 18.6306818 11.047619"/>
					</g>
				</svg>`;
		},

		allRoutesArrows() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
				<path fill="none" stroke="#a8a8a8" stroke-linecap="round" d="M19,5H7Q1,5,1,11M15,1l4,4L15,9M2,17H14q6,0,6-6M5,20,2,17l3-3"/>
			</svg>`;
		},

		playerPlay() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70">
				<rect width="70" height="70" fill="#fe6a57" rx="6" ry="6"/>
				<path fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" d="M25.5,19.11,51.6,35,25.5,50.89Z"/>
			</svg>`;
		},

		time() {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
				<path fill="none" stroke="#fe6a57" d="M10,2.5A7.5,7.5,0,1,1,2.5,10,7.5,7.5,0,0,1,10,2.5ZM10,5v5l3,3"/>
			</svg>`;
		},

		arrow() {
			return `
				<svg width="24px" height="11px" viewBox="0 0 24 11" version="1.1" xmlns="http://www.w3.org/2000/svg">
						<g fill="none"" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.000000, 1.000000)" stroke="#FE6A57" stroke-width="2">
							<path d="M0.0743679967,4 C0.0743679967,4 6.74103466,4 20.074368,4"></path>
							<polyline points="17.0682702 0.0110524129 21.1387294 4.08151155 17.0682702 8.15197069"></polyline>
						</g>
				</svg>
			`;
		},

		planeLandingIconTrips({ color = '#44423e' } = {}) {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
				<path fill="${color}" d="M2,7l2.38,3.75a8.52,8.52,0,0,0,3.82.75h8.52c3.09,0,0-2.25-3.1-2.25h-7L3.55,7Zm0,7H19v1H2Zm7.5-2.5a1,1,0,1,1-1,1A1,1,0,0,1,9.5,11.5Zm6,0a1,1,0,1,1-1,1A1,1,0,0,1,15.5,11.5Z"/>
				<path fill="none" stroke="${color}" d="M4.5.5h12a4,4,0,0,1,4,4v12a4,4,0,0,1-4,4H4.5a4,4,0,0,1-4-4V4.5A4,4,0,0,1,4.5.5Z"/>
			</svg>`;
		},

		planeTakeoffIconTrips({ color = '#44423e' } = {}) {
			return `
			<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21">
				<path fill="${color}" d="M2.78,8.82l3.28,2.31a8.37,8.37,0,0,0,3.58-.66L17.1,7.61c2.71-1-.72-1.87-3.43-.83L7.57,9.13,4.14,8.3ZM2,14H19v1H2Z"/>
				<path fill="none" stroke="${color}" d="M4.5.5h12a4,4,0,0,1,4,4v12a4,4,0,0,1-4,4H4.5a4,4,0,0,1-4-4V4.5A4,4,0,0,1,4.5.5Z"/>
			</svg>`;
		},

		calendar({ forward = false, back = false, color = '#a7a299' } = {}) {
			return forward ? `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18">
				<path fill="${color}" d="M16.93,1.64H15V.12H14V1.64H6V.12H5V1.64H3a3,3,0,0,0-3,3v9.75a3,3,0,0,0,3,3H16.93a3,3,0,0,0,3-3V4.64A3,3,0,0,0,16.93,1.64ZM3,2.64H5V3.75H6V2.64h8V3.75h1V2.64h1.93a2,2,0,0,1,2,2v.68H1V4.64A2,2,0,0,1,3,2.64ZM16.93,16.39H3a2,2,0,0,1-2-2V6.32H18.93v8.07A2,2,0,0,1,16.93,16.39Z"/>
				<polygon fill="${color}" points="13.42 8.66 12.71 9.37 13.85 10.5 4.5 10.5 4.5 11.5 14.01 11.5 12.71 12.8 13.42 13.51 15.85 11.08 13.42 8.66" />
			</svg>` : back ? `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18">
				<path fill="${color}" d="M16.93,1.64H15V.12H14V1.64H6V.12H5V1.64H3a3,3,0,0,0-3,3v9.75a3,3,0,0,0,3,3H16.93a3,3,0,0,0,3-3V4.64A3,3,0,0,0,16.93,1.64ZM3,2.64H5V3.75H6V2.64h8V3.75h1V2.64h1.93a2,2,0,0,1,2,2v.68H1V4.64A2,2,0,0,1,3,2.64ZM16.93,16.39H3a2,2,0,0,1-2-2V6.32H18.93v8.07A2,2,0,0,1,16.93,16.39Z"/>
				<polygon fill="${color}" points="7.35 9.3 6.65 8.59 4.15 11.08 6.65 13.57 7.35 12.87 5.99 11.5 15.5 11.5 15.5 10.5 6.15 10.5 7.35 9.3" />
			</svg>` : `
			<svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18">
				<path fill="${color}" d="M16.93,1.64H15V.12H14V1.64H6V.12H5V1.64H3a3,3,0,0,0-3,3v9.75a3,3,0,0,0,3,3H16.93a3,3,0,0,0,3-3V4.64A3,3,0,0,0,16.93,1.64ZM3,2.64H5V3.75H6V2.64h8V3.75h1V2.64h1.93a2,2,0,0,1,2,2v.68H1V4.64A2,2,0,0,1,3,2.64ZM16.93,16.39H3a2,2,0,0,1-2-2V6.32H18.93v8.07A2,2,0,0,1,16.93,16.39Z"/>
			</svg>`;
		},

		borderArrowTop({ borderColor = '#979797', arrowColor = '#44423e', background = '#fff' } = {}) {
			return `
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
					<path d="M6.5.5h37a6,6,0,0,1,6,6v37a6,6,0,0,1-6,6H6.5a6,6,0,0,1-6-6V6.5A6,6,0,0,1,6.5.5Z" fill="${background}" stroke="${borderColor}" fill-rule="evenodd"/>
					<path d="M13.87,25,25,13.87,36.13,25M25,14.23V36.49" fill="none" stroke="${arrowColor}" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
				</svg>
				`;
		}

	};

	const SendGA = {

		_track() {
			// console.log( 'track GA: ', ...arguments )
			if (typeof ga == 'function') ga(...arguments);
		},

		event({ eventCategory, eventAction, eventLabel, eventValue, fieldsObject }) {
			this._track('send', 'event', eventCategory, eventAction, eventLabel, eventValue, fieldsObject);
		},

		pageview({ page }) {
			this._track('send', 'pageview', page);
		},

		userID(userID) {
			this._track('send', 'userId', userID);

			// Setting the userId doesn't send data to Google Analytics.
			// So we can also use a pageview or event to send the data.
			this.event({
				eventCategory: 'authentication',
				eventAction: 'user-id available'
			});
		},

		logout() {
			this._track('send', 'userId', null);
		}

	};

	const Track = {

		auth(userID) {
			SendGA.userID(userID);
			if (window.facbookPixelID && typeof fbq === 'function') {
				fbq('init', window.facbookPixelID.toString(), { uid: userID });
			}
		}

	};

	const modalOverlayAnimation = `

	@keyframes modal-overlay-anim-in {
		0% {
			opacity: 0;
		}
		100%{
			opacity: 1;
		}
	}

	@keyframes modal-overlay-anim-out {
		0% {
			opacity: 1;
		}
		100%{
			opacity: 0;
		}
	}

	@keyframes modal-bouncing-in {
		0% {
			visibility: hidden;
			opacity: 0;
			transform: scale(.8) translate3d(0, 0, 0);
		}
		65.5% {
			transform: scale(1.03) translate3d(0, 0, 0);
		}
		100%{
			visibility: visible;
			opacity: 1;
			transform: scale(1) translate3d(0, 0, 0);
		}
	}

	@keyframes modal-bouncing-out {
		0% {
			visibility: visible;
			opacity: 1;
			transform: scale(1) translate3d(0, 0, 0);
		}
		65% {
			opacity: 0.7;
			transform: scale(1) translate3d(0, 35px, 0);
		}
		100%{
			visibility: hidden;
			opacity: 0;
			transform: scale(1) translate3d(0, 35px, 0);
		}
	}
	`;

	const styleTagOverlay = document.createElement('style');
	styleTagOverlay.type = 'text/css';
	styleTagOverlay.appendChild(document.createTextNode(modalOverlayAnimation));
	document.head.appendChild(styleTagOverlay);

	// slideInRight

	const cssjs$2 = {
		'display': 'block',
		'position': 'fixed',
		'top': '0',
		'bottom': '0',
		'right': '0',
		'left': '0',
		'margin': 'auto',
		'display': 'block',
		'overflow': 'auto',
		'z-index': '100',
		'-webkit-overflow-scrolling': 'touch',

		'&.anim-in': {
			'.modal-overlay': {
				'animation-name': 'modal-overlay-anim-in',
				'animation-duration': FX.speed.fast,
				'animation-timing-function': 'ease',
				'animation-fill-mode': 'forwards'
			},

			'.mw-modal': {
				// BOUNCING
				'&.bouncing': {
					'.modal-inner': {
						'animation-name': 'modal-bouncing-in',
						'animation-duration': FX.speed.fast,
						'animation-timing-function': 'ease',
						'animation-fill-mode': 'forwards'
					},
					'.modal-content': {
						'transition-delay': FX.speed.fast,
						'opacity': '1'
					}
				},
				// SLIDE-IN-LEFT
				'&.slide-in-left': {
					'transform': 'translate3d(0,0,0)',
					'transition-duration': '0.3s',
					'transition-timing-function': 'cubic-bezier(0.68, 0.11, 0.4, 1.02)'
				}
			}
		},

		'&.anim-out': {
			'.modal-overlay': {
				'animation-name': 'modal-overlay-anim-out',
				'animation-duration': '.25s',
				'animation-timing-function': 'ease',
				'animation-fill-mode': 'forwards'
			},

			'.mw-modal': {
				// BOUNCING
				'&.bouncing': {
					'.modal-inner': {
						'animation-name': 'modal-bouncing-out',
						'animation-duration': '.25s',
						'animation-timing-function': 'ease',
						'animation-fill-mode': 'forwards'
					},
					'.modal-content': {
						'transition-delay': '0',
						'opacity': '0'
					}
				},
				// SLIDE-IN-LEFT
				'&.slide-in-left': {
					'transform': 'translate3d(100%,0,0)',
					'transition-duration': FX.speed.fast,
					'transition-timing-function': 'ease'
				}
			}
		},

		'.modal-overlay': {
			'z-index': '1',
			'position': 'fixed',
			'top': '50%',
			'left': '50%',
			'transform': 'translate3d(-50%, -50%, 0)',
			'width': '200%',
			'height': '200%',
			'background-color': 'rgba(0, 0, 0, 0.5)',
			'opacity': '0'
		},

		'.mw-modal': {
			'position': 'fixed',
			'top': '0',
			'bottom': '0',
			'right': '0',
			'left': '0',
			'margin': 'auto',
			'display': 'block',
			'overflow': 'auto',
			'z-index': '1',
			'-webkit-overflow-scrolling': 'touch',

			'.modal-outer': {
				'position': 'relative',
				'top': '0',
				'bottom': '0',
				'left': '0',
				'right': '0',
				'margin': 'auto',
				'display': 'flex',
				'min-height': '100vh',
				'align-content': 'center',
				'align-items': 'center'
			},
			'.modal-inner': {
				'position': 'relative',
				'width': '100%'
			},

			// BOUNCING
			'&.bouncing': {
				'.modal-inner': {
					'opacity': '0',
					'transform': 'scale(.8) translate3d(0, 0, 0)',
					'border-radius': FX.radiusMedium
				},
				'.modal-content': {
					'opacity': '0',
					'transform': 'scale(1) translate3d(0, 0, 0)',
					'transition-duration': FX.speed.fast,
					'transition-property': 'opacity, transform'
				}
			},
			// SLIDE-IN-LEFT
			'&.slide-in-left': {
				'transform': 'translate3d(100%,0,0)',
				'transition-duration': '0.3s'
				// 'transition-timing-function': 'cubic-bezier(1, 0.06, 0.58, 1.08)',
				// 'transition-timing-function': 'cubic-bezier(0.68, 0.11, 0.4, 1.02)',
			},

			'&.menu-bar': {
				'.modal-outer': {
					'background-color': COLOR.light,
					'align-items': 'flex-start'
				},
				'.modal-header': {
					'min-height': '200px',
					'padding': '0',
					'background': 'url("https://jetsmarter.com/data/site-v5/assets/common/mobile-menu.jpg") no-repeat 50% 50% / cover'
				},
				'.modal-body': {
					'padding': '10px 0 0'
				},
				'.menu-bar-link-wrap': {
					'h5': {
						'&:nth-child(1)': { 'font-weight': '400' },
						'&:nth-child(2)': { 'font-weight': '400' },
						'&:nth-child(3)': { 'font-weight': '400' },
						'&:nth-child(4)': { 'font-weight': '400', 'margin': '0 0 40px' }
					}
				},
				'.menu-bar-link': {
					'color': COLOR.dark,
					'text-decoration': 'none',
					'display': 'block',
					'margin': '0 0 20px',
					'&.active': {
						color: COLOR.primary
					}
				},
				'.mw-close': {
					'z-index': '1',
					'padding': '0',
					'display': 'flex',
					'justify-content': 'flex-end',
					'position': 'absolute',
					'right': '20px',
					'top': '20px',
					'button': {
						'background': 'transparent',
						'border': 'none',
						'-webkit-appearance': 'none',
						'-moz-appearance': 'none',
						'appearance': 'none',
						'-webkit-tap-highlight-color': 'transparent',
						'outline': 'none',
						'cursor': 'pointer',
						'padding': '0',
						'margin': '0'
					},
					'svg': {
						'path': {
							'stroke': COLOR.white
						}
					}
				}
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$4 = instance.define({
		name: 'modal-layer', cssjs: cssjs$2
	});

	let currentModal;
	let currentTop;
	let currentWindowLocation = window.location.pathname;

	class ModalLayer extends BMPVDWebComponent {

		constructor() {
			super();
			window.addEventListener('popstate', this.close.bind(this));
		}

		static show({ modal: modal } = {}) {
			currentTop = Math.round(window.pageYOffset);
			let jsApp = document.querySelector('jetsmarter-app');
			jsApp.style.top = `${-currentTop}px`;
			jsApp.classList.add('mw-is-open');
			currentModal = modal;

			let modalLayerElement = document.createElement('modal-layer');
			document.body.appendChild(modalLayerElement);

			return modalLayerElement;
		}

		onAttached() {
			this.setAttribute('tabindex', '0');
			this.focus();

			window.addEventListener("keydown", e => {
				if (e.keyCode == 27) this.close();
				if (typeof this.onclose === 'function') this.onclose();
			}, false);

			setTimeout(() => {
				this.classList.add('anim-in');
			}, 0);
		}

		removeModal() {
			if (!Element.prototype.remove) {
				Element.prototype.remove = function remove() {
					if (this.parentNode) {
						this.parentNode.removeChild(this);
					}
				};
			} else {
				this.remove(this);
			}
		}

		closeModal() {
			let jsApp = document.querySelector('jetsmarter-app');
			jsApp.classList.remove('mw-is-open');
			window.scrollTo(0, currentTop);
			jsApp.removeAttribute('style');
			this.removeModal();
			currentModal = null;
		}

		close() {
			this.classList.add('anim-out');
			if (window.location.pathname != currentWindowLocation) {
				currentWindowLocation = window.location.pathname;
				currentTop = 0;
				setTimeout(() => {
					this.closeModal();
				}, 300);
			} else {
				setTimeout(() => {
					this.closeModal();
				}, 300);
			}
		}

		ready() {
			// this.context = this.observe({ show: false, })
			bmpCssComponent$4.attachStyles(this);
			return Promise.resolve();
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.close.bind(this));
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'mw' },
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'modal-overlay', onClick: e => this.close() }),
				currentModal
			);
		}
	}

	customElements.define('modal-layer', ModalLayer);

	const menusList = [[{ title: 'Book', link: '/' }, { title: 'How it Works', link: '/how-it-works/' }, { title: 'The Experience', link: '/experience/' }, { title: 'Community', link: '/reviews/' }, { title: 'Download The App', link: '/download/' }], [{ title: 'Company', link: '/about/' }, { title: 'News', link: '/news/' }, { title: 'Blog', link: '/blog/' }, { title: 'Career', link: '/career/' }, { title: 'Fleet', link: '/fleet/' }], [{ title: 'All Routes', link: '/flights/', strict: true }, { title: 'Safety & Security', link: '/safety-security/' }, { title: 'FAQ', link: '/faq/' }, { title: 'Legal', link: '/legal/' }, { title: 'Contact Us', link: '/contact-us/' }]];

	const navBarMenusList = [{ title: 'Book', link: '/' }, { title: 'How it Works', link: '/how-it-works/' }, { title: 'The Experience', link: '/experience/' }, { title: 'Community', link: '/reviews/' }, { title: 'Download The App', link: '/download/' }, { title: 'Company', link: '/about/' }, { title: 'News', link: '/news/' }, { title: 'Blog', link: '/blog/' }, { title: 'Career', link: '/career/' }, { title: 'Fleet', link: '/fleet/' }, { title: 'All Routes', link: '/flights/', strict: true }, { title: 'Safety & Security', link: '/safety-security/' }, { title: 'FAQ', link: '/faq/' }, { title: 'Legal', link: '/legal/' }, { title: 'Contact Us', link: '/contact-us/' }];

	const cssjs$3 = {
		'display': 'block',
		'position': 'relative',
		'padding': '20px 0 0 ',

		'.user': {
			'min-height': '100px'
		},
		'.user-is-auth': {
			'display': 'flex',
			'align-items': 'center',
			'flex-wrap': 'wrap',
			'padding': '0 0 30px'
		},
		'.user-name': {
			'font-size': '32px',
			'line-height': '30px',
			'font-weight': '300',
			'color': COLOR.white,
			'font-family': FONT.secondary,
			'padding': '0 0 20px'
		},
		'.user-avatar-wrapper': {
			'padding': '0 0 20px'
		},
		'.user-avatar': {
			'width': '70px',
			'height': '70px',
			'overflow': 'hidden',
			'display': 'block',
			'position': 'relative',
			'margin-right': '20px',
			'border-radius': FX.radius.small,
			'img': {
				'position': 'absolute',
				'width': '100%',
				'height': 'auto',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)'
			}
		},
		'.user-info': {
			'width': '100%',
			'padding': '0 0 0'
		},
		'.user-info-lines': {
			'display': 'flex',
			'p': {
				'text-transform': 'capitalize'
			}
		},
		'bmp-anchor': {
			'display': 'block',
			'margin': '0 0 20px',
			'a': {
				'cursor': 'pointer',
				'font-family': 'Roboto, sans-serif',
				'color': COLOR.white,
				'font-weight': '400',
				'font-size': '24px',
				'padding': '0',
				'margin': '0',
				'text-decoration': 'none',
				'transition-duration': FX.speed.fast,
				'&:hover': {
					'color': COLOR.primary,
					'transition-duration': FX.speed.fast
				},
				'&.active': {
					'color': COLOR.primary,
					'transition-duration': FX.speed.fast
				}
			}
		},
		'.menu-bar-link': {
			'&.active': {
				color: COLOR.primary
			}
		},
		'.btn-text': {
			'background': 'transparent',
			'border': 'none',
			'-webkit-appearance': 'none',
			'-moz-appearance': 'none',
			'appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'outline': 'none',
			'cursor': 'pointer',

			'border': `1px solid ${COLOR.white}`,
			'font-family': 'Roboto, sans-serif',
			'color': COLOR.white,
			'text-align': 'center',
			'font-weight': '400',
			'font-size': '20px',
			'padding': '0',
			'margin': '0 5px 10px 0',
			'height': '35px',
			'width': '152px',
			'line-height': '35px',
			'border-radius': '6px',
			'font-family': 'Roboto',
			'font-weight': '300',

			'&.primary': {
				'color': COLOR.primary,
				'border': `1px solid ${COLOR.primary}`
			}
		}
	};

	const ReactCaller$1 = {

		callbacks: [],

		run(fn, ...args) {
			if (!("ReactApp" in window)) {
				// console.log( 'await run', this )
				this.callbacks.push({ fn, args });
			} else {
				// console.log( 'immediately run' )
				window.ReactApp[fn](...args);
			}
		},

		load() {

			const log = this.callbacks.map(({ fn, args }) => {
				return window.ReactApp[fn](...args);
			});
			// console.log( 'ReactAppLoaded', log )
		}

	};

	window.ReactAppLoaded = () => ReactCaller$1.load();

	const getUserLocation = () => {
		// return {// for tests
		// 	"IP": "173.255.189.42",
		// 	"City": "Miami",
		// 	"Continent": "Florida",
		// 	"Country": "United States",
		// 	"ISO": "FL",
		// 	"Latitude": 25.7806,
		// 	"Longitude": -80.1826,
		// 	"TimeZone": "US/Florida"
		// }


		// const res = await fetch( '/geo/my' )
		// const resJSON = await res.json()
		// return resJSON

		try {
			const res = document.getElementById('geoip').value;
			return JSON.parse(res);
		} catch (e) {
			return {};
		}
	};
	const storedGeoIp = getUserLocation();

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$5 = instance.define({
		name: 'modal-menu-bar-user', cssjs: cssjs$3
	});

	class ModalMenuBarUser extends BMPVDWebComponent {

		constructor() {
			super();
			this.reactEl = document.getElementById('reactmodal');
		}

		onAttached() {
			// ReactCaller.run('userInfo', this.querySelector('#reactuser'), bmpStorageInstance)
		}

		ready() {
			bmpCssComponent$5.attachStyles(this);

			this.subID = instance$1.subscribe('user', user => {
				this.context.user = user;
			});

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				pending: false
			});

			return Promise.resolve();
		}

		handleLoginClick() {
			ReactCaller$1.run('modal', this.reactEl, instance$1, 'login');
		}

		handleSignupClick() {
			ReactCaller$1.run('modal', this.reactEl, instance$1, 'signup');
		}

		async logoutUser() {
			await instance$1.postRequest('logout');
			instance$1.setToStorage('user', { isAuthorized: false });
		}

		render() {
			let { user } = this.context;

			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'user' },
						user && user.isAuthorized ? BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'user-is-auth' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'user-avatar-wrapper' },
								BMPVD.createBMPVirtulaDOMElement('div', { className: 'user-avatar', style: `background: url('${user.avatar_url || "https://jetsmarter.com/data/site-v5/assets/ui-icon/avatar.gif"}') no-repeat 50% 50% / cover;` })
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'user-name' },
								user.name
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'user-info' },
								user.userInfoLines ? user.userInfoLines.map(el => BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'user-info-lines' },
									text(`color: ${COLOR.white}; font-weight: 300;`, `${Object.keys(el).toString().toLowerCase()}:`),
									'\xA0',
									text(`color: ${COLOR.white}; font-weight: 400;`, `${Object.values(el).toString().toLowerCase()}`)
								)) : null
							)
						) : BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'user-no-auth' },
							h5(`color: ${COLOR.white}; padding: 0 0 40px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Please log in or create an\xA0account to\xA0start\xA0booking'
							))
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'user-controls' },
						user && user.isAuthorized ? BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							user.needIdVerification && !storedGeoIp.is_gdpr ? BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ style: 'display: inline-block; margin-right: 28px;', 'class': (isActive('/profile/verify/', true) ? 'active ' : '') + '', href: '/profile/verify/' },
									'ID Verification'
								)
							) : null,
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ style: 'display: inline-block; margin-right: 28px;', 'class': (isActive('/profile/', true) ? 'active ' : '') + '', href: '/profile/' },
									'Edit profile'
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ style: 'display: inline-block; margin-right: 28px;', 'class': (isActive('/profile/payment-methods/') ? 'active ' : '') + '', href: '/profile/payment-methods/' },
									'Payment Method'
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ style: 'display: inline-block; margin-right: 28px;', 'class': (isActive('/my-trips/') ? 'active ' : '') + '', href: '/my-trips/' },
									'My Trips'
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ style: 'display: inline-block;', onClick: e => this.logoutUser() },
									'Log out'
								)
							)
						) : BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'button',
								{ className: 'btn-text', onClick: e => this.handleLoginClick() },
								'Log In'
							),
							BMPVD.createBMPVirtulaDOMElement(
								'button',
								{ className: 'btn-text primary', onClick: e => this.handleSignupClick() },
								'Create Account'
							)
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						null,
						h5(`color: ${COLOR.white}; padding: 30px 0 10px`, BMPVD.createBMPVirtulaDOMElement(
							'span',
							null,
							'We are available to\xA0assist\xA0you\xA024/7 via phone\xA0at\xA0',
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: 'tel:+18889VIPJET', style: `color: ${COLOR.primary}; text-decoration: none; white-space: nowrap;` },
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ className: 'notranslate' },
									'+1 (888) 9-VIP-JET'
								)
							),
							'.'
						))
					)
				)
			);
		}

		disconnectedCallback() {
			instance$1.unsubscribe('user', this.subID);
		}
	}

	customElements.define('modal-menu-bar-user', ModalMenuBarUser);

	// <div class={`inline preloader ${this.context.pendingTrips ? '' : 'hidden'}`} safeHTML={svgIcon.preloader()} ></div>

	var _extends$5 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	class ModalMenuBar {

		constructor() {}

		show({ JSXContent = null, animateName = '', modClass = '' } = {}) {

			this.modalLayer = ModalLayer.show({
				modal: [BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: `mw-modal menu-bar ${animateName}` },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'modal-outer' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'modal-inner' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'modal-content' },
								JSXContent,
								ME.container({
									mod: { className: 'modal-header' },
									children: [ME.layout.grid({
										children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
											children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
												'div',
												null,
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'mw-close' },
													BMPVD.createBMPVirtulaDOMElement('button', { onClick: this.cancel.bind(this), safeHTML: svgIcon.closeSmall() })
												),
												BMPVD.createBMPVirtulaDOMElement('modal-menu-bar-user', null)
											))]
										}))]
									})]
								}),
								ME.container({
									mod: { className: 'modal-body' },
									children: [ME.layout.grid({
										children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
											children: [ME.layout.cell({ common: 12, tablet: 12, align: 'bottom' }, BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'menu-bar-link-wrap' },
												navBarMenusList.map(({ link, title, strict, params }) => params ? h5('', BMPVD.createBMPVirtulaDOMElement(
													'a',
													_extends$5({}, params, { 'class': (isActive(link, strict ? true : false) ? 'active ' : '') + 'menu-bar-link', href: link }),
													title
												)) : h5('', BMPVD.createBMPVirtulaDOMElement(
													'bmp-anchor',
													null,
													BMPVD.createBMPVirtulaDOMElement(
														'a',
														{ 'class': (isActive(link, strict ? true : false) ? 'active ' : '') + 'menu-bar-link', href: link },
														title
													)
												)))
											))]
										}))]
									})]
								})
							)
						)
					)
				)]
			});

			this.modalLayer.onclose = () => {
				this.promoseRejecter();
			};
			return new Promise((res, rej) => {
				this.promiseResolver = () => {
					res();
				};
				this.promoseRejecter = () => {
					rej();
				};
			});
		}

		confirm() {
			this.promiseResolver();
			this.modalLayer.close();
		}

		cancel() {
			this.promoseRejecter();
			this.modalLayer.close();
		}
	}

	const cssjs$4 = {
		'display': 'block',
		'top': '0',
		'left': '0',
		'width': '100%',
		'z-index': 7,
		'position': 'fixed',
		'height': '57px',
		'display': 'flex',
		'align-items': 'center',
		'transition-duration': '.25s',

		'&:after': {
			'content': '',
			'display': 'block',
			'width': '100%',
			'position': 'absolute',
			'height': '57px',
			'opacity': '0',
			'transition-duration': '.25s',
			'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px'
		},

		'&:before': {
			'content': '',
			'display': 'block',
			'width': '100%',
			'position': 'absolute',
			'height': '57px',
			'background-color': '#fff',
			'opacity': '0',
			'transition-duration': '.25s'
		},

		'&.hide-header': {
			'display': 'none',
			'&.shadow': {
				'display': 'none'
			}
		},

		'&.shadow': {
			'transition-duration': '.25s',
			'background-color': '#fff',
			// 'position': 'fixed !important',
			// 'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px',

			'&:after': {
				'opacity': '1'
			},

			// '&:before': {
			// 	'opacity': '1',
			// },

			'nav': {
				'a': {
					'color': COLOR.dark
				}
			},
			'.open-modal-btn': {
				'color': COLOR.dark
			},
			'i': {
				'color': COLOR.lightBorder
			},
			'.mobile-navigation': {
				'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px'
			}
		},

		'.heading-inner': {
			'width': '100%'
		},
		// 'min-height': '150px',
		// '&.relative': {
		// 	position: 'relative',
		// },
		//'&:after': {
		//	'content': '""',
		//	'min-height': '90px',
		//	'display': 'block',
		//	'position': 'absolute',
		//	'top': 0,
		//	'left': 0,
		//	'width': '100%',
		//	'background': '-moz-linear-gradient(top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
		//	'background': '-webkit-linear-gradient(top, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
		//	'background': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 100%)',
		//},
		'.nav': {
			'display': 'flex',
			'justify-content': 'space-between',
			'bmp-anchor': {
				'a': {
					color: COLOR.dark
				}
			},
			'bmp-anchor': {
				'&:first-child': {
					'a': {
						'margin-right': '65px'
					}
				},
				'&:last-child': {
					'a': {
						'margin-right': '0'
					}
				},
				'a.brand': {
					'margin-right': 'auto'
				}
			}
		},
		nav: {
			'z-index': '1',
			'position': 'relative',
			'padding': '0 10px',
			'a': {
				'display': 'inline-block',
				'margin-right': '20px',
				'font-family': 'Roboto, sans-serif',
				'font-weight': 400,
				'color': '#fff',
				'font-size': '15px',
				'text-decoration': 'none',
				'transition-duration': '.25s',
				'&:hover': {
					'transition-duration': '.25s',
					'color': COLOR.primary
				},
				'&.active': {
					'color': COLOR.primary
				}
			}
		},
		'.brand': {
			'width': '214px',
			'height': '41px',
			'margin': '46px auto 0',
			'display': 'block',
			'&:hover': {
				'svg': {
					'transition-duration': '.25s',
					'transform': 'scale(1.1)'
				}
			},
			'svg': {
				'transition-duration': '.25s',
				'width': '100%'
			}
		},
		'.auth-link': {
			'position': 'relative',
			'display': 'flex',
			'justify-content': 'flex-end'
		},
		'.auth-link-sign': {
			'a': {
				'color': `${COLOR.primary}`
			}
		},
		'i': {
			'font-style': 'normal',
			'display': 'inline-block',
			'font-family': `'Roboto', sans-serif`,
			'font-weight': 300,
			'color': COLOR.light,
			'font-size': '13px',
			'text-decoration': 'none',
			'line-height': '18px'
		},
		'.tooltip': {
			'position': 'absolute',
			'color': COLOR.white,
			'right': "0",
			'top': '100%',
			'background-color': 'rgba(0, 0, 0, 0.43)',
			'padding': '14px 30px 14px 14px',
			'border-radius': '6px',
			'font-family': 'Roboto',
			'font-size': '13px',
			'transform': 'translate(0, 10px)',
			'opacity': '0',
			'visibility': 'hidden',
			'transition-duration': '0.25s',

			'&:before': {
				'content': '',
				'width': '0',
				'height': '0',
				'border-left': '6px solid transparent',
				'border-right': '6px solid transparent',
				'border-bottom': '6px solid rgba(0, 0, 0, 0.43)',
				'position': 'absolute',
				'top': '0',
				'right': '12px',
				'transform': 'translate(0, -100%)'
			}
		},
		'bmp-anchor:hover + .tooltip': {
			'opacity': '1',
			'visibility': 'visible',
			'transition-duration': '0.25s'
		},
		'.auth-link-login': {
			'display': 'inline-block',
			// 'margin-left': '20px',

			'a': {
				'margin-right': 0
			}
		},
		'.auth-user': {
			'position': 'relative',
			'text-align': 'right',
			'.user-link': {
				'margin-right': 0,
				'color': `${COLOR.primary}`
			},
			'bmp-anchor': {
				'a': {
					'&.active': {
						'color': `${COLOR.primary}`
					}
				}
			},
			'.user-avatar': {
				'width': '26px',
				'height': '26px',
				'background-size': 'cover',
				'background-position': '50% 50%',
				'background-repeat': 'no-repeat',
				'border-radius': '6px',
				'display': 'inline-block',
				'vertical-align': 'middle',
				'position': 'absolute',
				'top': '0',
				'right': '0',
				'margin': 'auto',
				'bottom': '0'
			},
			// 'img': {
			// 	'width': '26px',
			// 	'height': '26px',
			// 	'border-radius': '6px',
			// 	'display': 'inline-block',
			// 	'vertical-align': 'middle',
			// 	'position': 'absolute',
			// 	'top': '0',
			// 	'right': '0',
			// 	'margin': 'auto',
			// 	'bottom': '0',
			// },
			'.user-name': {
				'display': 'inline-block',
				'vertical-align': 'middle',
				'margin-right': '36px'
			}
		},
		'.open-modal-btn': {
			'font-family': 'Roboto, sans-serif',
			'font-size': '15px',
			'color': '#fff',
			'border': 'none',
			'font-weight': '400',
			'padding': '0',
			'margin': '0',
			'cursor': 'pointer',
			'background': 'transparent',
			'-webkit-appearance': 'none',
			'-moz-appearance': 'none',
			'appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'outline': 'none',
			'transition-duration': '0.25s',
			'border-bottom': `1px solid transparent`,

			'&:hover': {
				'border-bottom': `1px solid ${COLOR.primary}`,
				'transition-duration': '0.25s',
				'color': `${COLOR.primary}`
			},

			'&.auth-link-sign': {
				'margin-right': '15px',
				'color': `${COLOR.primary}`
			},

			'&.auth-link-login': {
				'display': 'inline-block',
				'margin-left': '15px'
			}
		},

		'.mobile-navigation': {
			'justify-content': 'center',
			'align-items': 'center',
			'width': "100%",
			'position': 'absolute',
			'background': "#fff",
			'top': '0',
			'left': '0',
			'padding': '0 10px',
			'height': '57px',
			'display': 'none',

			'.mobile-search': {
				'display': 'block',
				'position': 'absolute',
				'left': '20px',
				'top': '50%',
				'-webkit-transform': 'translate3d(0, -50%, 0)',
				'transform': 'translate3d(0, -50%, 0)',
				'bottom': '0',
				'margin': '0 auto',
				'height': '100%',
				'&:before': {
					display: 'inline-block',
					'vertical-align': 'middle',
					content: '',
					height: '100%'
				},
				svg: {
					display: 'inline-block',
					'vertical-align': 'middle'
				}
			},

			'.mobile-logo': {
				'a': {
					'margin-right': '0'
				},
				'svg': {
					'width': '131px',
					'path': {
						'fill': COLOR.lightBorder
					}
				}
			},
			'.mobile-hamburger': {
				'position': 'absolute',
				'top': '0',
				'bottom': '0',
				'margin': 'auto',
				'right': '20px',
				'cursor': 'pointer',
				'width': '22px',
				'height': '17px'
			},

			'.mobile-avatar': {
				display: 'none',
				'position': 'absolute',
				'right': '0',

				'a': {
					'display': 'flex',
					'align-items': 'center'
				},
				'img': {
					'width': '26px',
					'height': '26px',
					'border-radius': '6px'
				}
			}
		},

		'.nav-pages-link': {
			'.phone-call': {
				'margin-right': '0',
				'margin-left': '45px'
			}
		},

		'@media (max-width: 900px)': {
			'.nav-pages-link': {
				'.phone-call': {
					'margin-left': '0'
				}
			},
			'.nav': {
				'bmp-anchor': {
					'&:first-child': {
						'a': {
							'margin-right': '20px'
						}
					}
				}
			}
		},

		'@media (max-width: 839px)': {
			'.nav-pages-link': {
				'.phone-call': {
					'display': 'none'
				}
			}
		},

		'@media (max-width: 700px)': {
			'.nav-pages-link': {
				'bmp-anchor': {
					'display': 'none',
					'&:first-child': {
						'display': 'block'
					}
				}
			}
		},

		'@media (max-width: 479px)': {
			'height': 'auto',
			'&:after': {
				display: 'none'
			},
			'.nav': {
				'display': 'none'
			},
			'.mobile-navigation': {
				'display': 'flex'
			},
			'.brand': {
				'display': 'none'
			}
		},
		'#web-cinderella': {
			'background': COLOR.primary,
			'position': 'relative',
			'padding': '5px 20px',
			'text-align': 'right',
			'z-index': '1'
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const default_avatar_url = 'https://jetsmarter.com/data/site-v5/assets/ui-icon/avatar.gif';
	let bmpCssComponent$6 = instance.define({
		name: 'jet-header', cssjs: cssjs$4
	});

	const app = document.querySelector('jetsmarter-app');
	let targetOffset = app.offsetTop;

	class JetHeader extends BMPVDWebComponent {
		constructor() {
			super();
			this.reactEl = document.getElementById('reactmodal');
			this.updateUser = user => {
				if (user.isAuthorized) Track.auth(user.id);else SendGA.logout();

				this.context.user = user;
			};
		}

		disconnectedCallback() {
			instance$1.unsubscribe('user', this.subID);

			window.cancelAnimationFrame(this.raf);
			window.cancelAnimationFrame(this.refReqAnimFrame);
			window.removeEventListener('resize', this.refHandleWindowResize);
			window.removeEventListener('scroll', this.refHandleWindowScroll);
		}

		onAttached() {
			this.context.hideLogo = this.hasAttribute('hide-logo');
			this.context.lineBg = this.hasAttribute('line-bg');
			this.subID = instance$1.subscribe('user', this.updateUser);

			this.refReqAnimFrame = this.checkSticky.bind(this);
			this.refHandleWindowScroll = this.handleWindowScroll.bind(this);
			this.refHandleWindowResize = this.handleWindowResize.bind(this);

			window.addEventListener('resize', this.refHandleWindowResize, false);
			window.addEventListener('scroll', this.refHandleWindowScroll, { passive: true });
		}

		checkSticky() {
			const scrolled = window.pageYOffset;
			if (scrolled > targetOffset && !this.classList.contains('shadow')) {
				this.classList.add('shadow');
			} else if (scrolled <= targetOffset && this.classList.contains('shadow')) {
				this.classList.remove('shadow');
			}
			if (app.classList.contains('mw-is-open')) {
				this.classList.add('shadow');
			}
		}

		handleWindowScroll() {
			this.raf = window.requestAnimationFrame(this.refReqAnimFrame);
		}

		handleWindowResize() {
			targetOffset = app.offsetTop;
			this.checkSticky();
		}

		ready() {

			instance$1.conf = { host: window.apiGateway };
			bmpCssComponent$6.attachStyles(this);

			this.classList.add('hidenav');

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				hideLogo: this.hasAttribute('hide-logo'),
				lineBg: this.hasAttribute('line-bg')
			});
			if (!this.context.user && !window.IS_SSR) this.getUser();
		}

		async getUser() {
			const response = await instance$1.getRequest('getprofile');
			const user = JSON.parse(response);
			if (user && user.client) {
				user.client.isAuthorized = true;
				this.context.user = user.client;
				instance$1.setToStorage('user', user.client);
			} else {
				instance$1.setToStorage('user', { isAuthorized: false });
			}
		}

		handleClick() {
			ReactCaller$1.run('modal', this.reactEl, instance$1);
		}

		handleLoginClick() {
			ReactCaller$1.run('modal', this.reactEl, instance$1, 'login');
		}

		handleSignupClick() {
			ReactCaller$1.run('modal', this.reactEl, instance$1, 'signup');
		}

		handleProfileClick() {
			ReactCaller$1.run('offcanvasProfile', this.reactEl, instance$1);
		}

		showMobileNav() {
			new ModalMenuBar().show({
				animateName: 'slide-in-left'
			}).then(r => {}).catch(err => {});
		}

		mobileNav() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'mobile-navigation' },
				BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					{ className: 'mobile-search' },
					BMPVD.createBMPVirtulaDOMElement('a', { href: '/?focus=origin', safeHTML: svgIcon.searchHeader() })
				),
				BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					{ className: 'mobile-logo' },
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '/' },
						BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.logo() })
					)
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'mobile-hamburger', onClick: e => this.showMobileNav() },
					BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.hamburger() })
				)
			);
		}

		desktopNav() {
			const { user } = this.context;
			return user && user.isAuthorized ? BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'auth-user' },
				BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ style: 'margin-right: 27px;', 'class': isActive('/my-trips/') ? 'active' : '', href: '/my-trips/' },
						'My Trips'
					)
				),
				BMPVD.createBMPVirtulaDOMElement(
					'span',
					{ 'class': 'auth-link-sign' },
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ className: 'user-link', href: '/profile/', onclick: ev => {
								ev.preventDefault();this.handleProfileClick();
							} },
						BMPVD.createBMPVirtulaDOMElement(
							'span',
							{ 'class': 'user-name' },
							user.name
						),
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'user-avatar', style: `background-image: url('${user.avatar_url || default_avatar_url}')` })
					)
				)
			) : BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'auth-link' },
				BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ className: 'open-modal-btn auth-link-sign', onclick: this.handleSignupClick.bind(this) },
					'Sign Up'
				),
				BMPVD.createBMPVirtulaDOMElement(
					'i',
					{ className: 'auth-link-divider' },
					'|'
				),
				BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ className: 'open-modal-btn auth-link-login', onclick: this.handleLoginClick.bind(this) },
					'Log in'
				),
				BMPVD.createBMPVirtulaDOMElement(
					'span',
					{ className: 'tooltip' },
					'Already a member?',
					BMPVD.createBMPVirtulaDOMElement('br', null),
					' Log in to access member pricing.'
				)
			);
		}

		render() {
			const { user } = this.context;

			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'heading-inner' },
				user && user.impersonatorId ? BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ id: 'web-cinderella' },
					textSmall('', `CINDERELLA: ${user.impersonatorName} as ${user.name} (${user.membershipTier ? user.membershipTier : 'NON MEMBER'})`)
				) : null,
				BMPVD.createBMPVirtulaDOMElement(
					'nav',
					null,
					window.hidenav ? null : ME.layout.grid({
						children: [ME.layout.cell({ common: 12, align: 'middle' }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ 'class': 'nav' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'nav-pages-link' },
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ 'class': isActive('/') ? 'active' : '', href: '/' },
											'Home'
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ 'class': isActive('/how-it-works/') ? 'active' : '', href: '/how-it-works/' },
											'How it Works'
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ 'class': isActive('/experience/') ? 'active' : '', href: '/experience/' },
											'The Experience'
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ 'class': isActive('/reviews/') ? 'active' : '', href: '/reviews/' },
											'Community'
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ className: 'phone-call', href: 'tel:+18889VIPJET' },
										BMPVD.createBMPVirtulaDOMElement(
											'span',
											{ className: 'notranslate' },
											'+1 (888) 9 VIP JET'
										)
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									null,
									this.desktopNav()
								)
							),
							this.mobileNav()
						))]
					})
				)
			);
		}

	}

	if (!customElements.get('jet-header')) customElements.define('jet-header', JetHeader);

	const safetyCompany = [{
		title: 'ARGUS',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/safety/logo-company-1.png',
		description: 'Founded in 1995, ARGUS International, Inc., is the worldwide leader in specialized aviation services that allow hundreds of organizations around the globe to improve their operational and business decision-making.'
	}, {
		title: 'WYVERN',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/safety/logo-company-2.png',
		description: 'Wyvern, the world’s first private aviation audit company, has been helping the business and private aviation industry make informed, risk-based decisions since 1991.'
	}, {
		title: 'IS-BAO',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/safety/logo-company-3.png',
		description: 'The International Standard for Business Aircraft Operations (IS-BAO) was developed in 2002 and is designed to promote high-quality operating practices for international business aircraft.'
	}];

	const safetyCompanyAll = [{
		title: 'Wyvern',
		link: 'wyvern',
		description: 'Wyvern, the world’s first private aviation audit company, has been helping the business and private aviation industry make informed, risk-based decisions since 1991. They quickly grew from a small audit company into a globally-recognized thought leader within the manned and unmanned aviation industries for safety, quality, and risk management.'
	}, {
		title: 'NBAA',
		link: 'nbaa',
		description: 'The National Business Aviation Association (NBAA) is the leading organization for companies that rely on general aviation aircraft for business. The association represents more than 11,000 companies and provides more than 100 products and services to the business aviation community.'
	}, {
		title: 'IS-BAO',
		link: 'is-bao',
		description: 'The International Standard for Business Aircraft Operations (IS-BAO) was developed in 2002 and is designed to promote high-quality operating practices for international business aircraft.'
	}, {
		title: 'ARGUS',
		link: 'argus',
		description: 'Founded in 1995, ARGUS International, Inc. is the worldwide leader in specialized aviation services that allow hundreds of organizations around the globe to improve their operational and business decision-making.'
	}, {
		title: 'EBAA',
		link: 'ebaa',
		description: 'The European Business Aviation Association (EBAA) was founded in 1977 and has more than 650 member companies across the industry, including corporate and commercial operators, aircraft manufacturers, airports, fixed-base operators, and business aviation service providers.'
	}];

	const safetyCompanyFooter = [{
		title: 'Wyvern',
		image: "https://jetsmarter.com/data/site-v5/assets/logo/wyvern.svg",
		link: '/safety-security/wyvern/'
	}, {
		title: 'NBAA',
		image: "https://jetsmarter.com/data/site-v5/assets/logo/nbaa.svg",
		link: '/safety-security/nbaa/'
	}, {
		title: 'IS-BAO',
		image: "https://jetsmarter.com/data/site-v5/assets/logo/isbao.svg",
		link: '/safety-security/is-bao/'
	}, {
		title: 'ARGUS',
		image: "https://jetsmarter.com/data/site-v5/assets/logo/argus.svg",
		link: '/safety-security/argus/'
	}, {
		title: 'EBAA',
		image: "https://jetsmarter.com/data/site-v5/assets/logo/ebaa.svg",
		link: '/safety-security/ebaa/'
	}];

	var _extends$6 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	let bmpCssComponent$7 = instance.define({
		name: 'jet-footer',
		cssjs: {
			'-webkit-transition': 'opacity .3s',
			'transition': 'opacity .3s',
			'display': 'block',
			'background-color': `${COLOR.dark}`,
			'padding': '50px 0px',

			'.footer-link': {
				'font-size': '13px',
				'line-height': '20px',
				'font-weight': 400,
				'color': `${COLOR.light}`,
				'display': 'block',
				'text-decoration': 'none',
				'font-family': 'Roboto',
				'transition-duration': '.25s',
				'&:hover': {
					'transition-duration': '.25s',
					'color': COLOR.primary
				},
				'&.active': {
					'color': COLOR.primary
				}
			},

			'.footer-top-block': {
				'padding': '0 0 30px'
			},

			'.site-button-item': {
				'display': 'block',
				'width': '100%',
				'max-width': '200px',
				'min-width': '200px',
				'outline': 'none',
				'height': '30px',
				'padding': '0',
				'border': '0',
				'border-radius': '6px',
				'font-size': '11px',
				'cursor': 'pointer',
				'font-family': 'Roboto',
				'line-height': '31px',
				'text-decoration': 'none',
				'text-align': 'center',
				'transition-duration': FX.speed.fast,
				'box-shadow': FX.shadow.default,
				'&:hover': {
					'box-shadow': FX.shadow.hover,
					'transition-duration': FX.speed.fast
					// 'transform': `scale(${FX.scale.hover})`
				},
				'&:active:hover': {
					'box-shadow': FX.shadow.default,
					'transition-duration': FX.speed.fast
					// 'transform': 'scale(1)',
				}
			},

			'.social-icons': {
				'list-style-type': 'none',
				'display': 'flex',
				'align-items': 'flex-end',
				'float': 'right',
				'li': {
					'margin-right': '29px',
					'&:last-child': {
						'margin-right': '0'
					},
					'a path': {
						'transition-duration': '.25s'
					},
					'a:hover path': {
						'transition-duration': '.25s',
						fill: COLOR.primary
					}
				},
				'&.social-icons-mobile': {
					'display': 'none',
					'float': 'none'
				}
			},

			'.footer-block': {
				'position': 'relative'
			},

			'.store-button': {
				'position': 'absolute',
				'bottom': '0',
				'left': '50%',
				'display': 'flex',
				a: {
					'margin-right': '38px',
					path: {
						'-webkit-transition': 'fill .3s',
						transition: 'fill .3s'
					},
					'&:hover': {
						path: {
							fill: COLOR.primary
						}
					}
				},
				'@media (max-width: 1400px)': {
					'position': 'relative',
					'left': '0',
					'margin-bottom': '40px'
				}
			},

			'.site-button': {
				'position': 'absolute',
				'bottom': '0',
				'right': '0',
				'@media (max-width: 960px)': {
					'position': 'relative',
					'left': '0',
					'margin-bottom': '40px'
				},
				'button': {
					'&:first-child': {
						'margin-bottom': '10px'
					}
				}
			},

			'.partners-logo': {
				'display': 'flex',
				'flex-wrap': 'wrap',
				'align-items': 'center',
				'img': {
					'margin-right': '40px',
					'display': 'block'
				}
			},

			'@media (max-width: 839px)': {
				'.social-icons': {
					'display': 'none',
					'&.social-icons-mobile': {
						'display': 'flex',
						'padding': '34px 0 0'
					}
				},
				'.footer-top-block': {
					'padding': '0'
				},
				'.partners-logo': {
					'img': {
						'margin-bottom': '20px'
					}
				}
			}

		}
	});

	class JetFooter extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$7.attachStyles(this);
			return new Promise(resolve => {
				this.context = this.observe({});
				resolve();
			});
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'footer',
				null,
				window.hidenav ? null : ME.container({
					mod: { className: 'footer-top-block' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 6, tablet: 12, align: 'bottom' }, ME.layout.inner(...menusList.map(menu => ME.layout.cell({ common: 4, tablet: 4, phone: 12, align: 'top' }, ME.layout.inner(...menu.map(({ link, title, strict, params }) => ME.layout.cell({ common: 12, tablet: 12, phone: 12, align: 'top' }, params ? BMPVD.createBMPVirtulaDOMElement(
								'a',
								_extends$6({}, params, { 'class': (isActive(link, strict ? true : false) ? 'active ' : '') + 'footer-link', href: link }),
								title
							) : BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ 'class': (isActive(link, strict ? true : false) ? 'active ' : '') + 'footer-link', href: link },
									title
								)
							)))))))), ME.layout.cell({ common: 3, align: 'top' }), ME.layout.cell({ common: 3, align: 'top' }, ME.layout.inner(ME.layout.cell({ common: 12, align: 'top' }, ME.layout.inner(ME.layout.cell({ common: 12, align: 'top' }, BMPVD.createBMPVirtulaDOMElement(
								'ul',
								{ className: 'social-icons' },
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.facebook.com/JetSmarter/', safeHTML: svgIcon.facebook() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.instagram.com/jetsmarter/', safeHTML: svgIcon.instagram() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://twitter.com/JetSmarter', safeHTML: svgIcon.twitter() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.linkedin.com/company/jetsmarter', safeHTML: svgIcon.linkedin() })
								)
							))))))]
						}))]
					})]
				}),
				ME.container({
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 12, tablet: 12, align: 'bottom' }, ME.layout.inner(ME.layout.cell({ common: 12, align: 'middle' }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'footer-block' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'store-button' },
									BMPVD.createBMPVirtulaDOMElement('a', { href: 'https://itunes.apple.com/us/app/jetsmarter-book-private-jets/id562937375?mt=8', rel: 'noopener', target: '_blank', style: '', safeHTML: svgIcon.appStore() }),
									BMPVD.createBMPVirtulaDOMElement('a', { href: 'https://play.google.com/store/apps/details?id=com.jetsmarter.SmartJets&hl=en', rel: 'noopener', target: '_blank', style: '', safeHTML: svgIcon.googlePlay() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'site-button' },
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ className: 'site-button-item', href: '/partnership/', style: 'background: #FE6A57; color: #fff; margin-bottom: 10px;' },
											BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Connect your business'
											)
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ className: 'site-button-item', href: '/nbaa17/', style: 'background: #EEECE7; color: #FE6A57; margin-bottom: 10px;' },
											BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Become a preferred operator'
											)
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ className: 'site-button-item', href: '/owners/request-form/', style: 'background: #EEECE7; color: #FE6A57;' },
											BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'For aircraft owners'
											)
										)
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									null,
									BMPVD.createBMPVirtulaDOMElement(
										'p',
										{ style: 'font-size: 10px; line-height: 13px; color: #CECBC3; margin-bottom: 10px' },
										'JetSmarter contracts with operators who employ industry-leading metrics, training, safety, and maintenance.'
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'partners-logo' },
									safetyCompanyFooter.map(({ image, link, title }) => BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										null,
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ href: link },
											BMPVD.createBMPVirtulaDOMElement('img', { src: image, alt: title })
										)
									))
								)
							)), ME.layout.cell({ common: 12, align: 'top' }, BMPVD.createBMPVirtulaDOMElement(
								'ul',
								{ className: 'social-icons social-icons-mobile' },
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.facebook.com/JetSmarter/', safeHTML: svgIcon.facebook() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.instagram.com/jetsmarter/', safeHTML: svgIcon.instagram() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://twitter.com/JetSmarter', safeHTML: svgIcon.twitter() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'li',
									null,
									BMPVD.createBMPVirtulaDOMElement('a', { target: '_blank', rel: 'noopener', href: 'https://www.linkedin.com/company/jetsmarter', safeHTML: svgIcon.linkedin() })
								)
							))))]
						}))]
					})]
				}),
				ME.container({
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 12, align: 'top' }, BMPVD.createBMPVirtulaDOMElement(
								'p',
								{ style: 'font-size: 10px; line-height: 13px; color: #CECBC3;' },
								'\xA9 2019 JetSmarter Inc.',
								BMPVD.createBMPVirtulaDOMElement('br', null),
								'JetSmarter does not own or operate any aircraft. All flights are performed by FAA-licensed and DOT-registered air carriers. JetSmarter offers a number of programs including private charters, for which JetSmarter acts solely as your agent in arranging the flight, and Public Charters, for which JetSmarter acts as principal in buying and reselling the air transportation. Seats made available under the Public Charter Program are subject to the Public Charter rules contained in 14 CFR 380. All flights are subject to availability and such other terms and conditions available at ',
								BMPVD.createBMPVirtulaDOMElement(
									'bmp-anchor',
									null,
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: '/legal/', target: '_blank', style: 'color: #FE6A57' },
										'jetsmarter.com/legal/'
									)
								)
							))]
						}))]
					})]
				})
			);
		}

	}

	if (!customElements.get('jet-footer')) customElements.define('jet-footer', JetFooter);

	const pagesImageConf = {
		headingDesktop: 'https://jetsmarter.com/data/site-v5/images/theme-images/1/heading.svg',
		headingMobile: 'https://jetsmarter.com/data/site-v5/images/theme-images/1/heading-mobile.jpg',
		backgroundDesktop: 'https://jetsmarter.com/data/site-v5/images/theme-images/1/background-02.svg',
		backgroundMobile: 'https://jetsmarter.com/data/site-v5/images/theme-images/1/background-mobile.svg',
		plane: 'https://jetsmarter.com/data/site-v5/images/theme-images/1/airplain.svg',
		bgColor: '#4E5D66'
	};

	const cssjs$5 = {
		'display': 'flex',
		'align-items': 'center',
		'justify-content': 'center',
		'min-height': '210px',
		'height': '210px',
		'width': '100%',
		'background-color': '#eee',
		'position': 'relative',
		'background': `url(${pagesImageConf.headingDesktop}) center center/cover no-repeat ${pagesImageConf.bgColor} !important`,

		'@media (max-width: 480px)': {},
		'.jetsmarter-logo': {
			'width': '214px',
			'height': '41px',
			'margin': 'auto',
			'display': 'block',
			'path': {
				fill: '#fff'
			},
			'&:hover': {
				'svg': {
					'transition-duration': '.25s',
					'transform': 'scale(1.1)'
				}
			},
			'svg': {
				'transition-duration': '.25s',
				'width': '100%'
			}
		},
		'@media (max-width: 479px)': {
			'background-image': `url(${pagesImageConf.headingMobile}) !important`,
			'background-position': 'center 40px !important',
			'&.hidenav': {
				'background-position': 'center !important'
			},
			'.jetsmarter-logo': {
				'display': 'none'
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$8 = instance.define({
		name: 'jetsm-heading', cssjs: cssjs$5
	});

	class JetsmHeading extends BMPVDWebComponent {

		constructor() {
			super();
		}

		onAttached() {
			this.ctx.hideLogo = this.hasAttribute('hide-logo');
			if (window.hidenav) this.classList.add('hidenav');
		}

		ready() {
			this.ctx = this.observe({
				hideLogo: this.hasAttribute('hide-logo')
			});

			bmpCssComponent$8.attachStyles(this);
		}

		render() {
			return this.ctx.hideLogo ? BMPVD.createBMPVirtulaDOMElement('span', null) : window.hidenav ? BMPVD.createBMPVirtulaDOMElement('span', { style: 'margin-top: -40px; display: block', safeHTML: svgIcon.logo() }) : BMPVD.createBMPVirtulaDOMElement(
				'bmp-anchor',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'a',
					{ href: '/', className: 'jetsmarter-logo' },
					BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.logo() })
				)
			);
		}

	}

	customElements.define('jetsm-heading', JetsmHeading);

	const cssjs$6 = {
		'.banner-inner': {
			'display': 'flex',
			'justify-content': 'center',
			'align-items': 'center',
			'height': '90px',
			'position': 'relative',
			'z-index': '1',
			'&:after': {
				'content': '""',
				'position': 'absolute',
				'width': '100%',
				'height': '100%',
				'background': 'linear-gradient(to bottom, rgba(5, 26, 21, 0) 0%, rgba(5, 26, 21, 0.3) 100%)'
			}
		},

		'.banner-matrix-bg': {
			'position': 'absolute',
			'width': '100%',
			'height': '100%',
			'top': '0',
			'left': '0',
			'z-index': '1',
			'background': '#15584b',
			'background': '-moz-linear-gradient(top, #15584b 0%, #051a15 100%)',
			'background': '-webkit-linear-gradient(top, #15584b 0%,#051a15 100%)',
			'background': 'linear-gradient(to bottom, #15584b 0%,#051a15 100%)',
			'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr="#15584b", endColorstr="#051a15", GradientType=0 )'
		},

		'.banner-matrix': {
			'position': 'absolute',
			'width': '100%',
			'height': '100%',
			'top': '0',
			'left': '0',
			'z-index': '2',
			'background': 'url("https://jetsmarter.com/data/site-v5/assets/ui-icon/cybermonday-martix.png") repeat-x 50% 50% / contain'
		},

		'.banner-text-wrap': {
			'position': 'absolute',
			'top': '50%',
			'left': '50%',
			'z-index': '3',
			'transform': 'translate(-50%, -50%)',
			'display': 'flex',
			'justify-content': 'center',
			'align-items': 'center',
			'height': '100%',
			'width': '100%',
			'padding': '20px'
		},

		'.banner-text': {
			// 'background': '#124137',
			// 'background': '-moz-linear-gradient(top, #124137 0%, #0d3029 100%)',
			// 'background': '-webkit-linear-gradient(top, #124137 0%,#0d3029 100%)',
			// 'background': 'linear-gradient(to bottom, #124137 0%,#0d3029 100%)',
			// 'filter': 'progid:DXImageTransform.Microsoft.gradient( startColorstr="#124137", endColorstr="#0d3029", GradientType=0 )',

			'color': '#52ECCA',
			'font-size': '28px',
			'line-height': '32px',
			'letter-spacing': '-0.5',
			'font-family': 'Gotham',
			'font-weight': '500',

			'span': {
				'color': '#fff'
			},

			'a': {
				'text-decoration': 'none',
				'color': '#fff'
			}
		},

		'.banner-close': {
			'position': 'absolute',
			'top': '0',
			'right': '20px',
			'bottom': '0',
			'margin': 'auto',
			'display': 'flex',
			'align-items': 'center',
			'z-index': '4',
			'cursor': 'pointer'
		},

		'.banner-mob-br': {
			'display': 'none'
		},

		'@media (max-width: 1200px)': {
			'.banner-text': {
				'font-size': '20px',
				'line-height': '22px'
			}
		},

		'@media (max-width: 960px)': {
			'.banner-text-wrap': {
				'justify-content': 'start'
			},
			'.banner-close': {
				'top': '14px',
				'bottom': 'auto'
			},
			'.banner-mob-br': {
				'display': 'block'
			}
		}
	};

	const oneWeek = 60 * 60 * 24 * 7;

	const JetCookie = {
		prefix: 'comjetsm',

		set(name, value, params = {}) {
			let cookieString = `${this.prefix + name}=${value.toString()}; path=${params.path || '/'}; `;
			if (params.expires) {
				if (params.expires instanceof Date) cookieString += `expires=${params.expires.toUTCString()};`;else cookieString += `expires=${params.expires.toString()};`; // can be string or int

			} else cookieString += `expires=${oneWeek};`; // default for one week

			document.cookie = cookieString;
		},

		get(cookieName) {
			const match = document.cookie.split(';').map(cookie => cookie.split('=')).find(([name]) => this.prefix + cookieName === name.trim());

			return match ? decodeURIComponent(match[1]) : undefined;
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$9 = instance.define({
		name: 'jetsm-banner',
		cssjs: cssjs$6
	});

	class JetsmBanner extends BMPVDWebComponent {

		constructor() {
			super();
		}

		hide() {
			JetCookie.set(this.cookiename, true);
			this.context.showed = false;
		}

		ready() {
			this.cookiename = 'bannercybermonday2018';
			this.context = this.observe({
				showed: !JetCookie.get(this.cookiename)
			});
			bmpCssComponent$9.attachStyles(this);
		}

		render() {
			return this.context.showed ? BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'banner-inner' },
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'banner-matrix' }),
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'banner-matrix-bg' }),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'banner-text-wrap' },
					BMPVD.createBMPVirtulaDOMElement(
						'p',
						{ className: 'banner-text' },
						'CYBER MONDAY!',
						BMPVD.createBMPVirtulaDOMElement('br', { className: 'banner-mob-br' }),
						' JOIN FOR $2,500 PER USER.',
						BMPVD.createBMPVirtulaDOMElement('br', { className: 'banner-mob-br' }),
						' ',
						BMPVD.createBMPVirtulaDOMElement(
							'a',
							{ href: 'tel:+19543150059' },
							'CALL 954-315-0059 NOW'
						)
					)
				),
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'banner-close', onclick: () => this.hide(), safeHTML: svgIcon.close({ color: '#fff' }) })
			) : BMPVD.createBMPVirtulaDOMElement('div', null);
		}

	}

	customElements.define('jetsm-banner', JetsmBanner);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const priorityLinks = () => ME.container({
		mod: { className: '' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}`, 'Beyond the flights'))]
		}), ME.layout.grid({
			children: [ME.layout.cell({ common: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
				'bmp-anchor',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'a',
					{
						style: 'background-image: url(\'https://jetsmarter.com/data/site-v5/assets/pages/home/priority-link-img-1.jpg\')',
						className: 'priority-links-item',
						href: '/how-it-works/' },
					h3(`color: ${COLOR.white}; font-weight: 300;`, 'How it Works')
				)
			)), ME.layout.cell({ common: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
				'bmp-anchor',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'a',
					{
						style: 'background-image: url(\'https://jetsmarter.com/data/site-v5/assets/pages/home/priority-link-img-2.jpg\')',
						className: 'priority-links-item',
						href: '/experience/' },
					h3(`color: ${COLOR.white}; font-weight: 300;`, 'The Experience')
				)
			)), ME.layout.cell({ common: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
				'bmp-anchor',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'a',
					{
						style: 'background-image: url(\'https://jetsmarter.com/data/site-v5/assets/pages/home/priority-link-img-3.jpg\')',
						className: 'priority-links-item',
						href: '/reviews/' },
					h3(`color: ${COLOR.white}; font-weight: 300;`, 'Community')
				)
			))]
		})]
	});

	const cssjs$7 = {
		display: 'block',
		position: 'absolute',
		left: '50%',
		top: '50%',
		'-webkit-transform': 'translate3d(-50%, -50%, 0)',
		transform: 'translate3d(-50%, -50%, 0)',
		width: '100%',
		'autosuggest-field': {
			'z-index': 1,
			display: 'none',
			'&.showed': {
				display: 'block',
				'&+.fake-input .label': {
					display: 'none'
				}
			}
		},
		'.fake-input': {
			'position': 'relative',
			'width': '100%',
			'outline': 'none',
			'padding': '13px 30px 13px 13px', //TODO responsive
			'color': `${COLOR.lightBorder}`,
			background: COLOR.white,
			'font-size': '20px', //TODO responsive
			'line-height': '24px', //TODO responsive
			'border': 'none',
			'font-weight': 300,
			'-webkit-appearance': 'none',
			'font-family': 'Roboto',
			'display': 'block',
			'position': 'relative',
			'border-radius': '6px',
			'height': '50px', //TODO responsive
			'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px',
			'.icon': {

				'padding-right': "7px"
			},
			'.label': {
				'-webkit-transition': 'opacity .3s, visibility .3s',
				transition: 'opacity .3s, visibility .3s'
			}

		},
		'.jet-search-field-inner': {
			position: 'relative',
			'&.filled': {
				'.close-btn': {
					display: 'block'
				},
				'.fake-input': {
					color: COLOR.dark,
					'.icon': {
						'path': { 'fill': COLOR.dark },
						'rect': { 'fill': COLOR.dark },
						'circle': { 'fill': COLOR.dark }
					}
				}
			}
		},
		form: {

			'width': '100%',
			'display': 'block',
			'background': 'rgba(255,255,255,0.3)', //TODO move to theme
			'position': 'relative',
			'border-radius': '12px',
			'.destination': {
				// '-webkit-transition': 'width .3s',
				// transition: 'width .3s',
				width: '100%',
				'float': 'right',
				position: 'relative',
				'z-index': 2
			},
			'.origin': {
				// '-webkit-transition': 'width .3s',
				// transition: 'width .3s',
				width: '100%',
				'float': 'left',
				position: 'relative',
				'z-index': 3
			},
			'.search-reverse': {
				'cursor': 'pointer',
				'position': 'absolute',
				'left': '0',
				'right': '0',
				'margin': 'auto',
				'background-color': '#EEECE7',
				'width': '50px',
				'height': '50px',
				'border-radius': '6px',
				'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px', //TODO elevation function
				'opacity': '0',
				'visibility': 'hidden',
				'transition': 'opacity .3s, visibility .3s',
				'.search-reverse-inner': {
					'position': 'relative',
					'height': '100%',
					'width': '100%',
					'&:hover': {
						'svg': {
							'path': {
								stroke: COLOR.primary
							}
						}
					}
				},
				'.search-reverse-icon': {
					'position': 'absolute',
					'margin': 'auto',
					'display': 'block',
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'right': '0',
					'bottom': '0',
					'width': '30px',
					'height': '16px'
				},
				'.search-reverse-icon svg': {
					'-webkit-transform': 'rotate(180deg)',
					'-webkit-transition': '-webkit-transform .3s',
					'transform': 'rotate(180deg)',
					'transition': 'transform .3s'
				},
				'&.reversed .search-reverse-icon svg': {
					'-webkit-transform': 'none',
					'transform': 'none'
				}
			},
			'&.can-be-reversed': {
				'margin-top': '50px',
				'.origin': {
					width: 'calc(100% - 30px)'
				},
				'.destination': {
					width: 'calc(100% - 30px)'
				},
				'.search-reverse': {
					opacity: 1,
					visibility: 'visible'
				}
			},

			'@media (max-width: 839px)': {
				'&.can-be-reversed': {
					'.origin': {
						width: '100%'
					},
					'.destination': {
						width: '100%'
					}
				}
			}

		},
		'.close-btn': {
			'color': '#000',
			'position': 'absolute',
			'top': '0',
			'bottom': '0',
			'right': '0',
			'margin': 'auto',
			'cursor': 'pointer',
			'z-index': '10',
			'width': '40px',
			'height': '100%',
			display: 'none',

			'path': {
				'-webkit-transition': 'stroke .3s',
				'transition': 'stroke .3s'
			},

			'&:hover': {
				'path': {
					'stroke': `${COLOR.primary}`
				}
			},
			'svg': {
				'position': 'absolute',
				'bottom': '0',
				'top': '0',
				'right': '0',
				'left': '0',
				'margin': 'auto'
			}
		},
		'@media (max-width: 480px)': {
			position: 'static',
			transform: 'none',
			'height': '100%',
			'margin': '0 auto',
			'display': 'flex',
			'justify-content': 'space-between',
			'align-items': 'center',
			'height': '100%',
			'& > .mdc-layout-grid': {
				width: '100%'
			},

			width: 'calc(100% - 20px)',
			'.mw1000': {
				height: '100%'
			},
			'&.in-top': {
				'min-height': '100%',
				'padding-top': '57px',
				'align-items': 'start',
				'.h3-style': {
					display: 'none'
				}
			},
			'&.filled': {
				width: '100%',
				'background': COLOR.light,
				'form.can-be-reversed': {
					'margin-top': 0,
					'background': 'transparent'
				},
				'.search-reverse': {
					top: '130px',
					background: 'transparent',
					'box-shadow': 'none',
					'z-index': 4,
					'svg': {
						path: { stroke: COLOR.primary },
						polyline: { stroke: COLOR.primary }
					}
				}
			},
			'&.searching': {
				width: '100%',
				height: '100vh',
				position: 'fixed',
				top: 0,
				left: 0,
				'-webkit-transform': 'none',
				transform: 'none',
				background: COLOR.white,
				'.h3-style': {
					display: 'none'
				},
				'.jet-datepicker': {
					display: 'none'
				}
			}
		}
	};

	const cssjs$8 = {
		'display': 'block',
		'width': '100%',
		'height': '50px', //TODO responsive
		'position': 'absolute',
		'z-index': 3,
		'font-family': "Roboto",
		top: 0,
		left: 0,
		'input': {
			'outline': 'none',
			'background': 'transparent',
			'padding': '13px 30px 13px 10px', //TODO responsive
			'color': `${COLOR.dark}`, //TODO move to theme
			'font-size': '20px', //TODO responsive
			'line-height': '24px', //TODO responsive
			'border': 'none',
			'box-shadow': 'none',
			'font-weight': 300,
			'-webkit-appearance': 'none',
			'font-family': 'Roboto',
			width: 'calc(100% - 34px)',
			height: '48px',
			display: 'block',
			position: 'absolute',
			top: '1px',
			right: 0,
			'border-radius': '6px'
		},
		'.close-btn': {
			'color': '#000',
			'position': 'absolute',
			'top': '0',
			'bottom': '0',
			'left': 'calc(100% - 30px)',
			'margin': 'auto',
			'cursor': 'pointer',
			'z-index': '10',
			'width': '25px',
			'height': '50%',

			'path': {
				'-webkit-transition': 'stroke .3s',
				'transition': 'stroke .3s'
			},

			'&:hover': {
				'path': {
					'stroke': `${COLOR.primary}`
				}
			},
			'svg': {
				'position': 'absolute',
				'bottom': '0',
				'top': '0',
				'right': '0',
				'left': '0',
				'margin': 'auto'
			}
		},
		'.autosuggest-input': {
			background: 'transparent'
		},
		'.user-input': {
			'&::-moz-selection': {
				background: COLOR.primary,
				color: COLOR.white
			},
			'&::selection': {
				background: COLOR.primary,
				color: COLOR.white
			}
		},
		'.with-icon': {
			'.user-input': {
				'padding-left': '50px' //TODO responsive
			},
			'.autosuggest-input': {
				'padding-left': '50px' //TODO responsive
			}
		},
		'.result-list': {
			'z-index': 1,
			'position': 'absolute',
			'overflow': 'auto',
			'max-height': '325px',
			'width': '100%',
			'top': '51px',
			'left': 0,
			'background': `${COLOR.light}`,
			'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 5px 2px, rgba(0, 0, 0, 0.07) 0 4px 1px 0, rgba(0, 0, 0, 0.06) 0 2px 3px 0', //TODO elevation function
			'font-family': 'Roboto',
			'border-radius': '6px',
			'.preloader': {
				// display: 'none',
				// position: 'absolute',
				// bottom: 0,
				// left: '50%',
				// '-webkit-transform': 'translate3d(-50%, 0, 0)',
				// transform: 'translate3d(-50%, 0, 0)',
			},
			'&.pending': {
				'padding-bottom': '70px',
				'.preloader': {
					display: 'block'
				}
			},
			'&.empty': {
				padding: 0
			}
		},
		'.autosuggest': {
			height: '100%',
			'border-radius': '6px',
			background: COLOR.white,
			'@media(max-width: 480px)': {
				'border-radius': '0',
				'border': 'none'
			},
			'.error-popup': {
				color: COLOR.dark,
				background: COLOR.white,
				position: 'absolute',
				top: 'calc(100% + 1px)',
				left: 0,
				'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px',
				display: 'none',
				padding: '14px 14px 12px',
				'border-radius': '6px',
				'line-height': '21px',
				'font-size': '13px',
				'font-weight': '400',
				width: '100%'
			},
			'&.error': {
				background: COLOR.primary,
				'input': {
					color: COLOR.white
				},
				path: {
					fill: COLOR.white
				},
				circle: {
					fill: COLOR.white
				},
				rect: {
					fill: COLOR.white
				},
				'.error-popup': {
					display: 'block'
				},
				'.close-btn': {
					display: 'block',
					path: {
						stroke: COLOR.white
					}
				}
			}
		},

		'.icon': {

			top: '10px',
			left: '13px',

			'position': 'absolute',
			'z-index': 1,
			'width': '32px', //TODO responsive
			'height': '32px', //TODO responsive
			'margin': 'auto',
			'line-height': '36px', //TODO responsive
			'vertical-align': 'middle',
			'img': {
				'display': 'inline-block',
				'height': 'auto',
				'vertical-align': 'middle',
				'max-width': '100%'
			}
		},
		'.spinner': {
			position: 'relative',
			padding: '0 40px',
			margin: '10px auto',
			color: COLOR.dark,
			cursor: 'pointer',
			position: 'relative',
			'&.hidden': {
				display: 'none'
			}
		},

		'@media (max-width: 480px)': {
			height: '100%',
			position: 'fixed',
			'-webkit-transform': 'translate3d(0, 100%, 0)',
			transform: 'translate3d(0, 100%, 0)',
			// opacity: 0,
			'-webkit-transition': '-webkit-transform .3s',
			transition: '-webkit-transform .3s',
			'z-index': 4,
			height: '100%',
			background: COLOR.light,
			'box-shadow': 'none',
			padding: '1px 0 20px',
			'&.showed': {
				// opacity: 1,
				'-webkit-transform': 'translate3d(0, 0, 0)',
				transform: 'translate3d(0, 0, 0)'
			},
			'.autosuggest': {
				position: 'relative',
				background: 'transparent',
				'.autosuggest-input': {
					background: COLOR.white
				},
				"&.error": {
					background: 'transparent',
					'.autosuggest-input': {
						background: COLOR.primary
					},
					'.error-popup': {
						'top': '110px',
						'width': 'calc(100% - 17px)',
						'left': '0',
						'margin': '0 auto',
						'z-index': '1',
						'left': '0',
						'right': '0'
					},
					'.close-btn': {
						width: '29px',
						height: "29px",
						path: {
							stroke: COLOR.dark
						}
					}
				}
			},
			input: {
				left: 0,
				margin: '60px auto 0',
				width: 'calc(100% - 16px)',
				'padding-left': '40px',
				'-webkit-appearance': 'none',
				'-moz-appearance': 'none',
				'appearance': 'none',
				'outline': 'none',
				background: 'transparent',
				border: '1px solid rgba(0,0,0,.05)',
				'box-shadow': 'rgba(0, 0, 0, 0.05) 0px 2px 4px 0px'
			},
			'.close-btn': {
				bottom: 'auto',
				height: '40px',
				width: '40px',
				left: 'auto',
				right: '5px',
				'.search-close-btn': {
					width: '29px',
					height: '29px'
				},

				'g': {
					'stroke-width': '.5'
				}

			},
			'.result-list': {
				top: '120px',
				height: '35vh',
				'border-radius': '0',
				'box-shadow': 'none',
				'-webkit-overflow-scrolling': 'touch',
				'.option': {
					padding: '20px 60px'
				}
			},
			'.icon': {
				top: '70px',
				bottom: 'auto',
				left: '20px',
				display: 'block',
				'path': { 'fill': COLOR.dark },
				'rect': { 'fill': COLOR.dark },
				'circle': { 'fill': COLOR.dark }
			}

		},
		'&.bordered': {
			'.autosuggest': {
				// 'border': `1px solid ${COLOR.neutral}`,
				'border-radius': '6px'
			}
		}
	};

	// const isMobile = () => /(iphone|ipad|ipod|android)/gi.test( navigator.userAgent.toLowerCase() )
	const isMobile = () => window.innerWidth < 840;

	const escapeRegex = val => {
		const specials = ['/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\'];
		const regex = new RegExp(`(\\${specials.join('|\\')})`, 'gim');
		return val.replace(regex, '\\$1', val);
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	class WidgetTooltip extends BMPVDWebComponent {

		static get is() {
			return null;
		}

		constructor() {
			super();
		}

		static setRelativePosition(selfEl, relativeEl) {
			if (isMobile()) {
				selfEl.classList.add('responsive');
			} else {
				const { top, left } = relativeEl.getBoundingClientRect();
				const { width } = window.getComputedStyle(relativeEl);
				selfEl.style.top = `${parseFloat(top) + window.pageYOffset}px`;
				selfEl.style.left = `${parseFloat(left) + window.pageXOffset}px`;
				selfEl.style.width = `${parseFloat(width)}px`;
			}
		}

		destroy() {
			this.classList.remove('showed');
			document.body.classList.remove('hide-application');
			document.body.removeEventListener('mousedown', this.refClickOutside, false);
			if (isMobile()) {
				setTimeout(() => this._remove(), 300);
			} else {
				this._remove();
			}
			this.dispatchEvent(new CustomEvent('remove'));
		}

		_remove() {
			if (this.parentNode && this.parentNode.contains(this)) this.parentNode.removeChild(this);else if (this.remove) {
				this.remove();
			}
		}

		_clickOutside(ev) {
			if (!ev.target.closest(this.tagName)) this.destroy();
		}

		disconnectedCallback() {
			document.body.removeEventListener('mousedown', this.refClickOutside, false);
			window.removeEventListener('resize', this.refResize, false);
			window.removeEventListener('popstate', this.refDestoy, false);
			document.body.classList.remove('hide-application');
		}

		onAttached() {

			this.classList.add('showed');

			this.refDestoy = this.destroy.bind(this);
			this.refClickOutside = this._clickOutside.bind(this);

			setTimeout(() => document.body.addEventListener('mousedown', this.refClickOutside, false), 100);
			window.addEventListener('popstate', this.refDestoy, false);
			window.addEventListener('resize', this.refDestoy, false);
		}

	}

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$10 = instance.define({
		name: 'jet-search-field', cssjs: cssjs$8
	});

	const specialKeys = {
		arrowDown: 40,
		arrowRight: 39,
		arrowUp: 38,
		arrowLeft: 37,
		escape: 27,
		shift: 16,
		enter: 13,
		tab: 9
	};

	const inView = (box, element) =>
	// top position
	box.scrollTop < element.offsetTop &&
	// bottom position
	box.scrollTop > element.offsetTop + element.offsetHeight - box.offsetHeight;

	const formatOutput = (text, _usersInput) => {
		if (!text) return '';
		const regex = new RegExp(`^${escapeRegex(_usersInput)}`, 'i');
		if (!regex.test(text)) return '';else return text.replace(regex, _usersInput);
	};

	class AutosuggestField extends WidgetTooltip {

		static get is() {
			return 'autosuggest-field';
		}

		static create({ relativeEl, name, resultsList, value, styled, tabIndex }) {
			const self = document.createElement(this.is);

			self.classList.add('showed');
			self.classList.add(styled);
			self.resultsList = resultsList;
			self.addEventListener('reposition', () => {
				WidgetTooltip.setRelativePosition(self, relativeEl);
			});
			if (tabIndex) self.setAttribute('data-tabindex', tabIndex);
			if (name) self.setAttribute('data-name', name);
			if (value) self.setAttribute('data-value', value);

			document.body.insertAdjacentElement('beforeend', self);
			WidgetTooltip.setRelativePosition(self, relativeEl);

			return self;
		}

		static get observedAttributes() {
			return ['data-showed'];
		}

		ready() {
			bmpCssComponent$10.attachStyles(this);
			this.reference = this.getAttribute('reference');

			this.name = this.getAttribute('data-name');
			const presetValue = this.getAttribute('data-value');

			this._usersInput = presetValue || '';
			this.selected = null;
			this.context = this.observe({
				highlighted: null,
				error: false,
				pending: false,
				firstSuggestion: '',
				selectShowed: false
			});
		}

		change(isDispatchEvent = true) {
			let element = this.querySelector('.option.highlighted');
			// if no highlighted element, select first
			if (!element) element = this.querySelector('.option');

			if (element) {
				this.track('entered');
				if (isDispatchEvent) {
					const ev = new CustomEvent('complete', {
						detail: JSON.parse(element.dataset.value)
					});
					this.dispatchEvent(ev);
				}
			} else {
				this.selected = null;
				this.context.error = true;
				this.dispatchEvent(new CustomEvent('error'));
			}
			setTimeout(() => this.destroy());
		}

		updateFirstSuggestion(forceFill = false) {
			if (forceFill !== false) {
				this.context.firstSuggestion = forceFill;
			} else {
				const options = this.querySelectorAll('.option');
				const suggestion = options[this.context.highlighted || 0];
				if (suggestion) {
					this.context.firstSuggestion = formatOutput(suggestion.dataset.label, this._usersInput);
				}
			}
		}

		cancel() {
			this.selected = null;
			this._usersInput = '';
			this.inputElement.value = '';
			this.updateFirstSuggestion();
			this.dispatchEvent(new CustomEvent('complete'));
		}

		keydown(ev) {
			this.context.error = false;
			switch (ev.keyCode) {
				case specialKeys.escape:
					this.cancel();
					break;
				case specialKeys.enter:
				case specialKeys.tab:
					this.change(ev.keyCode !== specialKeys.tab);
					if (!this.selected) {
						SendGA.event({
							eventCategory: 'forms',
							eventAction: "autosuggest-nomatch",
							eventLabel: this.name.toLowerCase()
						});
					}
					break;
				case specialKeys.arrowRight:
					this.change(false);
					break;
				case specialKeys.arrowDown:
					ev.preventDefault();
					this.highlightSelection('down');
					break;
				case specialKeys.arrowUp:
					ev.preventDefault();
					this.highlightSelection('up');
					break;
			}
		}

		update(ev) {
			if (!Object.values(specialKeys).includes(ev.keyCode)) {
				this.highlightSelection(null, 0);
				this.pos = {};
				this._usersInput = ev.target.value || '';
				// this.resultsList = this.resultsList.map( el => el.props.usersInput = this._usersInput )

				this.context.firstSuggestion = '';

				this.context.highlighted = null;
				this.updateFirstSuggestion(this._usersInput.length > 20 && '');
				this.classList.add('showed');

				const updateEvent = new CustomEvent('update', { detail: this._usersInput });
				this.dispatchEvent(updateEvent);
			}
		}

		onAttached() {
			super.onAttached();

			this.inputElement = this.querySelector('.user-input');
			this.inputElement.value = this._usersInput || '';
			if (isMobile()) document.body.classList.add('hide-application');

			this.querySelector('.user-input').focus({ preventScroll: true });
		}

		highlightSelection(rotation, forceIndex = null) {

			const options = [...this.querySelectorAll('.option')];
			let { highlighted } = this.context;
			if (forceIndex === null || forceIndex != highlighted) {
				let index = -1;
				if (forceIndex) {
					index = parseInt(forceIndex, 10);
				} else if (options.length) {
					if (highlighted !== null) {
						if (rotation == 'down') index = highlighted < options.length - 1 ? highlighted + 1 : options.length - 1; // next
						else if (rotation == 'up') index = highlighted > 0 ? highlighted - 1 : 0; // prev
					} else {
						if (rotation == 'up') index = options.length - 1; // last
						if (rotation == 'down') index = 0; // first
					}
				}

				options.forEach((el, num) => el.classList[index == num ? 'add' : 'remove']('highlighted'));
				if (options[index]) {
					// this.updateScroll(options[index], rotation)
					this.context.highlighted = index;
					this.context.firstSuggestion = formatOutput(options[index].dataset.label || '', this._usersInput);
				}
			}
		}

		updateScroll(selectedOption, rotation) {
			const results = this.querySelector('.result-list');

			let scrollY = selectedOption.offsetTop;
			if (!inView(results, selectedOption)) {
				if (rotation == 'down') {
					scrollY += selectedOption.offsetHeight - results.offsetHeight;
				}
				results.scrollTo(0, scrollY);
			}
		}

		track(event) {
			SendGA.event({
				eventCategory: 'forms',
				eventAction: event,
				eventLabel: this.name.toLowerCase()
			});
		}

		_focus(ev) {
			this.track('started');
			this.update(ev, true);
			setTimeout(() => this.updateFirstSuggestion(this._usersInput.length > 20 && ''), 50);
		}

		render() {

			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': `autosuggest ${this.context.error ? 'error' : ''}` },
				BMPVD.createBMPVirtulaDOMElement('span', { 'class': 'icon', safeHTML: svgIcon[`search${this.name}`]() }),
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'close-btn', safeHTML: svgIcon.searchClose(), onclick: ev => this.cancel() }),
				BMPVD.createBMPVirtulaDOMElement('input', { tabindex: '-1', type: 'text', readonly: 'readonly', className: 'autosuggest-input', placeholder: this.context.firstSuggestion }),
				BMPVD.createBMPVirtulaDOMElement('input', { className: 'user-input', type: 'text',
					autocomplete: 'off',
					spellcheck: 'false',
					tabindex: this.getAttribute('data-tabindex'),
					onforcechange: ev => this.change(),
					onFocus: ev => {
						this._focus(ev);
					},
					onKeyDown: ev => this.keydown(ev),
					onKeyup: ev => {
						this.update(ev);
					},
					onMouseover: ev => this.highlightSelection(-1),
					name: this.props.name
				}),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'result-list' },
					this.resultsList || null
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'error-popup' },
					'Sorry, we don\u2019t have such route yet. Please select another location.'
				)
			);
		}

	}

	if (!customElements.get(AutosuggestField.is)) customElements.define(AutosuggestField.is, AutosuggestField);

	const pathname = 'graph/v1/';
	const toSearchString = obj => {
		return Object.keys(obj).map(key => {
			return `${key}=${encodeURIComponent(obj[key])}`;
		}).join('&');
	};

	class ResourceStorage extends BmpStorage {

		constructor() {
			super();

			this.cache = {};
			this.conf = {
				host: window.SERVER_NAME,
				credentials: 'include'
			};
		}

		async getFields(formSlug) {
			let form = this.getFromStorage(`form.${formSlug}`);
			if (!form) {
				form = await this.getRequest(`${pathname}/${formSlug}`);
				this.setToStorage(`form.${formSlug}`, form);
			}

			return form;
		}

		postForm(formSlug, fields) {
			return this.postRequest(`${pathname}/${formSlug}`, fields);
		}

		async graphRequest(query, method = 'POST') {
			const body = { query: `{ ${query} }` };
			let response = null;
			if (method == 'GET') {
				this.conf.headers = {
					'Accept': '*/*',
					'Content-Type': null
				};
				const searchString = toSearchString(body);
				response = await this.getRequest(`${pathname}?${searchString}`);
				this.conf.headers = {
					'Accept': '*/*',
					'Content-Type': 'application/json'
				};
			} else {
				this.conf.headers = {
					'Accept': '*/*',
					'Content-Type': 'application/json'
				};
				response = await this.postRequest(pathname, body);
			}
			return JSON.parse(response);
		}

		async getRN(RNs) {
			if (!Array.isArray(RNs)) {
				RNs = [RNs];
			}
			const query = RNs.map((rn, index) => `rn${index}: Resource( rn: "${rn}" ) { data }\n`);
			if (this.cache[query]) return this.cache[query];
			const response = await this.graphRequest(query);
			if (response.errors) {
				throw new Error(response.errors);
			} else {
				const resources = Object.keys(response.data).map(responseKey => {
					const { data, schema } = response.data[responseKey];
					const result = {
						data: JSON.parse(data),
						schema: schema ? JSON.parse(schema) : {}
					};
					return result;
				});
				this.cache[query] = resources && RNs.length === 1 ? resources[0] : resources;
				return this.cache[query];
			}
		}

	}

	const resourceStorageInstance = new ResourceStorage();

	const animationLegOfferLoading = `
	@keyframes leg-offer-loading {
		0%{ background-position: 100% 0 }
		100%{ background-position: -100% 0 }
	}`;

	const styleTag = document.createElement('style');
	styleTag.type = 'text/css';
	styleTag.appendChild(document.createTextNode(animationLegOfferLoading));
	document.head.appendChild(styleTag);

	const cssjs$9 = {

		'display': 'block',
		'position': 'absolute',
		'width': '100%',
		'max-width': '1200px',
		'bottom': '120px',
		'left': '0',
		'right': '0',
		'margin': 'auto',
		'transform': 'translate3d(0,0,0)',
		'z-index': '3',

		'.fake-slider': {
			'display': 'flex',
			'width': '100%',
			'max-width': '1200px',
			'left': '0',
			'right': '0',
			'margin': 'auto',

			'.fake-slider-item': {
				'width': '33.3%',
				'padding': '5px'
			},
			'.fake-slider-inner': {
				'overflow': 'hidden',
				'border-radius': FX.radius.small,
				'background-color': COLOR.light,
				'width': '100%',
				'height': '100%',
				'height': '80px',
				'position': 'relative',
				'background': 'rgba(238, 236, 231, 0.6)',

				'&:after': {
					'content': "''",
					'display': 'block',
					'width': '100%',
					'height': '100%',
					'animation-duration': '1.5s',
					'animation-fill-mode': 'forwards',
					'animation-iteration-count': 'infinite',
					'animation-name': 'ghost-loading',
					'animation-timing-function': 'linear',
					'transition-timing-function': 'ease-out',
					'background': '#eeece7',
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'z-index': '-1',
					'background': 'linear-gradient(to right, rgba(238, 236, 231, 0) 0%, rgba(238, 236, 231, 0.75) 50%, rgba(238, 236, 231, 0) 100%)'
				}
			}
		},

		'.priority-offer': {
			'font-family': 'Gotham',
			'font-size': '24px',
			'font-weight': 400,
			'color': COLOR.white,
			'display': 'block',
			'-webkit-transition': 'opacity .3s',
			'transition': 'opacity .3s',
			'text-decoration': 'none',

			'.offer-price': {
				'display': 'inline-block',
				'text-shadow': '2px 2px 6px rgba(0, 0, 0, 0.5)',
				'vertical-align': 'top'
			},
			'.offer-text': {
				'display': 'inline',
				'vertical-align': 'top',
				'text-shadow': '2px 2px 6px rgba(0, 0, 0, 0.5)',
				'> *': {
					'font-family': 'Gotham'
				}
			},
			'.arrow': {
				'margin-left': '15px',
				'margin-top': '8px',
				'display': 'inline-block',
				'vertical-align': 'top',
				'svg': {
					'vertical-align': 'top'
				}
			}
		},

		'.swish__item': {
			'padding': '5px'
		},
		'.swish__offer-content': {
			'background-color': COLOR.light,
			'width': '100%',
			'height': '100%',
			'border-radius': '6px',
			'height': '80px',
			'display': 'flex',
			'padding': '10px 20px',
			'font-family': FONT.secondary,
			'text-decoration': 'none',
			'.p-style': {
				'line-height': '24px'
			}
		},
		'.offer-content__date': {
			'width': '28%',
			'padding-right': '20px',
			'height': '100%',
			'display': 'flex',
			'align-items': 'center',
			'justify-content': 'center',
			'white-space': 'nowrap'
		},
		'.offer-content__city': {
			'width': '50%',
			'height': '100%',
			'display': 'flex',
			'padding-left': '20px',
			'align-items': 'center',
			'border-left': '1px solid #CECBC3',
			'.p-style': {
				'white-space': 'nowrap'
			},
			'.p-small-style': {
				'white-space': 'nowrap'
			}
		},
		'.offer-content__price': {
			'width': '22%',
			'height': '100%',
			'display': 'flex',
			'align-items': 'center',
			'justify-content': 'flex-end',
			'.h4-style': {
				'white-space': 'nowrap'
			}
		},

		'.swish__leg-offer': {
			'.pagination__item': {
				'width': '5px',
				'height': '5px',
				'background-color': COLOR.dark,
				'&.active': {
					'background-color': COLOR.primary
				}
			},

			'.swish__prev': {
				'position': 'absolute',
				'display': 'block',
				'width': '50px',
				'top': '0',
				'bottom': '0',
				'left': '-50px',
				'padding': '0px',
				'display': 'flex',
				'align-items': 'center',
				'cursor': 'pointer',
				'transition-duration': FX.transSpeedFast,
				'user-select': 'none',

				'svg': {
					'use': {
						'transition-duration': FX.transSpeedFast
					}
				},

				'&:hover': {
					'transform': 'translate(-5px, 0)',
					'svg': {
						'use': {
							'transition-duration': FX.transSpeedFast,
							'fill': COLOR.primary
						}
					}
				},
				'&.swish__prev-hidden': {
					'display': 'none'
				}
			},

			'.swish__next': {
				'position': 'absolute',
				'display': 'block',
				'width': '50px',
				'top': '0',
				'bottom': '0',
				'right': '-50px',
				'padding': '0px',
				'display': 'flex',
				'align-items': 'center',
				'transform': 'rotate(180deg)',
				'cursor': 'pointer',
				'transition-duration': FX.transSpeedFast,
				'user-select': 'none',

				'svg': {
					'use': {
						'transition-duration': FX.transSpeedFast
					}
				},

				'&:hover': {
					'transform': 'translate(5px, 0) rotate(180deg)',
					'svg': {
						'use': {
							'transition-duration': FX.transSpeedFast,
							'fill': COLOR.primary
						}
					}
				},
				'&.swish__next-hidden': {
					'display': 'none'
				}
			}
		},

		'.leg-offer-slider-tablet': {
			'display': 'none',
			'padding': '0 10px'
		},
		'.leg-offer-slider-mobile': {
			'display': 'none',
			'.swish__item': {
				'padding': '5px',
				'&:first-child': {
					'padding-left': '10px'
				},
				'&:last-child': {
					'padding-right': '10px'
				}
			},
			'.offer-content__city': {
				'.p-small-style': {
					'font-weight': '300',
					'font-size': '20px',
					'line-height': '24px'
				}
			}
		},

		'@media (max-width: 1200px)': {
			'max-width': '800px',
			'.fake-slider': {
				'.fake-slider-item': {
					'width': '50%',
					'&:last-child': {
						'display': 'none'
					}
				}
			},

			'.leg-offer-slider-desktop': {
				'display': 'none'
			},
			'.leg-offer-slider-tablet': {
				'display': 'block'
			}
		},

		'@media (max-width: 900px)': {
			'.swish__leg-offer': {
				'.swish__prev': {
					'left': '-40px',
					'user-select': 'none'
				},
				'.swish__next': {
					'right': '-40px',
					'user-select': 'none'
				}
			}
		},

		'@media (max-width: 839px)': {
			'.swish__leg-offer': {
				'.swish__prev': {
					'display': 'none'
				},
				'.swish__next': {
					'display': 'none'
				}
			},
			'.fake-slider': {
				'.fake-slider-item': {
					'width': '100%',
					'padding': '0 10px',
					'&:first-child': {
						'display': 'none'
					},
					'&:last-child': {
						'display': 'none'
					}
				}
			}
		},

		'@media (max-width: 660px)': {
			'.leg-offer-slider-tablet': {
				'display': 'none'
			},
			'.leg-offer-slider-mobile': {
				'display': 'block'
			}
		},

		'@media (max-width: 500px)': {
			'.leg-offer-slider-mobile': {
				'display': 'block',
				'padding': '0',
				'.offer-content__city': {
					'.p-small-style': {
						'font-weight': '400',
						'font-size': '13px',
						'line-height': '21px'
					}
				}
			}
		},

		'@media (max-width: 479px)': {
			'bottom': '30px',
			'.fake-slider': {
				'.fake-slider-inner': {
					'height': '60px'
				}
			},
			'.swish__offer-content': {
				'height': '60px',
				'padding': '9px 15px'
			},
			'.offer-content__date': {
				'width': '35%',
				'padding-right': '10px'
			},
			'.offer-content__city': {
				'width': '40%',
				'padding-left': '10px'
			},
			'.offer-content__price': {
				'width': '25%'
			}
		},

		'@media (max-width: 400px)': {
			'.offer-content__date': {
				'.p-style': {
					'font-size': '20px',
					'line-height': '24px'
				}
			},
			'.offer-content__price': {
				'.h4-style': {
					'font-size': '20px',
					'line-height': '24px'
				}
			}
		},

		'@media (max-width: 360px)': {
			'.swish__offer-content': {
				'padding': '9px 10px'
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const animationButtonLoading = `
	@keyframes button-loading {
		0%{ background-position: -468px 0 }
		100%{ background-position: 468px 0 }
	}`;

	const styleTag$1 = document.createElement('style');
	styleTag$1.type = 'text/css';
	styleTag$1.appendChild(document.createTextNode(animationButtonLoading));
	document.head.appendChild(styleTag$1);

	/**
	 * Fetch dates and prices for route from api and return lowest price.
	 * @param {String} route
	 * @returns {}
	 */
	const getMinPriceBothWays = async route => {
		let url = `${window.apiGateway || '//api.jetsmarter.com'}/priorityDatesList`;
		let priorityDatesList;
		try {
			priorityDatesList = await fetch(url, {
				method: 'POST', credentials: 'include', mode: "cors",
				headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
				body: JSON.stringify({
					lang: "en-US",
					lat: storedGeoIp.Latitude,
					lon: storedGeoIp.Longitude,
					production: location.host === 'jetsmarter.com' ? true : false,
					sroute: route.toUpperCase(),
					webapp: true
				})
			});
		} catch (error) {
			throw new Error(error);
		}

		priorityDatesList = await priorityDatesList.json();
		let routeAndPricePair;
		if (priorityDatesList.hasOwnProperty('prices')) {
			// [ [String from-to, int price], [String to-from, int price] ]
			routeAndPricePair = priorityDatesList.prices.map(priorityRouteDates => [
			// One of the two vectors.
			priorityRouteDates.route,
			// Find min price.
			priorityRouteDates.prices.reduce((out, iter) => {
				if (iter.price <= 0 || iter.price > out && out > 0) return out;else return parseFloat(iter.price).toFixed(2);
			}, 0)]);
		} else {
			// If it's broke then store null for both vectors
			let r = route.split(' - ');
			routeAndPricePair = [[route, null], [`${r[1]} - ${r[0]}`, null]];
			throw new Error('no field prices in priorityDatesList response');
		}
		return routeAndPricePair;
	};

	/**
	 * Small Proxy/Store
	 */
	const minPriceFor = {
		cache: {},
		listeners: {},
		/** Stores price and runs listeners and cleans after. */
		setRoutePrice({ price = null, callbackList = [], route = '' }) {
			this.cache[route] = price ? price : undefined;
			callbackList.forEach(fn => {
				if (typeof fn === 'function') fn(price);
			});
			this.listeners[route] = undefined;
		},
		registerNewRequest(from, to) {
			const route = [from, to].sort().join(' - ');
			const routeA = `${from} - ${to}`;
			const routeB = `${to} - ${from}`;
			this.listeners[routeA] = { res: [], rej: [] };
			this.listeners[routeB] = { res: [], rej: [] };
			requestAnimationFrame(() => getMinPriceBothWays(route).then(routePair => {
				routePair.forEach(routeAndPrice => this.setRoutePrice({
					price: routeAndPrice[1],
					callbackList: this.listeners[routeAndPrice[0]].res,
					route: routeAndPrice[0]
				}));
			}).catch(err => {
				[routeA, routeB].forEach(route => this.setRoutePrice({
					price: null,
					callbackList: this.listeners[route].rej,
					route: route
				}));
				throw new Error(err);
			}));
		},
		waitForPrice({ from, to, route }) {
			return new Promise((res, rej) => {
				if (!this.listeners.hasOwnProperty(route)) this.registerNewRequest(from, to);
				this.listeners[route].res.push(res);
				this.listeners[route].rej.push(rej);
			});
		},
		async get(from, to) {
			const route = `${from} - ${to}`;
			// return 0
			if (this.cache.hasOwnProperty(route)) return this.cache[route];else return await this.waitForPrice({ from, to, route });
		}
	};

	const toLocaleStringSupportsLocales = () => {
		try {
		} catch (e) {
			return false;
		}
		return true;
	};
	const localeStringSupport = toLocaleStringSupportsLocales();

	/** Min Price for Route Componet <min-price-for-route from={from} to={to}/>. */
	let bmpCss = instance;
	let bmpCssComponent$11 = bmpCss.define({
		name: 'min-price-for-route',
		cssjs: {
			'display': 'block',
			'height': '50px',
			'width': '120px',
			'border-radius': '6px',
			'transition-duration': FX.speed.fast,
			'position': 'relative',
			'overflow': 'hidden',
			'position': 'relative',
			'background': 'rgba(254, 106, 87, 1)',

			'&.loading-price': {

				'background': 'rgba(254, 106, 87, 0.6)',

				'&:after': {
					'content': "''",
					'display': 'block',
					'width': '100%',
					'height': '100%',
					'animation-duration': '1.5s',
					'animation-fill-mode': 'forwards',
					'animation-iteration-count': 'infinite',
					'animation-name': 'ghost-loading',
					'animation-timing-function': 'linear',
					'transition-timing-function': 'ease-out',
					'background': '#eeece7',
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'z-index': '-1',
					'background': 'linear-gradient(to right, rgba(254, 106, 87, 0) 0%, rgba(254, 106, 87, 0.75) 50%, rgba(254, 106, 87, 0) 100%)'
				}
			},

			'.h4-style': {
				'line-height': '50px'
			},

			'.route-start-price-preloader': {
				'svg': {
					'width': '20px',
					'height': '20px',
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'right': '0',
					'bottom': '0',
					'margin': 'auto'
				}
			}
		}
	});

	class MinPriceForRoute extends BMPVDWebComponent {
		constructor() {
			super();
		}

		async ready() {
			bmpCssComponent$11.attachStyles(this);
			this.classList.add('loading-price');
			this.context = this.observe({
				price: null
			});
			minPriceFor.get(this.getAttribute('from').toUpperCase(), this.getAttribute('to').toUpperCase()).then(price => {
				if (localeStringSupport) this.context.price = Math.ceil(price).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });else this.context.price = '$' + Math.ceil(price).toString();
				this.classList.remove('loading-price');
			}).catch(err => {
				throw new Error(err);
			});
		}

		render() {
			return ME.container({
				children: [this.context.price !== null ? h4(`color: ${COLOR.white};`, `${this.context.price}`) : null]
			});
		}
	}

	if (!customElements.get('min-price-for-route')) customElements.define('min-price-for-route', MinPriceForRoute);
	const minPriceForRoute = ({ from, to }) => BMPVD.createBMPVirtulaDOMElement('min-price-for-route', { from: from, to: to });

	/**
	 * Adds zero (0) to single character string
	 * @param {Number|String} n what need to convert
	 * @returns {String} self or 0+${self}
	 */
	const firstZero = n => String(n).length == 1 ? `0${n}` : n;

	/**
	 * Converts date to ddmmyy format,
	 * that used in most methods
	 * @param {Date} date
	 * @returns {String}
	 */
	const ddmmyy = date => {
		return [firstZero(date.getMonth() + 1), // mm
		firstZero(date.getDate()), // dd
		date.getFullYear().toString().substr(-2)].join('');
	};

	const toLocaleDateStringSupportsLocales = () => {
		try {
			new Date().toLocaleDateString('i');
		} catch (e) {
			return e.name === 'RangeError';
		}
		return false;
	};

	/**
	 * Converts date to locale string
	 * @param {Date} dateString what to convert
	 */
	const toLocaleStr = dateString => {
		if (!dateString) return '';
		let date = new Date(dateString);
		if (toLocaleDateStringSupportsLocales()) return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
		//, ${date.toLocaleDateString('en-US', { year: 'numeric' })}`
		else return dateString;
	};

	var _extends$7 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const bmpCssComponent$12 = instance.define({
		name: 'jet-leg-offer', cssjs: cssjs$9
	});

	class JetLegOffer extends BMPVDWebComponent {

		constructor() {
			super();
			this.cache = [];
			this.geo = getUserLocation();
		}

		async getLeg(legID) {
			if (this.cache[legID]) {
				return this.cache[legID];
			} else {
				const response = await fetch(`${window.apiGateway}/scheduledShuttleById`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						lang: "en-US",
						lat: this.geo.Latitude,
						lon: this.geo.Longitude,
						production: false,
						shuttle_id: legID.toString(),
						webapp: true
					})
				});
				const data = await response.json();
				if (data.status) {
					this.cache[legID] = data;
					return data;
				}
			}
		}

		encodeCityPath(city) {
			return city.replace(/ /g, '_').toLowerCase();
		}

		genURL(leg) {
			if (leg.extended_info && leg.departLocal) {
				const [origin, destination] = leg.extended_info.info.split(' - ');
				const date = new Date(leg.departLocal);
				date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
				let routeUrl = [this.encodeCityPath(origin), this.encodeCityPath(destination)];
				if (date) routeUrl.push(ddmmyy(date));
				return `/flights/${routeUrl.join('-')}/${leg.leg_id}/`;
			} else {
				return '';
			}
		}

		async loadOffers(leg) {
			if (leg) {
				const res = await this.getLeg(leg.leg_id);
				// this.context.offers = { ...leg, ...res.legs[0] }
				if (res) return _extends$7({}, leg, res.legs[0]);
			}
		}

		async ready() {
			bmpCssComponent$12.attachStyles(this);

			this.context = this.observe({
				offers: [],
				current: -1,
				opacity: 1,
				pending: true
			});

			if (!window.IS_SSR) {
				const rn = `RN(name='dynamo', instance_name='leg_offer').exclude(deleted='t').filter(published='t').order_by('position')`;
				const { data } = await resourceStorageInstance.getRN(rn);

				const legPromises = data.map(async offer => await this.loadOffers(offer));
				Promise.all(legPromises).then(value => {
					this.context.offers = value.filter(v => v !== undefined);
					this.context.pending = false;
				});
			}
		}

		trackClick() {
			SendGA.event({
				eventCategory: 'buttons',
				eventAction: 'clicked',
				eventLabel: 'flight offer'
			});
		}

		toLocaleDateStringSupportsLocales() {
			try {
				new Date().toLocaleDateString('i');
			} catch (e) {
				return e.name === 'RangeError';
			}
			return false;
		}

		renderDate(dateString) {
			let date = new Date(dateString);
			// date.setTime( date.getTime() + date.getTimezoneOffset() * 60 * 1000)
			if (this.toLocaleDateStringSupportsLocales()) {
				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					text(`color: ${COLOR.primary}; text-transform: uppercase;`, `${date.toLocaleDateString('en-US', { day: 'numeric' })} ${date.toLocaleDateString('en-US', { month: 'short' })}`),
					textSmall(`color: ${COLOR.primary}; font-weight: 200`, `${date.toLocaleDateString('en-US', { weekday: 'long' })}`)
				);
			} else {
				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					textSmall(`color: ${COLOR.primary}`, `${date.toLocaleDateString()}`)
				);
			}
		}

		render() {

			if (!this.context.pending && this.context.offers.length > 0) {
				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'leg-offer-slider-desktop' },
						BMPVD.createBMPVirtulaDOMElement(
							'swish-slider',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-slider',
								{ className: 'swish__leg-offer', controls: 'true', slides: '3' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'swish__slider' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'swish__slider_inner' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'swish__list' },
											this.context.offers.map(item => {
												return BMPVD.createBMPVirtulaDOMElement(
													'li',
													{ className: 'swish__item' },
													BMPVD.createBMPVirtulaDOMElement(
														'div',
														{ className: 'swish__item_inner' },
														BMPVD.createBMPVirtulaDOMElement(
															'bmp-anchor',
															null,
															BMPVD.createBMPVirtulaDOMElement(
																'a',
																{ className: 'swish__offer-content', href: this.genURL(item), onclick: () => this.trackClick() },
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__date' },
																	this.renderDate(item.departLocal)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__city' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			text(`color: ${COLOR.dark}`, `${item.origin}`)
																		),
																		BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.planeMedium({ color: COLOR.dark, w: 11, h: 10 }) }),
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			text(`color: ${COLOR.dark}`, `${item.destination}`)
																		)
																	)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__price' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		h4(`color: ${COLOR.primary}`, `${localeStringSupport ? Math.ceil(item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : item.price}`)
																	)
																)
															)
														)
													)
												);
											})
										)
									)
								),
								this.context.offers.length <= 3 ? null : BMPVD.createBMPVirtulaDOMElement(
									'div',
									null,
									BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__prev', safeHTML: svgIcon.sliderControl() }),
									BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__next', safeHTML: svgIcon.sliderControl() })
								)
							)
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'leg-offer-slider-tablet' },
						BMPVD.createBMPVirtulaDOMElement(
							'swish-slider',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-slider',
								{ className: 'swish__leg-offer', controls: 'true', slides: '2' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'swish__slider' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'swish__slider_inner' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'swish__list' },
											this.context.offers.map(item => {
												return BMPVD.createBMPVirtulaDOMElement(
													'li',
													{ className: 'swish__item' },
													BMPVD.createBMPVirtulaDOMElement(
														'div',
														{ className: 'swish__item_inner' },
														BMPVD.createBMPVirtulaDOMElement(
															'bmp-anchor',
															null,
															BMPVD.createBMPVirtulaDOMElement(
																'a',
																{ className: 'swish__offer-content', href: this.genURL(item), onclick: () => this.trackClick() },
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__date' },
																	this.renderDate(item.departLocal)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__city' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			text(`color: ${COLOR.dark}`, `${item.origin}`)
																		),
																		BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.planeMedium({ color: COLOR.dark, w: 11, h: 10 }) }),
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			text(`color: ${COLOR.dark}`, `${item.destination}`)
																		)
																	)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__price' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		h4(`color: ${COLOR.primary}`, `${localeStringSupport ? Math.ceil(item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : item.price}`)
																	)
																)
															)
														)
													)
												);
											})
										)
									)
								),
								this.context.offers.length <= 2 ? null : BMPVD.createBMPVirtulaDOMElement(
									'div',
									null,
									BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__prev', safeHTML: svgIcon.sliderControl() }),
									BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__next', safeHTML: svgIcon.sliderControl() })
								)
							)
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'leg-offer-slider-mobile' },
						BMPVD.createBMPVirtulaDOMElement(
							'swish-slider',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-slider',
								{ className: 'swish__leg-offer', slides: '1', 'shifted-delta': '1.2' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'swish__slider' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'swish__slider_inner' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'swish__list' },
											this.context.offers.map(item => {
												return BMPVD.createBMPVirtulaDOMElement(
													'li',
													{ className: 'swish__item' },
													BMPVD.createBMPVirtulaDOMElement(
														'div',
														{ className: 'swish__item_inner' },
														BMPVD.createBMPVirtulaDOMElement(
															'bmp-anchor',
															null,
															BMPVD.createBMPVirtulaDOMElement(
																'a',
																{ className: 'swish__offer-content', href: this.genURL(item), onclick: () => this.trackClick() },
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__date' },
																	this.renderDate(item.departLocal)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__city' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			textSmall(`color: ${COLOR.dark}`, `${item.origin}`)
																		),
																		BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.planeMedium({ color: COLOR.dark, w: 11, h: 10 }) }),
																		BMPVD.createBMPVirtulaDOMElement(
																			'div',
																			null,
																			textSmall(`color: ${COLOR.dark}`, `${item.destination}`)
																		)
																	)
																),
																BMPVD.createBMPVirtulaDOMElement(
																	'div',
																	{ className: 'offer-content__price' },
																	BMPVD.createBMPVirtulaDOMElement(
																		'div',
																		null,
																		h4(`color: ${COLOR.primary}`, `${localeStringSupport ? Math.ceil(item.price).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : item.price}`)
																	)
																)
															)
														)
													)
												);
											})
										)
									)
								)
							)
						)
					)
				);
			} else if (!this.context.pending && this.context.offers.length == 0) {

				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					'\xA0'
				);
			} else {

				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'fake-slider' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fake-slider-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'fake-slider-inner' })
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fake-slider-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'fake-slider-inner' })
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fake-slider-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'fake-slider-inner' })
					)
				);
			}
		}
	}

	if (!customElements.get('jet-leg-offer')) customElements.define('jet-leg-offer', JetLegOffer);

	let promise = null;
	let routeRegionsList = [];
	const routesRegionListPromise = () => {
		if (!promise) {
			promise = fetch(`${window.apiGateway}/priorityRoutesList`, {
				method: 'POST',
				credentials: 'include'
			}).then(response => response.json()).then(response => {
				routeRegionsList = [...response.list];
				return response;
			});
		}
		return promise;
	};

	const removeDuplicates = (arr, ...props) => {
		return arr.filter((obj, pos, arr) => {
			return arr.map(mapObj => props.map(prop => [mapObj[prop]]).join(',')).indexOf(props.map(prop => obj[prop]).join(',')) === pos;
		});
	};

	const getRoundTrips = routes => {
		return routes.reduce((output, [from, to]) => {
			// return round trip
			return [...output, [to, from], [from, to]];
		}, []);
	};

	const getExistedCities = async () => {
		const data = await routesRegionListPromise();
		return removeDuplicates([...data.list.reduce((result, region) => {
			return [...result, ...region.routes.reduce((output, [from, to]) => {
				// add self route and return flight
				return [...output, ...[to, from]];
			}, [])];
		}, [])], 'icao', 'city');
	};

	/** Will return filtered shuttle routes where origin one of the items in passed Array
	 * @param { Array } reference ICAO code of origin in upper case
	 * @return { Array } list of destination routes that whas mapped to origin
	 */
	const whereOriginIn = (reference = [], column) => {
		if (!Array.isArray(reference)) reference = [reference];
		reference = reference.map(el => el.toUpperCase());

		return routeRegionsList.reduce((output, region) => {
			// filter all routes where reference includes origin
			return [...output, ...getRoundTrips(region.routes).filter(([origin, destination]) => reference.includes(origin[column].toUpperCase()))];
		}, []).map(([origin, destination]) => destination); // map array to destination value
	};

	const findValidRoute = (refFrom, refTo) => {
		return routeRegionsList.reduce((result, region) => {
			return [...result, ...getRoundTrips(region.routes)];
		}, []).find(([from, to]) => {
			return refFrom.includes(from.city) && refTo.includes(to.city);
		});
	};

	const findArea = (value, maList, checkIcao = false) => {
		if (!value) return null;
		value = decodeURIComponent(value).toUpperCase();

		let area = maList.find(area => area.reference.includes(value));
		if (!area && checkIcao) area = maList.find(area => area.icao.includes(value));

		return area ? toMetropolitan(area, area.ma) : null;
	};

	const toMetropolitan = (area, rawSuggestionString = '') => ({
		label: `${rawSuggestionString}${rawSuggestionString == area.ma ? '' : ` (${area.ma})`}`,
		ma: area.ma,
		value: area.ma,
		icao: area.icao,
		reference: area.reference
	});

	/** Generates list of sugestion fields for 'city', 'icao', 'iata' cols of row in metropolitan area DataSet
	 * expect - [{ label: 'Los Angeles (South Florida)', ma: 'California' },...]
	*/
	const transformDataSet = (maLikeDataSet, searchString, cols) => {
		const regex = new RegExp(`^${escapeRegex(searchString)}`, 'i');
		return maLikeDataSet.reduce((output, area) => {
			let flatedSuggestions = cols.reduce((colsOutPut, colsIter) => {
				let suggestions = area[colsIter].filter(suggestion => regex.test(suggestion)).map(rawSuggestionString => toMetropolitan(area, rawSuggestionString, false));
				return [...colsOutPut, ...suggestions];
			}, []);
			return [...output, ...flatedSuggestions];
		}, []);
	};

	const filterByReference = (reference, areas) => {
		// find destination routes by origin icao(s)
		let priorityRoutes = whereOriginIn(reference, 'city');
		if (!priorityRoutes) priorityRoutes = whereOriginIn(reference, 'icao');

		// find metropolitan areas by origin routes
		return areas.filter(area => {
			return priorityRoutes.find(route => area.icao.includes(route.icao));
		});
	};

	const getAreas = async () => {
		if (window.JETSM_MA) return window.JETSM_MA;
		const rnQuery = `RN(name='dynamo', instance_name='metropolitan_areas', type='detail').f(published=True)`;
		const { data } = await resourceStorageInstance.getRN(rnQuery);
		return JSON.parse(data.content);
	};

	let formatAreasPromise;
	const formatAreas = () => {
		if (formatAreasPromise) return formatAreasPromise;

		formatAreasPromise = new Promise(async resolve => {
			const [areas, routes] = await Promise.all([getAreas(), getExistedCities()]);
			routes.forEach(route => {

				let area = areas.find(({ ma, icao, _icao }) => icao.includes(route.icao) || _icao && _icao.includes(route.icao) || ma.toUpperCase() == route.city.toUpperCase());
				if (area) {
					if (area.reference && area.reference.length) {
						if (!area.reference.includes(route.city)) area.reference.push(route.city);

						if (!area.icao.includes(route.icao))
							// area was associated with api route
							area.icao.push(route.icao);
					} else {
						// area not associated, so do it now
						area._icao = area.icao;
						area.icao = [route.icao];
						area.reference = [route.city];
					}
				} else {
					// area not found, add it to list
					areas.push({
						ma: route.city,
						city: [route.city],
						icao: [route.icao],
						iata: [],
						reference: [route.city]
					});
				}
			});
			resolve(areas.filter(area => Array.isArray(area.reference)));
		});
		return formatAreasPromise;
	};

	const cssjs$10 = {
		display: 'block',
		overflow: 'hidden',
		background: COLOR.white,

		'&:before': {
			display: 'block',
			height: '1px',
			background: COLOR.neutral,
			width: '100%'
		},
		'&:after': {
			display: 'block',
			height: '1px',
			background: COLOR.neutral,
			width: '100%'
		},
		'&.top-border': {
			"&:before": {
				content: ""
			}
		},
		'.spinner__outer': {
			height: '40px'
		},
		'.spinner__inner': {
			height: '40px'
		},
		'&.bottom-border': {
			"&:after": {
				content: ""
			}
		},
		'&.airports': {
			background: COLOR.light,
			'.option': {
				padding: '15px 3.9em 15px 44px'
			}
		},
		'.option': {
			'font-size': '20px',
			'font-weight': '300',
			'padding': '15px 43px', //TODO responsive
			color: `${COLOR.dark}`,
			cursor: 'pointer',
			position: 'relative',
			'&:first-child': {
				'margin-top': '10px'
			},
			'&:last-child': {
				'margin-bottom': '10px'
			},
			'.suggest-icon': {
				position: 'absolute',
				top: '50%',
				left: '13px',
				width: '22px',
				'-webkit-transform': 'translate3d(0, -50%, 0)',
				transform: 'translate3d(0, -50%, 0)',
				svg: {
					display: 'block',
					margin: '0 auto'
				},
				path: {
					// fill: '#A7A299',
					stroke: 'transparent'
				}
			},
			'.suffix': {
				position: 'absolute',
				top: '50%',
				'-webkit-transform': 'translate3d(0, -50%, 0)',
				transform: 'translate3d(0, -50%, 0)',
				'text-align': 'right',
				right: '20px',
				color: '#A7A299', // TODO: typography
				'margin-left': '10px',
				display: 'inline-block',
				'vertical-align': 'middle'
			},
			'.geo-flag': {
				position: 'absolute',
				top: '50%',
				'-webkit-transform': 'translate3d(0, -50%, 0)',
				transform: 'translate3d(0, -50%, 0)',
				right: '20px',
				span: {
					color: COLOR.darkMedium,
					'margin-left': '10px',
					display: 'inline-block',
					'vertical-align': 'middle'

				}

			},
			'&.separator': {
				'border-top': `1px solid ${COLOR.neutral}`,
				'padding-top': '20px',
				'margin-top': '10px',
				'.suggest-icon': {
					top: 'calc(50% + 5px)'
				}
			},
			'&.highlighted': {
				color: `${COLOR.light}`,
				background: `${COLOR.primary}`,
				'.suffix': {
					color: `${COLOR.light}`
				},
				'.suggest-icon': {
					path: {
						fill: COLOR.light,
						stroke: 'transparent'
					}
				},
				'.geo-flag': {
					path: {
						stroke: COLOR.light
					},
					span: {
						color: COLOR.light
					}
				}
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let css = instance.define({
		name: 'jetsm-suggestion',
		cssjs: cssjs$10
	});

	class BaseSuggestion extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static get observedAttributes() {
			return ['users-input'];
		}

		get filter() {
			try {
				return JSON.parse(this.getAttribute('filter'));
			} catch (e) {
				return this.getAttribute('filter');
			}
		}

		async attributeChangedCallback(name, oldval, newval) {
			if (name == 'users-input') {
				if (this.context) {
					this.context.results = [];
					this.context.results = await this.getSuggestionList(newval || '');
				} else this.usersInput = newval;
			}
		}

		getSuggestionList() {
			// override this fn in your class and return array of ma
			return [];
		}

		async onAttached() {
			css.attachStyles(this);
			this.classList.add(this.slug);
			this.context.results = await this.getSuggestionList(this.usersInput || '');
		}

		change(option) {
			const index = option.getAttribute('data-index');
			const area = this.context.results[index];
			const ev = new CustomEvent('complete', { detail: area });
			this.dispatchEvent(ev);
		}

		ready() {
			this.context = this.observe({
				icon: null,
				pending: false,
				results: [],
				highlighted: null
			});
		}

		highlight(option) {
			const index = parseInt(option.getAttribute('data-index'), 10);[...this.querySelectorAll('.option')].forEach((el, i) => el.classList[i == index ? 'add' : 'remove']('highlighted'));
			this.context.highlighted = index;
		}

		render() {
			const { icon, results, pending, highlighted } = this.context;
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'autosuggest-result-list' },
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': `spinner inline preloader ${pending ? '' : 'hidden'}`, safeHTML: svgIcon.preloader() }),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'result-outer', onmouseout: ev => this.context.highlighted = null },
					results.map((result, i) => BMPVD.createBMPVirtulaDOMElement(
						'div',
						{
							'class': `option ${highlighted === i ? 'highlighted' : ''}`,
							'data-index': i.toString(),
							onmouseover: ev => this.highlight(ev.target.closest('.option')),
							onclick: ev => this.change(ev.target.closest('.option')),
							'data-label': result.label,
							'data-value': JSON.stringify(result)
						},
						icon ? BMPVD.createBMPVirtulaDOMElement('span', { 'class': 'suggest-icon', safeHTML: icon }) : null,
						BMPVD.createBMPVirtulaDOMElement(
							'span',
							null,
							result.label
						),
						result.suffix || null
					))
				)
			);
		}

	}

	/** Specific for metropolitan areas array */
	const sortMetropolitanAreas = (maArray, field = 'ma') => {
		let newMaArray = [...maArray, ...[]];
		newMaArray.sort((a, b) => {
			if (a[field] < b[field]) return -1;
			if (a[field] > b[field]) return 1;
			return 0;
		});
		return newMaArray;
	};
	const alphabeticSortRoutes = (routeArray, field = 'city') => {
		const sorted = [...routeArray];
		sorted.sort((a, b) => {
			if (a[0][field] < b[0][field]) return -1;
			if (a[0][field] > b[0][field]) return 1;
			return 0;
		});
		return sorted;
	};

	/** Borrowed at https://github.com/tiaanduplessis/sort-by-distance */

	const distance = (p1, p2) => Math.abs(Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1])));

	/** Specific for metropolitan areas array */
	const sortMetropolitanAreas$1 = (inputCoords, maArray) => {
		let newMaArray = [...maArray, ...[]];
		newMaArray.sort((a, b) => a.coords && b.coords && distance(inputCoords, a.coords) - distance(inputCoords, b.coords));
		return newMaArray;
	};

	class MaSuggestion extends BaseSuggestion {

		constructor() {
			super();

			// desired column names in metropolitan area that we want to use to build suggestions
			this.slug = 'metropolitan';
			this.colsToSuggest = ['city', 'icao', 'iata'];
		}

		removeGeoSuggestion(areas) {
			const geo = getUserLocation();
			const [nearestArea] = sortMetropolitanAreas$1([geo.Latitude, geo.Longitude], this.allAreas);
			return areas.filter(area => area.ma != nearestArea.ma);
		}

		async getSuggestionList(usersInput) {
	[this.allAreas] = await Promise.all([formatAreas(), routesRegionListPromise() // dependency of filterByReference
			]);
			let areas = [];

			// sort by alphabetic
			areas = sortMetropolitanAreas(this.allAreas);
			// exclude neares area
			if (usersInput.length == 0 && !this.filter) areas = this.removeGeoSuggestion(areas);
			// sort by filter
			if (this.filter) areas = filterByReference(this.filter, areas);

			let result = null;
			if (usersInput.length === 0) {
				result = areas.map(rowOfDataSet => toMetropolitan(rowOfDataSet, rowOfDataSet.ma));
			} else {
				result = transformDataSet(areas, usersInput, this.colsToSuggest);
			}

			this.classList[!usersInput.length && result.length ? 'add' : 'remove']('top-border');
			this.classList[usersInput.length > 2 && result.length ? 'add' : 'remove']('bottom-border');
			return result;
		}

		async ready() {
			await super.ready();
			this.context.icon = svgIcon.country();
		}
	}

	customElements.define('ma-suggestion', MaSuggestion);

	class GeoSuggestion extends BaseSuggestion {

		constructor() {
			super();
			this.slug = 'geo';
		}

		async getSuggestionList(usersInput) {
			if (usersInput.length != 0 || this.filter) return [];

			this.allAreas = await formatAreas();
			const geo = getUserLocation();

			const [firstSuggestion] = sortMetropolitanAreas$1([geo.Latitude, geo.Longitude], this.allAreas);
			const result = toMetropolitan(firstSuggestion, firstSuggestion.ma);
			result.suffix = BMPVD.createBMPVirtulaDOMElement(
				"div",
				{ "class": "geo-flag" },
				BMPVD.createBMPVirtulaDOMElement("span", { safeHTML: svgIcon.pin() }),
				BMPVD.createBMPVirtulaDOMElement(
					"span",
					null,
					"GEO"
				)
			);
			return [result];
		}

		async ready() {
			await super.ready();
			this.context.icon = svgIcon.country();
		}
	}

	customElements.define('geo-suggestion', GeoSuggestion);

	const AIRPORTS_LIMIT = 20;
	const cache = {};
	const cols = ['name', 'city', 'state', 'country', 'icaoCode', 'iataCode'];

	const forbiddenCodes = ['NICE', 'UTAH', 'PISA', 'WACO'];
	const isIcao = (code, areas) => /^[a-z0-9]{4}$/i.test(code) && !forbiddenCodes.includes(code.toUpperCase());

	const fetchAirports = async input => {
		const query = `
			airports: AirportsQ(q: "${input}") {
				edges {
					node { ${cols.join(',')} }
				}
			}
		`;
		const result = await resourceStorageInstance.graphRequest(query, 'GET');
		return result && result.data ? result.data : null;
	};

	const findAirport = async searchIcao => {
		searchIcao = searchIcao.toUpperCase();
		const airports = await getAirportList(searchIcao);
		const result = airports.find(({ icaoCode }) => icaoCode == searchIcao);
		return result ? unifyAirport(result) : null;
	};

	/** Dont know how to fix this shit. */
	const unifyAirport = airport => ({
		// label of html element
		label: airport.name,
		// suffix of html element
		suffix: BMPVD.createBMPVirtulaDOMElement(
			'span',
			{ 'class': 'suffix' },
			airport.icaoCode
		),
		// icao code of airport
		icao: airport.icaoCode,
		// airport name
		ma: airport.name,
		// what we will send to api
		value: airport.icaoCode,
		reference: [airport.icaoCode],
		isAirport: true
	});

	const filterByInput = (airports, input) => {
		const regex = new RegExp(`^${escapeRegex(input)}`, 'i');
		return airports.filter(airport => {
			return cols.find(col => regex.test(airport[col]));
		}).map(unifyAirport);
	};

	const getAirportList = async input => {
		const first3digit = input.slice(0, 3);
		if (!Array.isArray(cache[first3digit])) {
			let data = await fetchAirports(first3digit);

			if (data && data.airports) {
				cache[first3digit] = data.airports.edges.map(({ node }) => node);
			}
		}
		return Array.isArray(cache[first3digit]) ? cache[first3digit].slice(0, AIRPORTS_LIMIT) : [];
	};

	class AirportsSuggestion extends BaseSuggestion {

		constructor() {
			super();
			this.cache = {};
			this.slug = 'airports';
		}

		fakeWait(length) {
			if (length === 3 && this.oldLength < length) {
				this.waiter = new Promise(resolve => setTimeout(resolve, 1000));
			}
			this.oldLength = length;
			return this.waiter;
		}

		async getSuggestionList(usersInput) {
			// let transformedData = transformDataSet( this.areas, usersInput, colsToSuggest )

			const fakeWaiter = this.fakeWait(usersInput.length);
			if (usersInput.length >= 3) {
				this.context.pending = true;
				let [airports] = await Promise.all([getAirportList(usersInput), fakeWaiter]);
				this.context.pending = false;

				// if (this.filter) this.removeSiblingIcao(this.filter)
				const result = filterByInput(airports, usersInput);

				this.classList[result.length ? 'add' : 'remove']('filled');
				return result;
			} else {
				return [];
			}
		}

		async ready() {
			await super.ready();
			this.context.icon = svgIcon.small_plane();
		}

	}

	customElements.define('airports-suggestion', AirportsSuggestion);

	let styles = instance.define({
		name: 'jet-datepicker',
		cssjs: {
			'display': 'block',
			'@media(max-width: 480px)': {
				'margin-top': '60px',
				'.date-picker-container': {
					'box-shadow': 'none'
				}
			}
		}
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	class PriceDatepicker extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static get observedAttributes() {
			return ['origin', 'destination'];
		}

		// TODO: u can use it inside BMPVDWebComponent
		// get props() {
		// 	return ([...this.attributes]).reduce((result, attr) => ({
		// 		...result,
		// 		[attr.name]: attr.value
		// 	}), {})
		// }

		async trackRoute() {
			if (this.context.destination && this.context.origin) {
				const slugify = s => s.replace(/ /g, '_').toLowerCase();
				const page = `/flights/${slugify(this.context.origin)}-${slugify(this.context.destination)}`;
				SendGA.pageview({ page });
				SendGA.event({
					eventCategory: 'forms',
					eventAction: 'submitted',
					eventLabel: 'search'
				});
			}
		}

		attributeChangedCallback(attribute, oldval, newval) {
			if (this.context) {
				this.trackRoute();
				switch (attribute) {
					case "origin":
						this.context.origin = newval;
						break;
					case "destination":
						this.context.destination = newval;
						break;
				}
			}
		}

		ready() {
			styles.attachStyles(this);
			this.context = this.observe({
				origin: this.getAttribute('origin'),
				destination: this.getAttribute('destination')
			});
			this.trackRoute();
		}

		disconnectedCallback() {
			this.dispatchEvent(new CustomEvent('detach'));
		}

		connectedCallback() {
			super.connectedCallback();
			this.dispatchEvent(new CustomEvent('attach'));
		}

		render() {
			const router = document.querySelector('bmp-router');
			const { origin, destination } = this.context;
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'date-picker' },
				ReactCaller$1.run('datePicker', origin, destination, this, router.go.bind(router))
			);
		}
	}

	if (!customElements.get('price-datepicker')) customElements.define('price-datepicker', PriceDatepicker);

	const priceDatepicker = args => BMPVD.createBMPVirtulaDOMElement('price-datepicker', args);

	// ==================

	class PriceDatepickerTrack extends PriceDatepicker {

		constructor() {
			super();
		}

		ready() {
			styles.attachStyles(this);
			this.context = this.observe({
				origin: this.props.origin,
				destination: this.props.destination
			});
		}

		render() {
			const { origin, destination } = this.context;
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'date-picker' },
				ReactCaller$1.run('datePicker', origin, destination, this, path => {
					// console.log('callback calndar')
				})
			);
		}
	}

	if (!customElements.get('price-datepicker-track')) customElements.define('price-datepicker-track', PriceDatepickerTrack);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const firstZero$1 = int => String(int).length == 2 ? int : `0${int}`;
	const format = date => {
		return [firstZero$1(date.getMonth() + 1), firstZero$1(date.getDate())].join('');
	};
	const slugify = s => s.replace(/ /g, '_').toLowerCase();

	class SimpleDatepicker extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static get observedAttributes() {
			return ['origin', 'destination'];
		}

		// TODO: u can use it inside BMPVDWebComponent
		// get props() {
		// 	return ([...this.attributes]).reduce((result, attr) => ({
		// 		...result,
		// 		[attr.name]: attr.value
		// 	}), {})
		// }


		attributeChangedCallback(attribute, oldval, newval) {
			if (this.context) {
				switch (attribute) {
					case "origin":
						this.context.origin = newval;
						break;
					case "destination":
						this.context.destination = newval;
						break;
				}
			}
		}

		disconnectedCallback() {
			this.dispatchEvent(new CustomEvent('detach'));
		}

		connectedCallback() {
			super.connectedCallback();
			this.dispatchEvent(new CustomEvent('attach'));
		}

		ready() {
			styles.attachStyles(this);
			this.context = this.observe({
				origin: this.getAttribute('origin'),
				destination: this.getAttribute('destination')
			});
		}

		/**
		*
		* @param { Date } date
		*/
		selectDate(date) {
			const { origin, destination } = this.context;
			if (destination && origin) {
				const page = `/flights/${slugify(origin)}-${slugify(destination)}-${format(date)}/`;
				SendGA.pageview({ page });
				SendGA.event({
					eventCategory: 'forms',
					eventAction: 'submitted',
					eventLabel: 'search'
				});
				document.querySelector('bmp-router').go(page);
			}
		}

		renderReact(el) {
			ReactCaller$1.run('simpleCalendar', el, date => this.selectDate(date)
			// { origin, destination }
			);
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement('div', { ref: el => this.renderReact(el), style: 'position: relative;' });
		}
	}

	if (!customElements.get('simple-datepicker')) customElements.define('simple-datepicker', SimpleDatepicker);

	const simpleDatepicker = arg => BMPVD.createBMPVirtulaDOMElement('simple-datepicker', arg);

	var _extends$8 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	let bmpCssComponent$13 = instance.define({
		name: 'jet-search', cssjs: cssjs$7
	});
	const getSibling = field => field == 'origin' ? 'destination' : 'origin';
	const rand = (min, max) => {
		return parseInt(Math.random() * (max - min) + min, 10);
	};

	const labels = {
		origin: "From",
		destination: 'To'
	};
	class JetSearch extends BMPVDWebComponent {
		constructor() {
			super();
		}

		getIcao(field) {
			if (isIcao(field.value))
				// value is already icao
				return field.value;else
				// find area and get first icao code
				return this.areas.find(area => field.reference.find(ref => area.reference.includes(ref))).icao[0];
		}

		async checkAttributes(origin, destination) {

			const autofocusField = getUrlParams('focus');
			if (!origin) origin = getUrlParams('origin');
			if (!destination) destination = getUrlParams('destination');

			if (origin) {
				this.context.origin = isIcao(origin) ? await findAirport(origin) : findArea(origin, this.areas);
				this.hookValueChaged();
			}
			if (destination) {
				this.context.destination = isIcao(destination) ? await findAirport(destination) : findArea(destination, this.areas);
				this.hookValueChaged();
			}

			if (['origin', 'destination'].includes(autofocusField)) this.createAutosuggest(autofocusField, autofocusField == 'origin' ? origin : destination);
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.refCheckUrl, false);
		}

		onAttached() {
			this.checkAttributes(this.getAttribute('origin'), this.getAttribute('destination'));
			this.refCheckUrl = () => this.checkAttributes();
			window.addEventListener('popstate', this.refCheckUrl, false);
		}

		async ready() {
			bmpCssComponent$13.attachStyles(this);

			const titles = [BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Experience aviation\xA0as it\xA0was meant to\xA0be'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Discover the\xA0smarter way to\xA0fly'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Skip the\xA0lines and\xA0save the\xA0time'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Jet through life on\xA0your own\xA0terms'
			)];
			const slogan = titles[rand(0, titles.length)];

			this.reversed = false;
			this.context = this.observe({
				titleText: slogan,
				origin: null,
				destination: null,
				errors: {
					origin: null,
					destination: null
				}
			});
			this.areas = (await formatAreas()).filter(area => !!area.reference);
		}

		hookValueChaged() {
			const { origin, destination } = this.context;
			this.classList[origin || destination ? 'add' : 'remove']('in-top');
			this.classList[origin && destination ? 'add' : 'remove']('filled');
			// bmpStorageInstance.setToStorage( 'search.selected_route', {
			// 	from: origin,
			// 	to: destination
			// })
		}

		reverseRoute() {
			this.reversed = !this.reversed;
			const { origin, destination } = this.context;
			if (origin && destination) {
				this.context.destination = origin;
				this.context.origin = destination;
			}
			this.hookValueChaged();
		}

		getSuggestTemplate(filter, usersInput = '', complete) {
			const args = {
				'users-input': (usersInput || '').trim(),
				filter: filter instanceof Object ? JSON.stringify(filter) : filter,
				oncomplete: ev => complete(ev)
			};
			return [BMPVD.createBMPVirtulaDOMElement('geo-suggestion', args), BMPVD.createBMPVirtulaDOMElement('ma-suggestion', args), BMPVD.createBMPVirtulaDOMElement('airports-suggestion', args)];
		}

		getReferenceRoute(origin, destination) {
			const referenceFrom = origin && origin.reference;
			const referenceTo = destination && destination.reference;
			if (Array.isArray(referenceFrom) && Array.isArray(referenceTo)) {
				const route = findValidRoute(referenceFrom, referenceTo);
				if (route) {
					const [from, to] = route;
					return {
						origin: from.city,
						destination: to.city
					};
				}
			}
			return { origin: null, destination: null };
		}

		getCalendar(origin, destination) {

			if (isIcao(origin.value) || isIcao(destination.value)) {
				return simpleDatepicker({
					origin: this.getIcao(origin),
					destination: this.getIcao(destination),
					onattach: () => this.dispatchEvent(new CustomEvent('calendarshow', { detail: 'simple' })),
					ondetach: () => this.dispatchEvent(new CustomEvent('calendarhide', { detail: 'simple' }))
				});
			} else {
				return priceDatepicker(_extends$8({}, this.getReferenceRoute(origin, destination), {
					onattach: () => this.dispatchEvent(new CustomEvent('calendarshow', { detail: 'price' })),
					ondetach: () => this.dispatchEvent(new CustomEvent('calendarhide', { detail: 'price' }))
				}));
			}
		}

		createAutosuggest(name) {
			const sibling = getSibling(name);
			let filter = null;
			if (this.context[sibling]) filter = this.context[sibling].reference;

			this.context.errors = { origin: null, destination: null };
			const change = (el, ev) => el.dispatchEvent(new CustomEvent('complete', ev));
			const value = this.context[name] ? this.context[name].ma : '';
			const autosuggest = AutosuggestField.create({
				relativeEl: this.querySelector(`[data-name="${name}"]`),
				name, value,
				resultsList: this.getSuggestTemplate(filter, value, ev => change(autosuggest, ev))
			});

			autosuggest.addEventListener('update', ({ detail: usersInput }) => {
				autosuggest.resultsList = this.getSuggestTemplate(filter, usersInput, ev => change(autosuggest, ev));
			});

			autosuggest.addEventListener('error', () => {
				this.context[name] = null;
				// this.context.errors[name] = detail.usersInput
			});

			autosuggest.addEventListener('complete', ({ detail }) => {
				this.context[name] = detail;
				this.hookValueChaged();

				autosuggest._refRemove();

				if (!isMobile() && !this.context[sibling] && this.context[name])
					// focus on another field (it is not filled, current field is filled)
					this.createAutosuggest(sibling);
			});

			this.repositionWidget = () => {
				const updateEvent = new CustomEvent('reposition');
				autosuggest.dispatchEvent(updateEvent);
				setTimeout(() => autosuggest.dispatchEvent(updateEvent), 310);
			};
			autosuggest.addEventListener('remove', () => {
				this.removeEventListener('calendarshow', this.repositionWidget, false);
				this.removeEventListener('calendarhide', this.repositionWidget, false);
			});

			this.addEventListener('calendarshow', this.repositionWidget, false);
			this.addEventListener('calendarhide', this.repositionWidget, false);
		}

		clearValue(fieldName) {
			this.context.errors[fieldName] = null;
			this.context[fieldName] = null;
			this.createAutosuggest(fieldName);
			this.hookValueChaged();
		}

		render() {
			const { origin, destination, errors } = this.context;

			return ME.layout.grid({
				mod: { phone: { margin: 0, gutter: 0 } },
				children: [ME.layout.cell({ common: 1, phone: 0, align: 'middle' }), ME.layout.cell({ common: 10, phone: 12, align: 'middle' }, ME.layout.grid({
					mod: { desktop: { margin: '0 0 20px' } },
					children: [ME.layout.cell({ common: 12 }, origin && destination ? null : h3('color:#EEECE7;text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);', BMPVD.createBMPVirtulaDOMElement(
						'span',
						null,
						this.context.titleText
					)))]
				}), BMPVD.createBMPVirtulaDOMElement(
					'form',
					{ 'class': origin && destination ? 'can-be-reversed' : '' },
					ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.inner(BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ 'class': (this.reversed ? 'reversed' : '') + ' search-reverse', onclick: ev => this.reverseRoute() },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'search-reverse-inner' },
								BMPVD.createBMPVirtulaDOMElement('div', { className: 'search-reverse-icon', safeHTML: svgIcon.swipeSearch() })
							)
						), ...['origin', 'destination'].map(fieldName => ME.layout.cell({ common: 6, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: `jet-search-field-inner with-icon ${fieldName} ${this.context[fieldName] ? ' filled' : ''}` },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ 'class': `fake-input ${errors[fieldName] ? 'error' : ''}`, 'data-name': fieldName, onclick: ev => this.createAutosuggest(fieldName) },
								BMPVD.createBMPVirtulaDOMElement('span', { 'class': 'icon', safeHTML: svgIcon[`search${fieldName}`]() }),
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ 'class': 'label' },
									this.context[fieldName] ? this.context[fieldName].ma : errors[fieldName] || labels[fieldName]
								)
							),
							BMPVD.createBMPVirtulaDOMElement('div', { className: 'close-btn', safeHTML: svgIcon.searchClose(), onclick: ev => this.clearValue(fieldName) })
						))), origin && destination ? ME.layout.cell({ common: 12 }, this.getCalendar(origin, destination)) : null))]
					})
				)
				// <jet-leg-offer style={`${legOfferOpacity}`}></jet-leg-offer>
				// <jet-leg-offer></jet-leg-offer>
				//origin && destination ? null :
				//	ME.container({
				//		mod: { class: 'relative' },
				//		children: [
				//			ME.layout.grid({
				//				mod: { desktop: { margin: 0, gutter: 0 } },
				//				children: [
				//					ME.layout.cell({ common: 12 },
				//						<div>
				//							<jet-leg-offer></jet-leg-offer>
				//						</div>
				//					)
				//				]
				//			})
				//		]
				//	})
				)]
			});
		}

	}

	customElements.define('jet-search', JetSearch);

	const cssjs$11 = {
		'display': 'block',
		'width': '100%',

		'&[theme]': {
			'.search-bg-inner': {
				display: 'none'
			}
		},
		'.jetsm-search-inner': {
			'width': '100%',
			'display': 'block',
			// 'background': 'rgba(0,0,0,0.3)',
			'position': 'relative',
			// 'padding': '10px 10px 0 10px',
			'font-family': 'Roboto',
			'max-width': '1200px',
			'margin': 'auto'
		},
		'.jetsm-search-outer > .mdc-layout-grid': {
			'max-width': '1210px'
		},
		'.jetsm-search-inner': {
			background: 'rgba(0,0,0,.3)',
			'border-radius': FX.radius.medium
		},
		'.search-bg-inner': {
			position: 'absolute',
			left: 0,
			top: 0,
			height: '100%',
			width: '100%',
			'z-index': '-1',
			'.mdc-layout-grid': {
				height: '100%'
			},
			'.mdc-layout-grid__inner': {
				height: '100%'
			},
			'.mdc-layout-grid__cell--span-10': {
				position: 'relative',
				'@media(max-width: 1200px)': {
					width: '100%',
					'grid-column-end': 'span 12'
				}
			}
		},
		'.search-bg-color': {},

		'.search-buttons': {
			'display': 'flex'
		},
		'.search-button-item': {
			'position': 'relative',
			'input': {
				'opacity': '0',
				'position': 'absolute',
				'top': '0',
				'left': '0',
				'z-index': '0'
			},
			'label': {
				'width': '103px',
				'display': 'block',
				'height': '28px',
				'border': '1px solid transparent',
				'text-align': 'center',
				'border-radius': FX.radius.small,
				'margin-right': '5px',
				'line-height': '28px',
				'font-size': '13px',
				'cursor': 'pointer',
				'z-index': '1',
				'position': 'relative',
				'transition-duration': FX.speed.fast
			},
			'input:checked + label': {
				'border': '1px solid #fff'
			},
			'input:hover + label': {
				'border': '1px solid #fff'
			}
		},

		'.control-buttons': {
			'display': 'flex',
			'justify-content': 'space-between',
			'align-items': 'center',
			'flex-wrap': 'wrap'
			// 'padding': '0 0 10px',

			// '.control-buttons-item': {
			// 	'width': '50%',
			// }
		},

		'.add-leg': {
			'color': COLOR.white,
			'cursor': 'pointer',
			'padding': '0',
			'margin': '0',
			'background': 'transparent',
			'border': 'none',
			'-webkit-appearance': 'none',
			'-moz-appearance': 'none',
			'appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'outline': 'none',
			'font-size': '13px',
			'font-family': 'Roboto'
		},

		'.datepicket-button': {
			'cursor': 'pointer',
			'input': {
				'cursor': 'pointer'
			}
		},

		'.form-submit-btn': {
			'max-width': '290px',
			'float': 'right',
			'transition': 'background-color .3s, box-shadow .3s',
			'-webkit-transition': 'background-color .3s, box-shadow .3s'
		},
		'.search-component': {
			'margin-top': '-10px'
		},

		'&[theme="flight-list"]': {
			'width': '100%',
			'padding-top': '40px',
			'.jetsm-search-inner': {
				'background': 'transparent',
				'max-width': '100%',
				'padding': '0'
			},
			'.search-buttons': {
				'display': 'none'
			}
		},

		'@media (max-width: 1230px)': {
			'padding': '10px'
		},

		'@media (max-width: 480px)': {
			'width': 'calc(100% - 20px)',
			'padding': '0px',
			margin: '0 auto',

			'&.in-top': {
				height: '100%',
				'padding-top': '50px',
				'.h3-style': {
					display: 'none'
				}
			},

			'.control-buttons': {
				'.control-buttons-item': {
					'width': '100%'
				}
			},

			'.form-submit-btn': {
				'width': '100%',
				'max-width': '100%'
			},

			'&[theme="flight-list"]': {
				'padding-top': '0'
			}
		}
	};

	// import { COLOR } from '../../typography'

	const cssjs$12 = {
		'display': 'block',

		'#react-calendar': {
			'.route-calendar': {
				'&.react-calendar': {
					'max-width': '100%'
				}
			}
		},
		'.mdc-layout-grid': {
			'max-width': '1210px'
		},

		'.field-wrapper': {
			'position': 'relative',

			'&.datepicket-button': {
				'input': {
					'background': COLOR.white
				},
				'&.filled': {
					'input': {
						'background': COLOR.white
					}
				}
			},

			'&.filled': {
				'input': {
					'color': COLOR.dark
				},
				'.field-icon': {
					rect: {
						fill: COLOR.dark
					},
					path: {
						fill: COLOR.dark
					},
					circle: {
						fill: COLOR.dark
					}
				}
			}
		},

		'.field-icon': {
			'position': 'absolute',
			'left': '13px',
			'top': '19px',
			'z-index': '1',
			'&.destination-icon': {
				'top': '20px'
			},
			'&.calendar-icon': {
				'top': '15px'
			}
		},

		'input': {
			'position': 'relative',
			'width': '100%',
			'outline': 'none',
			'padding': '13px 30px 13px 44px',
			'color': COLOR.lightBorder,
			'border': 'none',
			'background': COLOR.white,
			'display': 'block',
			'height': '50px',
			'font-size': '20px',
			'line-height': '24px',
			'font-weight': '300',
			'font-family': 'Roboto',
			'border-radius': '6px',
			'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 2px 1px -1px, rgba(0, 0, 0, 0.07) 0px 2px 1px 0px, rgba(0, 0, 0, 0.06) 0px 2px 3px 0px',
			'-webkit-appearance': 'none',
			"&[name='depart-date']": {
				'padding-right': '13px'
			},
			"&[name='return-date']": {
				'padding-right': '13px'
			}
		},

		'.close-btn': {
			'cursor': 'pointer',
			'position': 'absolute',
			'top': '50%',
			'top': '0',
			'bottom': '0',
			'margin': 'auto',
			'left': 'calc(100% - 30px)',
			'width': '25px',
			'height': '50%',
			'background': '#fff',
			'border-radius': '10px',

			'svg': {
				'position': 'absolute',
				'top': '0',
				'left': '0',
				'bottom': '0',
				'right': '0',
				'margin': 'auto'
			},

			'&:hover': {
				'svg': {
					'path': {
						stroke: COLOR.primary
					}
				}
			}
		},

		'&[theme="flight-list"]': {
			input: {
				'border': `none`, //1px solid ${COLOR.neutral}`,
				'box-shadow': `0 0 0 1px ${COLOR.neutral} !important`
			}
		}
	};

	const cssjs$13 = {
		'display': 'block',
		'position': 'absolute',
		'z-index': '6',
		'width': '100%',
		'max-width': '790px',

		'.date-picker-arrow': {
			'@media(max-width: 840px)': {
				display: 'none'
			},
			position: 'absolute',
			width: '12px',
			height: '12px',
			top: '-6px',
			left: '0',
			opacity: 0,

			'&:after': {
				content: '""',
				position: 'absolute',
				width: '0',
				height: '0',
				background: '#fff',
				transform: 'rotate(45deg)',
				'-webkit-transform': 'rotate(45deg)',
				top: '0',
				left: '0',
				'border': '6px solid #fff',
				'border-color': 'transparent transparent #fff #fff',
				'z-index': 2
			},
			"&:before": {
				'content': '""',
				'position': 'absolute',
				'width': '100%',
				'height': '100%',
				'background': '#fff',
				'-webkit-transform': 'rotate(45deg)',
				'transform': 'rotate(45deg)',
				'top': '0',
				'left': '0',
				'box-shadow': '-1px -1px 10px -2px rgba(0, 0, 0, 0.5)',
				'z-index': -1
			},

			'&.showed': {
				opacity: 1
			}

		},
		'.date-picker-container': {
			'z-index': 1
			// 'background': '#fff',
			// 'box-shadow': 'rgba(0, 0, 0, 0.1) 1px 0px 5px 2px, rgba(0, 0, 0, 0.07) 0 2px 1px 0, rgba(0, 0, 0, 0.06) 0 2px 3px 0',
		},
		'.route-calendar.react-calendar': {
			'z-index': 1
			// 'background': '#fff',
			// 'box-shadow': 'rgba(0, 0, 0, 0.1) 1px 0px 5px 2px, rgba(0, 0, 0, 0.07) 0 2px 1px 0, rgba(0, 0, 0, 0.06) 0 2px 3px 0',
		},
		'&.is-mobile': {
			'width': '100%',
			'height': '100%',
			'background-color': COLOR.light,
			'box-shadow': 'none',

			'.search-close-btn': {
				width: '29px',
				height: '29px',
				'g': {
					'stroke-width': '.5'
				}
			},
			'.date-picker-container': {
				'background-color': '#fff',
				'box-shadow': 'none',
				'border-radius': '24px',
				'margin-top': '15px'
			},

			'.react-calendar': {
				'background-color': COLOR.light
			},

			'.react-calendar.route-calendar': {
				'border-radius': '0',
				'margin-top': '15px',
				'background-color': 'transparent'
			},
			'.date-picker-close': {
				'display': 'block'
			}
		},

		'.date-picker-close': {
			'text-align': 'right',
			'padding': '10px 10px 0px',
			'display': 'none'
		},

		'@media (max-width: 810px)': {
			width: 'calc(100% - 40px)',
			'z-index': '7',
			top: '0 !important;',
			'.date-picker-container': {
				// background: '#fff'
			}
		}
	};

	const defaultRoutesLength = {
		'one-way': 1,
		'round-trip': 2,
		'multi-leg': 2
		/**
		* Store class of search, contains routes list and search parameters
		*/
	};class SearchStorage {

		constructor() {

			// list of routes
			this.routes = [];

			// current view params
			// NOTE: lets think about replace it to search controller
			this.params = {
				currentSearchComponent: this.getComponentFromUrl(),
				isDisabled: true,
				autoSubmit: false,
				updateURI: false
			};
			if (!window.IS_SSR) this.flushRoutes();
			this.refCheckUrl = this.flushRoutes.bind(this);
		}

		getComponentFromUrl() {
			return getUrlParams('return-date') ? 'round-trip' : 'one-way';
		}

		/**
		* Set defaults storage routes
		*/
		flushRoutes({ fromUri = true } = {}) {
			// by default it contians single route
			if (this.loaderPromise) return this.loaderPromise;
			this.loaderPromise = new Promise(async (resolve, reject) => {
				this.areas = await formatAreas();
				const newRoutesList = [];
				const minLength = defaultRoutesLength[this.component];

				const routesUrl = parseRouteUrl();
				if (fromUri && routesUrl.length) {

					for (let route of routesUrl) {
						const segment = new RouteSegment();
						await segment.update({
							departDate: route.departDate || null,
							origin: route.origin || null,
							destination: route.destination || null
						});
						newRoutesList.push(segment);
					}
				} else {
					newRoutesList.push(...this.routes.slice(0, minLength));
				}

				if (newRoutesList.length < minLength) {
					// add empty routes
					const emptyRoutes = Array.from({ length: minLength - newRoutesList.length }, () => new RouteSegment());
					newRoutesList.push(...emptyRoutes);
				}

				this.routes.length = 0; // clear an original array
				this.routes.push(...newRoutesList);
				this.loaderPromise = null;
				resolve();
			});
			return this.loaderPromise;
		}

		/**
		* Convert passed object to RouteSegment instance
		* and store it to routes list
		* @param {Object} param0
		* @returns {Number} index of route in list (like an id)
		*/
		addRoute(origin, destination, date) {
			const route = new RouteSegment({
				origin, destination, date
			});
			this.routes.push(route);
			return this.routes.length; // like an id of route
		}

		/**
		* Try to return route by it index. Returns null if route not found
		* @param {Number} index route index in list (like id)
		* @returns {RouteSegment|null}
		*/
		getRoute(index) {
			return this.routes[index] || null;
		}

		/**
		* Can be used in round trip only
		* @param {Date} date date of return
		*/
		async setReturnDate(date) {
			if (this.params.component != 'round-trip') this.setComponent('round-trip');
			if (this.routes.length > 1) {
				// get route depart
				const [routeDepart, routeArrive] = await this.getRoutes();
				// set reversed direction and passed date
				routeArrive.update({
					origin: routeDepart.destination,
					destination: routeDepart.origin,
					date
				});
			}
		}

		/**
		* @returns {Array<RouteSegment>} stored list of routes
		* */
		async getRoutes() {
			await this.loaderPromise;
			return this.routes;
		}

		/** Getters for unify observable variables */
		get component() {
			return this.params.currentSearchComponent;
		}
		get autoSubmit() {
			return this.params.autoSubmit;
		}

		get isDisabled() {
			return this.params.isDisabled;
		}
		set isDisabled(value) {
			this.params.isDisabled = value;
		}

		setComponent(name) {
			this.params.currentSearchComponent = name;
			this.flushRoutes({ fromUri: false });
		}

	}

	/**
	 * Route segment class
	 * used in routes list in search storage
	 */
	class RouteSegment {

		/**
		* @constructor
		* @optional @param {Object} route origin, destination and date
		*/
		constructor({ origin = null, destination = null, departDate = null } = {}) {
			this.data = { origin, destination, departDate };
		}

		isEqual({ origin, destination, departDate }) {
			return origin && this.origin.value.toLowerCase() == origin.toLowerCase() && destination && this.destination.value.toLowerCase() == destination.toLowerCase() && departDate instanceof Date && ddmmyy(this.departDate) == ddmmyy(departDate);
		}

		validate() {
			const { origin, destination, departDate } = this.data;
			return Boolean(origin && destination && departDate);
		}

		async update({ origin, destination, departDate } = {}) {
			if (origin === null) this.data.origin = null;
			if (destination === null) this.data.destination = null;
			if (departDate === null) this.data.departDate = null;

			if (origin || destination) {
				const [foundOrig, foundDest] = await Promise.all([parseDirection(origin), parseDirection(destination)]);
				if (origin) this.data.origin = foundOrig;
				if (destination) this.data.destination = foundDest;
			}

			if (departDate) this.departDate = departDate;
		}

		get destination() {
			return this.data.destination;
		}
		get origin() {
			return this.data.origin;
		}

		set origin(val) {
			throw new Error(`Fail to set "${val}" origin. Please use "update()" method of RouteSegment instance`);
		}
		set destination(val) {
			throw new Error(`Fail to set "${val}" destination. Please use "update()" method of RouteSegment instance`);
		}

		set departDate(value) {
			this.data.departDate = value ? new Date(value) : null;
		}
		get departDate() {
			return this.data.departDate;
		}

	}

	const parseDirection = async input => {
		if (typeof input != 'string') return input;
		const areas = await formatAreas();
		return findArea(input, areas) || (await findAirport(input));
	};

	const getSibling$1 = field => field == 'origin' ? 'destination' : 'origin';

	/** @param {String} s string to sluggify */
	const sluggify = s => `${s.replace(/ /g, '_').toLowerCase()}`;

	/** @param {RouteSegment} route */
	const toUrlSegment = route => {
		const { origin, destination, departDate } = route;
		return [sluggify(origin.value), sluggify(destination.value), ddmmyy(departDate)].join('-');
	};

	/**
	 * Transform routes list to url's query string
	 * @param { Array<RouteSegment> } list list of routes
	 * @param { String } searchType type of search that will be added to url params
	 * @returns { String } query string
	 */
	const toQueryString = (routeList, searchType) => {
		if (!routeList.length) return '';

		const [toRoute] = routeList;

		const queryParams = [];
		if (toRoute.origin) queryParams.push(`origin=${sluggify(toRoute.origin.value)}`);
		if (toRoute.destination) queryParams.push(`destination=${sluggify(toRoute.destination.value)}`);
		if (toRoute.departDate) queryParams.push(`depart-date=${ddmmyy(toRoute.departDate)}`);

		if (searchType == "round-trip") {
			const [, backRoute] = routeList;
			if (backRoute.departDate) queryParams.push(`return-date=${ddmmyy(backRoute.departDate)}`);
		}
		return queryParams.length ? `?${queryParams.join('&')}` : '';
	};

	/**
	 * Transform routes list to urls path?query
	 * @param { Array<RouteSegment> } list list of routes
	 * @returns { String } url location
	 */
	const generateUrl = (routeList, searchType = 'one-way') => {

		const [firstRoute] = routeList;
		const segment = toUrlSegment(firstRoute);

		if (searchType == 'round-trip') {
			const [, returnRoute] = routeList;
			return `/flights/${segment}/?return-date=${ddmmyy(returnRoute.departDate)}`;
		}

		let querystring = toQueryString(routeList.slice(1), searchType);
		return `/flights/${segment}/${querystring}`;
	};

	/** Convert first char of string to uppercase */
	const toUpCharAt = str => str && str[0].toUpperCase() + str.slice(1);

	/**
	 * Convert segment of url to user-friendly text
	 * @param {String} value
	 */
	const toUserFriendly = urlSegment => {
		return typeof urlSegment != 'string' ? urlSegment : urlSegment.split('_') // by each word
		.reduce((cur, iter) => toUpCharAt(cur) + " " + toUpCharAt(iter), "" // first letter to
		).trim();
	};

	const rand$1 = (min, max) => {
		return parseInt(Math.random() * (max - min) + min, 10);
	};

	/** Convert date string from url (mmddyy) to js date instance */
	const toDateInstance = dateString => new Date([dateString.slice(0, 2), // mm
	dateString.slice(2, 4), // dd
	`20${dateString.slice(4)}` // yy
	].join('/'));

	const routeUnifier = ({ origin, destination, departDate }) => ({
		origin: origin && toUserFriendly(origin),
		destination: destination && toUserFriendly(destination),
		departDate: departDate && toDateInstance(departDate)
	});

	const getLegsFromQuery = () => {
		const legs = [];
		const [origin, destination, departDate, returnDate] = getUrlParams('origin', 'destination', 'depart-date', 'return-date');

		if (origin || destination || departDate) {
			legs.push(routeUnifier({ origin, destination, departDate }));
		}
		if (returnDate) {
			const [firstSegment] = parseUrlSegments();
			legs.push(routeUnifier({
				// round-trip
				origin: firstSegment.destination,
				destination: firstSegment.origin,
				departDate: returnDate
			}));
		}
		return legs;
	};

	const parseUrlSegments = () => {
		const legPathSegments = getPathSegments();
		const legsFromSegments = [];
		for (let segment of legPathSegments) {
			const leg = parseRouteSegment(segment);
			if (leg) legsFromSegments.push(leg);
		}
		return legsFromSegments;
	};

	const parseRouteUrl = () => {
		return [...parseUrlSegments(), ...getLegsFromQuery()];
	};

	/** Parse segment from url pathname (like "boston-miami-012018") @returns route object */
	const parseRouteSegment = path => {
		if (!path) return null;

		let [fromSegment, toSegment, dateSegment] = path.split('-');
		if (!fromSegment || !toSegment || !dateSegment) return null;

		const dateInstace = toDateInstance(dateSegment);
		if (isNaN(dateInstace.getTime())) return null;

		return routeUnifier({
			origin: fromSegment,
			destination: toSegment,
			departDate: dateSegment
		});
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$14 = instance.define({
		name: 'date-picker-widget', cssjs: cssjs$13
	});

	const setRelativePosition = (selfEl, relativeEl) => {
		const { top, left } = relativeEl.getBoundingClientRect();
		selfEl.classList.add(relativeEl.name);
		selfEl.style.top = `${top + window.pageYOffset + relativeEl.offsetHeight + 10}px`;
		const relativeOffsetBySelf = left + window.pageXOffset + relativeEl.offsetWidth - selfEl.offsetWidth;
		selfEl.style.left = `${relativeOffsetBySelf < 0 ? 10 : relativeOffsetBySelf}px`;
	};

	const reposition = (targetElem, calendar, arrow) => {
		const { left: calendarLeft } = calendar.getBoundingClientRect();
		const { left: targetLeft } = targetElem.getBoundingClientRect();

		arrow.style.left = `${targetLeft - calendarLeft + targetElem.offsetWidth / 2 - arrow.offsetWidth / 2}px`;
		arrow.classList.add('showed');
	};

	let currentTop$1;
	let jsapp = document.querySelector('jetsmarter-app');

	class DatePickerWidget extends WidgetTooltip {

		static get is() {
			return 'date-picker-widget';
		}

		destroy() {
			super.destroy();

			if (isMobile()) {
				jsapp.classList.remove('mw-is-open');
			}
		}

		onAttached() {
			super.onAttached();

			if (isMobile()) {
				currentTop$1 = window.pageYOffset;
				jsapp.style.top = `${-currentTop$1}px`;
				this.style.top = `${window.pageYOffset + document.querySelector('jet-header').offsetHeight}px`;
				this.style.left = 0;
				jsapp.classList.add('mw-is-open');
				this.classList.add('is-mobile');
				window.scrollTo(0, 0);
			}
		}

		disconnectedCallback() {
			super.disconnectedCallback();
			jsapp.classList.remove('mw-is-open');
			if (isMobile()) {
				window.scrollTo(0, currentTop$1);
			}
		}

		static create({ targetElem, origin, destination, departDate, returnDate, className }) {
			const self = document.createElement('date-picker-widget');
			self.classList.add(className);
			self.dateChanged = date => self.dispatchEvent(new CustomEvent('complete', { detail: { date } }));

			if (departDate) self.setAttribute('depart-date', departDate);
			if (returnDate) self.setAttribute('return-date', returnDate);
			if (origin) self.setAttribute('origin', origin);
			if (destination) self.setAttribute('destination', destination);

			const arrow = document.createElement('div');
			arrow.classList.add('date-picker-arrow');
			self.appendChild(arrow);
			self.insertAdjacentHTML('afterBegin', `<div class="date-picker-close">${svgIcon.searchClose()}</div>`);
			document.querySelector('jetsmarter-app').insertAdjacentElement('beforeend', self);
			setRelativePosition(self, targetElem);
			setTimeout(() => reposition(targetElem, self, arrow), 10);
			return self;
		}

		async ready() {
			bmpCssComponent$14.attachStyles(this);
			this.context = {};

			const [areas] = await Promise.all([formatAreas(), routesRegionListPromise()]);
			const originMa = findArea(this.props.origin, areas, true);
			const destinationMa = findArea(this.props.destination, areas, true);
			if (originMa && destinationMa) {
				const route = findValidRoute(originMa.reference, destinationMa.reference);
				if (route) {
					this.context = {
						origin: route[0].city,
						destination: route[1].city
					};
				}
			}
		}

		renderCalendar(el) {
			const settings = {
				from: this.context.origin,
				to: this.context.destination,
				onDateSelect: this.dateChanged,

				departDate: this.props['depart-date'] && new Date(this.props['depart-date']),
				returnDate: this.props['depart-date'] && new Date(this.props['return-date']),

				min: this.props.name == 'return-date' && departDate,
				max: this.props.name == 'depart-date' && returnDate
			};

			ReactCaller$1.run('datePickerMultiLeg', el, settings);
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement('div', { ref: el => this.renderCalendar(el) });
		}
	}

	customElements.define(DatePickerWidget.is, DatePickerWidget);


	let bmpCssComponent$17 = instance.define({
		name: 'jetsm-search', cssjs: cssjs$11
	});
	let searchStorage;

	/**
	 * Provides JetSmarter leg search functionality and ui for custom web component <jetsm-search />
	 * @class JetsmSearch
	 * @extends {BMPVDWebComponent}
	 */

	class JetsmSearch extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static get observedAttributes() {
			return ['component-name'];
		}

		get storage() {
			return this.constructor.storage();
		}

		static storage() {
			if (!searchStorage) searchStorage = new SearchStorage();
			return searchStorage;
		}

		disconnectedCallback() {
			window.removeEventListener('resize', this.refRender, false);
		}

		async onAttached() {
			this.refRender = this.rerender.bind(this);
			window.addEventListener('resize', this.refRender, false);
			if (!window.IS_SSR) {
				await this.storage.flushRoutes();
				const [route] = await this.storage.getRoutes();
				if (this.props.date || this.props.date === null) route.update({ departDate: this.props.date });
			}
		}

		ready() {
			bmpCssComponent$17.attachStyles(this);

			// pass bool to storage to knows should we change an uri
			this.context = this.observe({
				currentSearchComponent: this.storage.component,
				preventAutoSubmit: false
			});
		}

		changeSearch(e) {
			this.context.currentSearchComponent = e.target.getAttribute('for');
			this.storage.setComponent(this.context.currentSearchComponent);
		}

		searchButtons() {
			let buttons = [{ name: 'one-way', label: 'One way' }, { name: 'round-trip', label: 'Round trip' }];

			return buttons.map(button$$1 => BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'search-button-item' },
				BMPVD.createBMPVirtulaDOMElement('input', {
					id: button$$1.name,
					type: 'radio',
					name: 'component',
					checked: this.context.currentSearchComponent == button$$1.name ? 'true' : null
				}),
				BMPVD.createBMPVirtulaDOMElement(
					'label',
					{
						'for': button$$1.name,
						onClick: e => this.changeSearch(e),
						'class': 'container' },
					button$$1.label
				)
			));
		}

		searchComponent() {
			this.setAttribute('component-name', this.context.currentSearchComponent);
			switch (this.context.currentSearchComponent) {
				case 'round-trip':
					return BMPVD.createBMPVirtulaDOMElement('jetsm-round-trip', { storage: this.storage });
				case 'multi-city':
					return BMPVD.createBMPVirtulaDOMElement('jetsm-multi-search', { storage: this.storage });
				default:
					return BMPVD.createBMPVirtulaDOMElement('jetsm-one-way', { storage: this.storage });
			}
		}

		render() {
			// const { origin, destination, date } = this.props
			return ME.container({
				mod: { className: 'jetsm-search-outer' },
				children: [ME.layout.grid({
					mod: { common: { margin: 0 }, desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [this.props.titleText ? ME.layout.cell({ common: 12 }, ME.container({
						mod: { className: 'jetsm-search-title' },
						children: h3('color:#EEECE7;text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.5);', BMPVD.createBMPVirtulaDOMElement(
							'span',
							null,
							this.props.titleText
						))
					})) : null, ME.layout.cell({ common: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'jetsm-search-inner' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'search-component' },
							this.searchComponent()
						)
					))]
				})]
			});
		}
	}

	if (!customElements.get('jetsm-search')) customElements.define('jetsm-search', JetsmSearch);


	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$15 = instance.define({
		name: 'jetsm-leg-search', cssjs: cssjs$12
	});

	class JetsmLegSearch extends BMPVDWebComponent {

		constructor() {
			super();
			this.searchStorage = JetsmSearch.storage();
		}

		disconnectedCallback() {
			window.removeEventListener('resize', this.refRender, false);
			// this.searchStorage.unsubscribe( this.subID )
			instance$1.unsubscribe(this.subID);
		}

		async setValue({ name, value }) {
			if (name == 'returnDate') {
				if (this.searchStorage.component == 'round-trip') this.searchStorage.setReturnDate(value);
			} else {
				await this.ctx.route.update({ [name]: value });
			}
			this.validate();
		}

		hookValueChaged() {
			const { origin, destination } = this.ctx.route;
			instance$1.setToStorage('search.selected_route', {
				from: origin,
				to: destination
			});
		}

		getSuggestTemplate(filter, usersInput = '', complete) {
			const args = {
				'users-input': (usersInput || '').trim(),
				filter: filter instanceof Object ? JSON.stringify(filter) : filter,
				oncomplete: ev => complete(ev)
			};
			return [BMPVD.createBMPVirtulaDOMElement('geo-suggestion', args), BMPVD.createBMPVirtulaDOMElement('ma-suggestion', args), BMPVD.createBMPVirtulaDOMElement('airports-suggestion', args)];
		}

		createAutosuggest(name) {
			const sibling = getSibling$1(name);
			let filter = null;
			if (this.ctx.route[sibling] && !this.ctx.route[sibling].isAirport) filter = this.ctx.route[sibling].reference;

			const change = (el, ev) => el.dispatchEvent(new CustomEvent('complete', ev));
			const value = this.ctx.route[name] ? this.ctx.route[name].ma : '';
			const relativeEl = this.querySelector(`[name="${name}"]`);
			relativeEl.blur();
			const autosuggest = AutosuggestField.create({
				relativeEl,
				resultsList: this.getSuggestTemplate(filter, value, ev => change(autosuggest, ev)),
				name,
				value,
				tabIndex: parseInt(relativeEl.getAttribute('tabindex'), 10) + 1,
				styled: 'bordered'
			});
			autosuggest.addEventListener('update', ({ detail: usersInput }) => {
				autosuggest.resultsList = this.getSuggestTemplate(filter, usersInput, ev => change(autosuggest, ev));
			});
			autosuggest.addEventListener('error', () => this.setValue({ name, value: null }));
			autosuggest.addEventListener('complete', async ({ detail: value }) => {
				await this.setValue({ name, value });

				this.hookValueChaged();
				autosuggest.destroy();

				if (!isMobile()) {
					if (!this.ctx.route[sibling] && this.ctx.route[name]) {
						// focus on another field (sibling is not filled, self is filled)
						this.createAutosuggest(sibling);
					} else if (this.ctx.route[sibling] && this.ctx.route[name] && !this.ctx.route.departDate) {
						// focus on date field if it not filled
						const departDateField = this.querySelector(`[name="depart-date"]`);
						this.showCalendar(departDateField);
					}
				}
			});
		}

		clearValue(fieldName) {
			this.setValue({ name: fieldName, value: null });
			if (this.datePicker) this.datePicker.destroy();

			if (fieldName == 'origin' || fieldName == 'destination') {
				this.createAutosuggest(fieldName);
			} else {
				const fieldKey = fieldName.replace(/([A-Z])/g, '-$1').toLowerCase();
				this.showCalendar(this.querySelector(`[name="${fieldKey}"]`));
			}

			this.hookValueChaged();
		}

		onAttached() {
			// TODO parse path if searchStore.origin = null || searchStore.destination = null

			if (!window.IS_SSR) {
				this.refRender = this.rerender.bind(this);
				window.addEventListener('resize', this.refRender, false);
				this.subID = instance$1.subscribe('search.selected_route', data => {
					this.ctx.route.update(data);
				});
				this.addEventListener('showcalendar', async ({ detail }) => {
					await Promise.all([this.setValue({ name: 'origin', value: detail.origin }), this.setValue({ name: 'destination', value: detail.destination })]);
					if (!isMobile()) {
						this.showCalendar(this.querySelector(`[name=${detail.name}]`));
					}
				});
			}
		}

		async ready() {

			bmpCssComponent$15.attachStyles(this);
			this.ctx = this.observe({
				calendarShow: false,
				reversed: false,
				isDisabled: true,
				theme: this.closest('jetsm-search').getAttribute('theme'),

				/** @param { RouteSegment } route */
				route: this.props.route,
				/** @param { RouteSegment } toRoute */
				returnRoute: this.props.returnRoute && this.observe(this.props.returnRoute)
			});

			if (!window.IS_SSR) {
				this.validate(); // check route to set isDisabled value
				if (this.props.route) this.observe(this.props.route.data);
				if (this.props.returnRoute) this.observe(this.props.returnRoute.data);
				this.areas = (await formatAreas()).filter(area => !!area.reference);
			}
		}

		get currentSettings() {
			return {
				origin: this.ctx.route.origin ? this.ctx.route.origin.ma : null,
				destination: this.ctx.route.destination ? this.ctx.route.destination.ma : null,
				departDate: this.ctx.route.departDate ? this.ctx.route.departDate : null,
				returnDate: this.ctx.returnRoute && this.ctx.returnRoute.departDate ? this.ctx.returnRoute.departDate : null
			};
		}

		showCalendar(element) {
			/** Get alias of field's name to it context key
		 * @param { HTMLElement } element
		 * @returns { String }
		 */
			const getContextKey = element => {
				//Extract type of date from htmlelement.
				const whoICanBe = ['depart-date', 'return-date'];
				const key = whoICanBe[whoICanBe.indexOf(element.name)];
				// Convert kebab-case to camelCase.
				return key.replace(/-([a-z])/ig, g => g[1].toUpperCase());
			};

			element.blur();
			const contextKey = getContextKey(element);

			// generate settings object.
			const settings = {
				origin: this.ctx.route.origin ? this.ctx.route.origin.value : null,
				destination: this.ctx.route.destination ? this.ctx.route.destination.value : null,
				departDate: this.ctx.route.departDate,
				returnDate: this.ctx.returnRoute && this.ctx.returnRoute.departDate ? this.ctx.returnRoute.departDate : null,
				targetElem: element
			};

			if (contextKey === 'returnDate') {
				// reverse route if self is returnDate
				[settings.origin, settings.destination] = [settings.destination, settings.origin];
			}

			// Close earlyer dataPicker if exists.
			if (this.datePicker) this.datePicker.destroy();

			// Init react datePicker with setting object.
			settings.className = this.searchStorage.component;
			this.datePicker = DatePickerWidget.create(settings);

			this.datePicker.querySelector('.date-picker-close').addEventListener('click', () => {
				this.datePicker.destroy();
			});

			this.datePicker.addEventListener('complete', e => {
				this.datePicker.destroy();
				this.setValue({ name: contextKey, value: e.detail.date });
			});
		}

		validate() {
			const [urlRoute, routeReturn] = parseRouteUrl();
			switch (this.searchStorage.component) {
				case 'one-way':
					this.ctx.isDisabled = !this.ctx.route.validate() || this.ctx.route.isEqual(urlRoute || {});
					break;
				case 'round-trip':
					this.ctx.isDisabled = !(this.ctx.route.validate() && this.ctx.returnRoute.validate() && !this.ctx.route.isEqual(urlRoute) && (!routeReturn || this.ctx.returnDate !== routeReturn.departDate));
					break;

				default:
					break;
			}
		}

		autosuggestInput(name, placeholder, area, tabIndex) {
			return BMPVD.createBMPVirtulaDOMElement('input', {
				type: 'text',
				name: name,
				className: 'filed-input',
				placeholder: placeholder,
				value: area || '',
				tabindex: tabIndex,
				onclick: e => this.createAutosuggest(e.target.getAttribute('name')),
				onfocus: e => this.createAutosuggest(e.target.getAttribute('name'))
			});
		}

		render() {
			if (this.ctx.theme) this.setAttribute('theme', `${this.ctx.theme}`);else this.removeAttribute('theme');

			const { origin, destination, departDate, returnDate } = this.currentSettings;
			const cols = {
				inputs: this.searchStorage.component == 'round-trip' ? 3 : 4,
				calendars: 2,
				submitBtn: 2
			};

			return ME.container({
				// mod: { className: 'jetsm-leg-item' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: cols.inputs, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: `field-wrapper ${origin ? 'filled' : ''}` },
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'field-icon', safeHTML: svgIcon.searchorigin({ color: origin ? COLOR.dark : COLOR.lightBorder }) }),
						this.autosuggestInput('origin', 'From', origin, 1),
						origin ? BMPVD.createBMPVirtulaDOMElement('div', { className: 'close-btn', safeHTML: svgIcon.searchClose(), onclick: ev => this.clearValue('origin') }) : null
					)), ME.layout.cell({ common: cols.inputs, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: `field-wrapper ${destination ? 'filled' : ''}` },
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'field-icon destination-icon', safeHTML: svgIcon.searchdestination({ color: destination ? COLOR.dark : COLOR.lightBorder }) }),
						this.autosuggestInput('destination', 'To', destination, 3),
						destination ? BMPVD.createBMPVirtulaDOMElement('div', { className: 'close-btn', safeHTML: svgIcon.searchClose(), onclick: ev => this.clearValue('destination') }) : null
					)), ME.layout.cell({ common: cols.calendars, tablet: 12, phone: 4 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: `field-wrapper datepicket-button ${departDate ? 'filled' : ''}` },
						BMPVD.createBMPVirtulaDOMElement('div', {
							className: 'field-icon calendar-icon',
							safeHTML: svgIcon.calendar({
								forward: this.searchStorage.component == 'round-trip' ? true : false,
								color: departDate ? COLOR.dark : COLOR.lightBorder
							}) }),
						BMPVD.createBMPVirtulaDOMElement('input', {
							tabindex: '5',
							type: 'text',
							name: 'depart-date',
							placeholder: 'Departure',
							value: departDate ? toLocaleStr(departDate) : '',
							onFocus: e => {
								this.showCalendar(e.target);e.target.blur();
							},
							onClick: e => {
								this.showCalendar(e.target);e.target.blur();
							}
						})
					)), this.searchStorage.component == 'round-trip' ? ME.layout.cell({ desktop: cols.calendars, tablet: 4, phone: 4 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: `field-wrapper datepicket-button ${returnDate ? 'filled' : ''}` },
						BMPVD.createBMPVirtulaDOMElement('div', {
							className: 'field-icon calendar-icon',
							safeHTML: svgIcon.calendar({
								back: this.searchStorage.component == 'round-trip' ? true : false,
								color: returnDate ? COLOR.dark : COLOR.lightBorder
							}) }),
						BMPVD.createBMPVirtulaDOMElement('input', {
							type: 'text',
							readonly: 'readonly',
							name: 'return-date',
							placeholder: 'Return',
							tabindex: '6',
							value: returnDate ? toLocaleStr(returnDate) : '',
							onClick: e => {
								this.showCalendar(e.target);e.target.blur();
							}
						})
					)) : null, ME.layout.cell({ common: cols.submitBtn, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'control-buttons' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'control-buttons-item', style: 'width: 100%' },
							linkButtonPrimary$1(`display: block; width: 100%`, BMPVD.createBMPVirtulaDOMElement(
								'button',
								{
									style: 'width: 100%',
									disabled: this.ctx.isDisabled,
									className: 'form-submit-btn', type: 'submit'
								},
								'Search'
							))
						)
					))]
				})]
			});
		}
	}

	customElements.define('jetsm-leg-search', JetsmLegSearch);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$16 = instance.define({
		name: 'jetsm-one-way', cssjs: {
			'display': 'block'
		}
	});

	class JetsmOneWay extends BMPVDWebComponent {

		async ready() {
			bmpCssComponent$16.attachStyles(this);
			this.context = this.observe({
				route: {}
			});
			if (!window.IS_SSR) {
				await this.props.storage.flushRoutes();[this.context.route] = await this.props.storage.getRoutes();
			}
		}

		async handleSubmit(e) {
			e.preventDefault();

			let { origin, destination, departDate } = this.context.route;
			if (origin && destination && departDate) {
				let pathname = generateUrl([this.context.route]);
				this.closest('bmp-router').go(pathname);
			}
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'form',
				{ method: 'GET', onSubmit: this.handleSubmit.bind(this) },
				BMPVD.createBMPVirtulaDOMElement('jetsm-leg-search', { route: this.context.route })
			);
		}
	}

	customElements.define('jetsm-one-way', JetsmOneWay);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	class JetsmRoundTrip extends BMPVDWebComponent {

		async ready() {
			this.context = this.observe({
				route: {},
				returnRoute: {}
			});[this.context.route, this.context.returnRoute] = await this.props.storage.getRoutes();
		}

		async onAttached() {
	[this.context.route, this.context.returnRoute] = await this.props.storage.getRoutes();
		}

		async handleSubmit(e) {
			e.preventDefault();

			const { origin, destination, departDate } = this.context.route;
			const { departDate: returnDate } = this.context.returnRoute;
			if (origin && destination && departDate && returnDate) {
				let pathname = generateUrl([this.context.route, this.context.returnRoute], 'round-trip');
				this.closest('bmp-router').go(pathname);
			}
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'form',
				{ method: 'GET', onSubmit: this.handleSubmit.bind(this) },
				BMPVD.createBMPVirtulaDOMElement('jetsm-leg-search', { route: this.context.route, returnRoute: this.context.returnRoute })
			);
		}
	}

	customElements.define('jetsm-round-trip', JetsmRoundTrip);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	// let bmpCssComponent = bmpCssInstance.define({
	// 	name: 'jetsm-multi-search', cssjs
	// })

	class JetsmMultiSearch extends BMPVDWebComponent {

		constructor() {
			super();
		}

		onAttached() {}

		ready() {

			this.legs = this.props.storage.currentSettings.map(leg => {});

			this.legs = [{ origin: '', destination: '', date: '' }];
			// bmpCssComponent.attachStyles(this)
			this.context = this.observe({ legs: this.legs });
			return Promise.resolve();
		}

		addLeg() {
			this.context.legs = [...this.context.legs, { origin: '', destination: '', date: '' }];
		}

		handleSubmit(e) {
			e.preventDefault();
		}

		render() {

			let legs = this.context.legs.map(leg => BMPVD.createBMPVirtulaDOMElement('jetsm-leg-search', { origin: leg.origin, destination: leg.destination, date: leg.date }));
			return BMPVD.createBMPVirtulaDOMElement(
				'form',
				{ method: 'GET', onSubmit: this.handleSubmit.bind(this) },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					legs
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'control-buttons' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'control-buttons-item' },
						BMPVD.createBMPVirtulaDOMElement(
							'button',
							{ className: 'add-leg', type: 'button', onClick: this.addLeg.bind(this) },
							'Add Segment'
						)
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'control-buttons-item' },
						linkButtonPrimary('', BMPVD.createBMPVirtulaDOMElement(
							'button',
							{ type: 'submit', style: 'max-width: 290px; float: right;' },
							'Search'
						))
					)
				)
			);
		}
	}

	customElements.define('jetsm-multi-search', JetsmMultiSearch);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const cssjs$14 = {
		'height': 'calc(100vh - 4em)',
		'margin': '0 0 64px',
		'min-height': '850px',
		'display': 'block',
		'overflow': 'hidden',
		'background-color': '#5f5f5f',
		'position': 'relative',
		// 'background': 'url(https://jetsmarter.com/data/site-v5/images/home-background.svg) center center/cover no-repeat #265072',

		'.jet-search-wrapper': {
			'width': '100%',
			'height': '100%',
			'display': 'block',
			'position': 'absolute',
			'top': '50%',
			'left': '50%',
			'z-index': '3',
			'transform': 'translate3d(-50%,-50%,0)'
		},
		'.jet-search-homepage': {
			'position': 'absolute',
			'left': '50%',
			'top': '50%',
			'-webkit-transform': 'translate3d(-50%, -50%, 0)',
			'transform': 'translate3d(-50%, -50%, 0)',
			'width': '100%'
		},
		// '.mdc-layout-grid': {
		// 	'max-width': '1200px',
		// },
		'.mw1000': {
			'max-width': '1000px',
			'margin-left': 'auto',
			'margin-right': 'auto',
			height: '100%'

		},
		'.home-hero-wrapper': {
			'position': 'relative',
			'height': '100%',
			'min-height': '830px',
			'z-index': '3'
		},
		'.scroll-arrow': {
			'width': '16px',
			'height': 'auto',
			'position': 'absolute',
			'bottom': '30px',
			'left': '0',
			'right': '0',
			'margin': 'auto',
			'cursor': 'pointer',
			'z-index': '3'
		},

		'.brand': {
			'top': '84px',
			'position': 'absolute',
			'z-index': '3',
			'cursor': 'default',
			'left': '50%',
			'transform': 'translate3d(-50%, 0, 0)',
			'display': 'block',
			'height': 'auto',
			'width': 'auto',
			'path': {
				fill: '#fff'
			},
			'svg': {
				'transition-duration': '.25s',
				'width': '100%'
			}
		},

		'@media (max-width: 480px)': {
			'background': `url(${pagesImageConf.backgroundMobile}) 0% 50% / cover no-repeat ${pagesImageConf.bgColor}`,
			'height': '100%',
			'margin': '0px 0 34px',
			'min-height': '650px',
			'.home-hero-wrapper': {
				'margin': '0 0 0',
				// 'min-height': '0',
				'height': '100%',
				'min-height': '0px'
			},

			'.scroll-arrow': {
				'display': 'none'
			},
			'.jet-search-wrapper': {
				'height': '100%',
				position: 'static',
				transform: 'none'
			},
			'.brand': {
				'display': 'none'
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$18 = instance.define({
		name: 'home-parallax',
		cssjs: {
			'display': 'block',
			'position': 'absolute',
			// 'overflow': 'hidden',
			'top': '0%',
			'left': '0%',
			'width': '100%',
			'height': '100%',

			'.parallax-background': {
				'position': 'absolute',
				'top': '50%',
				'left': '50%',
				'transform': 'translate3d(-50%, -50%, 0)',
				'width': '100%',
				'height': 'auto',
				'z-index': '1',
				'will-change': 'transform',
				'-webkit-user-select': 'none',
				'-ms-user-select': 'none',
				'user-select': 'none'
			},
			'.parallax-airplane': {
				'position': 'absolute',
				'right': '-100px',
				'bottom': '-100%',
				'z-index': '2',
				'width': '45%',
				'will-change': 'transform',
				'transition-duration': '1.5s',
				'-webkit-user-select': 'none',
				'-ms-user-select': 'none',
				'user-select': 'none',

				'&.animate': {
					'bottom': '-10%'
				}
			},
			'@media (max-width: 1200px)': {
				'.parallax-airplane': {
					'width': '60%',
					'&.animate': {
						'bottom': '0%'
					}
				}
			},
			'@media (max-width: 839px)': {
				'.parallax-airplane': {
					'width': '80%',
					'&.animate': {
						'bottom': '0%'
					}
				},
				'.parallax-background': {
					'width': '200%'
				}
			},
			'@media (max-width: 480px)': {
				'.parallax-background': {
					'display': 'none'
				},
				'.parallax-airplane': {
					'width': '100%',
					'&.animate': {
						'bottom': '10%'
					}
				}
			}
		}
	});

	class HomeParallax extends BMPVDWebComponent {
		constructor() {
			super();
			this.ticking = false;
			this.lastKnownScrollPosition = 0;
		}

		disconnectedCallback() {
			window.removeEventListener('scroll', this.refHandleScroll);
		}

		onAttached() {
			this.parallaxPlane = this.querySelector('.parallax-airplane');
			this.parallaxBack = this.querySelector('.parallax-background');
			this.refHandleScroll = this.handleScroll.bind(this);
			window.addEventListener('scroll', this.refHandleScroll);
			setTimeout(() => {
				this.parallaxPlane.classList.add('animate');
			}, 100);
		}

		ready() {
			bmpCssComponent$18.attachStyles(this);
			return new Promise(resolve => {
				resolve();
			});
		}

		handleScroll() {
			this.lastKnownScrollPosition = window.scrollY;
			if (!this.ticking && this.lastKnownScrollPosition < this.offsetHeight) {
				window.requestAnimationFrame(() => {
					this.animateParallax(this.lastKnownScrollPosition);
					this.ticking = false;
				});
				this.ticking = true;
			}
		}

		animateParallax(scroll) {
			this.parallaxPlane.style.transitionDuration = '0s';
			this.parallaxPlane.style.transform = `translate3d(0, ${-(scroll / 25).toFixed(2)}%, 0)`;
			this.parallaxBack.style.transform = `translate3d(-50%, -${50 + -(scroll / 18).toFixed(2)}%, 0)`;
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				BMPVD.createBMPVirtulaDOMElement('img', { className: 'parallax parallax-airplane', src: `${pagesImageConf.plane}`, alt: '' }),
				BMPVD.createBMPVirtulaDOMElement('img', { className: 'parallax parallax-background', src: `${pagesImageConf.backgroundDesktop}`, alt: '' })
			);
		}
	}

	if (!customElements.get('home-parallax')) customElements.define('home-parallax', HomeParallax);

	const Responsive = {
		subscribers: [],
		devices: {
			desktop: 'desktop',
			tablet: 'tablet',
			phone: 'phone'
		},

		getSubID(subCallback) {
			let fnString = JSON.stringify(subCallback);
			return Responsive.subscribers.findIndex(sub => JSON.stringify(sub) == fnString);
		},
		onDeviceChange(fn) {
			if (Responsive.getSubID(fn) < 0) {
				this.subscribers.push(fn);
				fn(Responsive.device.like);
			}
		},
		deleteSubscriber(fn) {
			let id = Responsive.getSubID(fn);
			if (id >= 0) Responsive.subscribers.splice(id, 1);
		},
		notify() {
			this.subscribers.forEach(callback => {
				if (typeof callback == 'function') callback(this.device.like);
			});
		},

		setlayout(layoutKey) {
			if (Responsive.device.like !== layoutKey) Responsive.device.like = layoutKey;
		},

		init() {
			Responsive.device = observe({ like: 'tablet' }, Responsive.notify.bind(this));

			Responsive.updateDevice();
			// layout callback storage
			window.addEventListener('resize', () => {
				Responsive.updateDevice();
			});
		},

		updateDevice() {
			if (innerWidth >= 840) this.setlayout(Responsive.devices.desktop);else if (innerWidth >= 480) this.setlayout(Responsive.devices.tablet);else this.setlayout(Responsive.devices.phone);
		}
	};
	Responsive.init();

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$19 = instance.define({
		name: 'home-hero', cssjs: cssjs$14
	});

	class HomeHero extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$19.attachStyles(this);

			const titles = [BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Experience aviation\xA0as it\xA0was meant to\xA0be'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Discover the\xA0smarter way to\xA0fly'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Skip the\xA0lines and\xA0save the\xA0time'
			), BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Jet through life on\xA0your own\xA0terms'
			)];
			const slogan = titles[rand$1(0, titles.length)];
			this.titleText = slogan;

			this.context = this.observe({
				showLegOffer: true,
				height: ''
			});
		}

		disconnectedCallback() {
			instance$1.setToStorage('search.selected_route', {});
			instance$1.unsubscribe('search.selected_route', this.storageID);
			Responsive.deleteSubscriber(this.refUpdHeight);
		}

		updHeight() {
			const isMob = Responsive.devices.phone === Responsive.device.like;
			this.style['height'] = isMob ? this.context.calendarShowed ? 'auto' : `${window.innerHeight}px` : 'auto';
		}

		connectedCallback() {
			super.connectedCallback();
			this.refUpdHeight = () => this.updHeight();
			Responsive.onDeviceChange(this.refUpdHeight);
		}

		onAttached() {
			this.subID = Responsive.onDeviceChange(device => {
				if (device == Responsive.devices.phone) this.context.height = window.innerHeight;else this.context.height = '';
			});
		}

		render() {
			this.updHeight();

			let legOfferOpacity = this.context.calendarShowed ? 'opacity: 0; visibility: hidden; z-index: -1;' : 'opacity: 1; visibility: visible;';

			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ style: `height: ${this.context.height ? this.context.height + 'px' : '100%'}` },
				ME.container({
					mod: { className: 'home-hero-wrapper' },
					children: [BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'brand', safeHTML: svgIcon.logo() }),
					// <hero-slide-show />,

					ME.container({
						mod: { className: 'jet-search-homepage' },
						children: [
						// <jet-search origin={getUrlParams('origin')} destination={getUrlParams('destination')} />,
						// ME.layout.grid({
						// 	children: [
						// 		ME.layout.cell({ common: 12, phone: 12 },
						// 			<search-titles />
						// 		)
						// 	]
						// }),
						BMPVD.createBMPVirtulaDOMElement('jetsm-search', {
							titleText: this.titleText,
							'url-update': 'true',
							oncalendarhide: ev => this.context.showLegOffer = true,
							oncalendarshow: ev => this.context.showLegOffer = false,
							origin: getUrlParams('origin'),
							destination: getUrlParams('destination')
						})]
					}), BMPVD.createBMPVirtulaDOMElement('div', { onclick: () => smoothScroll({ element: 'popular-routes' }), safeHTML: svgIcon.clickMe(), className: 'scroll-arrow' })]
				}),
				BMPVD.createBMPVirtulaDOMElement('jet-leg-offer', { style: `${legOfferOpacity}` }),
				',',
				BMPVD.createBMPVirtulaDOMElement('home-parallax', null)
			);
		}

	}

	if (!customElements.get('home-hero')) customElements.define('home-hero', HomeHero);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$20 = instance.define({
		name: 'card-full-image',
		cssjs: {
			'display': 'block',
			'overflow': 'hidden',
			'height': '300px',
			'position': 'relative',
			'border-radius': '6px',
			'box-shadow': FX.shadowDefault,
			'transition-duration': FX.transSpeedFast,
			'&:hover': {
				'box-shadow': FX.shadowHover
			},
			// 'transition-duration': FX.transSpeedFast,
			// 'box-shadow': FX.shadowDefault,
			// 'transform': 'scale(1)',

			// '&:after': {
			// 'content': '""',
			// 'position': 'absolute',
			// 'top': '0',
			// 'left': '0',
			// 'width': '100%',
			// 'height': '100%',
			// 'background': '#000',
			// 'opacity': '0.1',
			// },

			// '&:hover': {
			// 	'transform': 'scale(1.01)',
			// 	'box-shadow': FX.shadowHover,
			// 	'.bg-holder': {
			// 		'transform': 'scale(0.93) translate3d(-50%, -50%, 0)',
			// 	},
			// },

			// '&:active': {
			// 	'box-shadow': FX.shadowDefault,
			// 	'transform': 'scale(1)',
			// 	'.bg-holder': {
			// 		'transform': 'scale(1) translate3d(-50%, -50%, 0)',
			// 	},
			// 	'&:hover': {
			// 		'transform': 'scale(1)',
			// 		'box-shadow': FX.shadowDefault,
			// 		'.bg-holder': {
			// 			'transform': 'scale(1) translate3d(-50%, -50%, 0)',
			// 		},
			// 	}
			// },


			'.content': {
				'top': '0',
				'left': '0',
				'position': 'absolute',
				'z-index': '1',
				'min-height': '100%',
				'min-width': '100%',
				'padding': '10px 10px 20px 10px',
				'.mdc-layout-grid__inner': {
					'height': '250px'
				}
			},

			'.bg-holder': {
				'position': 'absolute',
				'transform': 'translate(-50%, -50%)',
				// 'transform': 'scale(1) translate(-50%, -50%)',
				'top': '50%',
				'left': '50%',
				'height': '100%',
				'width': 'auto'
				// 'transition-duration': '0.5s',
				// 'transform-origin': '0% 0%',
			}
		}
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const cssjs$15 = {
		'display': 'block',

		'.popular-routes-title': {
			'.h4-style': {
				'font-size': '30px',
				'text-align': 'left',
				'font-weight': '400',
				'color': COLOR.white,
				'letter-spacing': '-1px',
				'font-family': 'Gotham'
			}
		},
		'.popular-routes-card': {
			'display': 'block',
			'overflow': 'hidden',
			'height': '300px',
			'position': 'relative',
			'border-radius': '6px',
			'box-shadow': FX.shadowDefault,
			'transition-duration': FX.transSpeedFast,
			'&:hover': {
				'box-shadow': FX.shadowHover
			},

			/**
		 *  // TODO braking parallax styles
		 *
			'transition-duration': FX.transSpeedFast,
			'box-shadow': FX.shadowDefault,
			'transform': 'scale(1)',
			'&:hover': {
				'transform': 'scale(1.01)',
				'box-shadow': FX.shadowHover,
				'.bg-holder': {
					'transform': 'scale(0.93) translate3d(-50%, -50%, 0)',
				},
			},
			'&:active': {
				'box-shadow': FX.shadowDefault,
				'transform': 'scale(1)',
				'.bg-holder': {
					'transform': 'scale(1) translate3d(-50%, -50%, 0)',
				},
				'&:hover': {
					'transform': 'scale(1)',
					'box-shadow': FX.shadowDefault,
					'.bg-holder': {
						'transform': 'scale(1) translate3d(-50%, -50%, 0)',
					},
				}
			},
		*/

			'.content': {
				'top': '0',
				'left': '0',
				'position': 'absolute',
				'z-index': '1',
				'min-height': '100%',
				'min-width': '100%',
				'padding': '20px 10px 20px 20px',
				'.mdc-layout-grid__inner': {
					'height': '250px'
				}
			},

			'.bg-holder': {
				'width': 'auto',
				'height': '100%'

				/**
			* // TODO braking parallax styles
			*
		 'position': 'absolute',
		 'transform': 'scale(1) translate3d(-50%, -50%, 0)',
		 'top': '50%',
		 'left': '50%',
		 'height': '110%',
		 'width': 'auto',
		 'transition-duration': '0.5s',
		 'transform-origin': '0% 0%',
		 */
			}
		},

		'@media (max-width: 839px)': {
			'.popular-routes-card': {
				'.bg-holder': {
					'width': '100%',
					'height': 'auto'
				}
			}
		},
		'@media (max-width: 630px)': {
			'.popular-routes-card': {
				'.bg-holder': {
					'width': 'auto',
					'height': '100%'
				}
			}
		}
	};

	const cssjs$16 = {
		'display': 'block',
		// 'background-color': '#fff',
		// 'border-radius': '6px',

		'.flip-container': {
			'perspective': '2000px',
			'transform': 'translate3d(0,0,0)',
			'transform-style': 'preserve-3d',
			'-webkit-transform-style': 'preserve-3d',
			'-moz-transform-style': 'preserve-3d',
			'-o-transform-style': 'preserve-3d',
			'-ms-transform-style': 'preserve-3d'
		},
		'.flip-container.reverse .back': {
			'transform': 'rotateY(0deg) translate3d(0,0,0)'
		},
		'.flip-container.reverse .front': {
			'transform': 'rotateY(180deg) translate3d(0,0,0)'
		},
		'.flip-container, .front, .back': {
			'width': '100%',
			'height': '80px'
		},
		'.flipper': {
			'transition-duration': '0.6s',
			'transform-style': 'preserve-3d',
			'position': 'relative',
			'transform': 'translate3d(0,0,0)',
			'display': 'block'
		},
		'.front, .back': {
			'-webkit-backface-visibility': 'hidden',
			'backface-visibility': 'hidden',
			'-webkit-transition': '0.6s',
			'transition': '0.6s',
			'-webkit-transform-style': 'preserve-3d',
			'transform-style': 'preserve-3d',
			'transition-duration': '0.6s',
			'position': 'absolute',
			'top': '0',
			'left': '0'

		},
		'.front': {
			'z-index': '2',
			'-webkit-transform': 'rotateY(0deg)',
			'transform': 'rotateY(0deg)'
		},
		'.back': {
			'-webkit-transform': 'rotateY(-180deg) translate3d(0,0,0)',
			'transform': 'rotateY(-180deg) translate3d(0,0,0)'
		},

		'.route-tile': {
			'display': 'block'
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponentRouteTile = instance.define({
		name: 'route-tile',
		cssjs: {
			'display': 'block',

			'.route-item': {
				'display': 'flex',
				'justify-content': 'space-between',
				'align-items': 'center',
				'border': '1px solid #979797',
				'border-radius': '6px',
				'height': '80px',
				'padding': '0 20px',
				'position': 'relative',
				'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0px',
				'transition-duration': FX.transSpeedFast,

				'&:active': {
					'transition-duration': '.25s',
					'border': `1px solid ${COLOR.primary}`,
					'background-color': COLOR.primary,
					'h4': {
						'color': COLOR.white,
						'background': COLOR.primary,
						'transition-duration': '.25s'
					},
					'&:after': {
						'transition-duration': '.25s',
						'background': COLOR.white
					},
					'.route-item-icon': {
						'background': COLOR.primary,
						'border-color': COLOR.white,
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': `${COLOR.white}`
							}
						}
					},

					'&:hover': {
						'&:after': {
							'transition-duration': '.25s',
							'background': `${COLOR.white}`
						},
						'.route-item-icon': {
							'transition-duration': '.25s',
							'border-color': COLOR.white,
							'svg': {
								'path': {
									'transition-duration': '.25s',
									'stroke': COLOR.white
								}
							}
						}
					}
				},

				'&:hover': {
					'transition-duration': '.25s',
					'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 3px 2px -1px, rgba(0, 0, 0, 0.07) 0px 3px 2px 0px, rgba(0, 0, 0, 0.06) 0px 3px 4px 0px',
					'&:after': {
						'transition-duration': '.25s',
						'background': COLOR.primary
					},
					'.route-item-icon': {
						'border-color': COLOR.primary,
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': COLOR.primary
							}
						}
					}
				},

				'&:after': {
					'content': "",
					'display': 'block',
					'position': 'absolute',
					'height': '1px',
					'background': '#A8A8A8',
					'width': '80%',
					'top': '0',
					'bottom': '0',
					'margin': 'auto',
					'left': '0',
					'right': '0',
					'z-index': '1',
					'transition-duration': '.25s'
				},

				'h4': {
					'z-index': '2',
					'background': '#fff',
					'position': 'relative',
					'display': 'inline-block',
					'transition-duration': '.25s',
					'color': `${COLOR.dark}`,
					'letter-spacing': '-0.4px',

					'@media (max-width: 960px)': {
						'font-size': '18px'
					}
				},

				'.route-item-from': {
					'width': 'calc(50% - 20px)',
					'text-align': 'left',
					'h4': {
						'padding-right': '5px'
					}
				},

				'.route-item-to': {
					'width': 'calc(50% - 20px)',
					'text-align': 'right',
					'h4': {
						'padding-left': '5px'
					}
				},

				'.route-item-img': {
					'background': 'transparent',
					'border': 'none',
					'-webkit-appearance': 'none',
					'-moz-appearance': 'none',
					'appearance': 'none',
					'-webkit-tap-highlight-color': 'transparent',
					'outline': 'none',
					'cursor': 'pointer'
				},

				'.route-item-icon': {
					'background': '#fff',
					'z-index': '2',
					'cursor': 'pointer',
					'position': 'relative',
					'transition-duration': '.25s',
					'border-radius': FX.radiusSmall,
					'border': '1px solid #A8A8A8',
					'width': '37px',
					'height': '37px',
					'display': 'flex',
					'align-content': 'center',
					'align-items': 'center',
					'justify-content': 'center',

					'&:hover': {
						'background-color': COLOR.primary,
						'transition-duration': '.25s',
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': COLOR.white
							}
						}
					},

					'svg': {
						'g': {
							'transition-duration': '.25s',
							'fill': '#fff'
						}
					}
				}
			}

		}
	});

	class RouteTile extends BMPVDWebComponent {
		constructor() {
			super();
		}

		flipCard(e) {
			e.preventDefault();
			e.stopPropagation();
			if (this.flipHolder && typeof this.flipHolder.flipHandler === 'function') this.flipHolder.flipHandler({ from: this.from, to: this.to });
		}

		ready() {
			bmpCssComponentRouteTile.attachStyles(this);
			this.flipHolder = this.closest(this.getAttribute('flip-holder'));
			this.flipable = this.getAttribute('flipable');
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			return Promise.resolve();
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'a',
				{
					className: 'route-item',
					href: `/?origin=${this.from}&destination=${this.to}` },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'route-item-from' },
					h4(``, this.from)
				),
				this.flipable ? BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ className: 'route-item-img', onClick: this.flipCard.bind(this) },
					BMPVD.createBMPVirtulaDOMElement('span', { className: 'route-item-icon', safeHTML: svgIcon.allRoutesArrows() })
				) : null,
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'route-item-to' },
					h4(``, this.to)
				)
			);
		}
	}

	if (!customElements.get('route-tile')) customElements.define('route-tile', RouteTile);
	const routeTile = ({
		from, to,
		flipable = false,
		onClick,
		extractFlipFrom
	}) => BMPVD.createBMPVirtulaDOMElement('route-tile', { from: from, to: to, flipable: flipable, 'flip-holder': extractFlipFrom, onClick: onClick });

	let bmpCssComponent$21 = instance.define({
		name: 'flipable-route-tile', cssjs: cssjs$16
	});
	class FlipableRouteTile extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$21.attachStyles(this);
			this.clickHolder = this.closest(this.getAttribute('click-holder'));
			this.flipHolder = this.closest(this.getAttribute('flip-holder'));
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			return Promise.resolve();
		}

		flipHandler({ from, to }) {
			this.querySelector('.flip-container').classList.toggle('reverse');
			if (this.flipHolder && typeof this.flipHolder.flipHandlerForRouteTile === 'function') this.clickHolder.flipHandlerForRouteTile({ from, to });
		}

		routeClickHandler({ from, to }) {
			if (this.clickHolder && typeof this.clickHolder.clickHandlerForRouteTile === 'function') this.clickHolder.clickHandlerForRouteTile({ from, to });else return;
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'flip-container' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'flipper' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'front' },
						routeTile({
							from: this.from,
							to: this.to,
							onClick: e => {
								e.preventDefault();this.routeClickHandler({ from: this.from, to: this.to });
							},
							extractFlipFrom: 'flipable-route-tile',
							flipable: true
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'back' },
						routeTile({
							from: this.to,
							to: this.from,
							onClick: e => {
								e.preventDefault();this.routeClickHandler({ from: this.to, to: this.from });
							},
							extractFlipFrom: 'flipable-route-tile',
							flipable: true
						})
					)
				)
			);
		}
	}

	if (!customElements.get('flipable-route-tile')) customElements.define('flipable-route-tile', FlipableRouteTile);
	/** Generates <flipable-route-tile/> component
	 * @param { String } from
	 * @param { String } to
	 * @param { String } extractClickHandlerFrom CSS Selector
	 * @param { String } extractFlipHandlerFrom CSS Selector
	 * @returns { Object } Virtual Dom Node
	 */
	const flipableRouteTile = ({
		from, to,
		extractClickHandlerFrom = null,
		extractFlipHandlerFrom = null
	}) => BMPVD.createBMPVirtulaDOMElement('flipable-route-tile', { from: from, to: to, 'click-holder': extractClickHandlerFrom, 'flip-holder': extractFlipHandlerFrom });

	const cssjs$17 = {
		'display': 'block',
		// 'background': 'rgba(0,0,0,0.5)',
		// 'z-index': '1000',
		// 'position': 'fixed',
		// 'top': '0',
		// 'bottom': '0',
		// 'left': '0',
		// 'right': '0',
		// 'overflow-y': 'scroll',


		'.flip-modal': {
			// 'position': 'relative',
			// 'padding': '100px 20px 50px',
			// 'z-index': '1',
			// 'min-height': '100vh',
			// 'min-height': '100vh',

			'flipable-route-tile': {
				'padding': '30px 0 30px',
				'background': "#EEECE7",
				'border-radius': '6px 6px 0 0',
				'& ~ price-datepicker': {
					'.date-picker-container': {
						'box-shadow': 'none'
					}
				},

				'.front': {
					'background-color': '#EEECE7',
					'border-radius': '6px',
					'height': '60px'
				},
				'.back': {
					'background-color': '#EEECE7',
					'border-radius': '6px',
					'height': '60px'
				},
				'.route-item': {
					'.route-item-icon': {
						background: '#EEECE7',
						'&:hover': {
							background: '#FE6A57'
						}
					},
					'h4': {
						background: '#EEECE7'
					},
					'&:active h4': {
						background: '#FE6A57'
					}
				}
			},

			'.flip-container': {
				'height': '60px',
				'perspective': '2000px',
				'width': '100%',
				'max-width': '500px',
				'margin': 'auto',

				'route-tile': {
					'.route-item': {
						'height': '60px',
						'border': 'none',
						'box-shadow': 'none',
						'&:hover': {
							'box-shadow': 'none'
						},
						'h4': {
							'font-size': '24px',
							'font-weight': '400'
						}
					}
				}
			}
		},

		'.route-and-calendar-inner': {
			'background': '#fff',
			'position': 'relative',
			'border-radius': '6px',
			'max-width': '790px',
			'width': '100%',
			'margin': 'auto'
		},

		'.close-route-and-calendar': {
			'position': 'absolute',
			'top': '0',
			'right': '0',
			"-webkit-appearance": 'none',
			'-moz-appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'background': 'transparent',
			'appearance': 'none',
			'outline': 'none',
			'border': 'none',
			'width': '60px',
			'height': '60px',
			'cursor': 'pointer'
		},

		'@media (max-width: 600px)': {
			'.flip-modal': {
				'padding': '0',
				'.flip-container': {
					'route-tile': {
						'.route-item': {
							'h4': {
								'font-size': '18px',
								'font-weight': '400'
							}
						}
					}
				},
				'flipable-route-tile': {
					'padding': '50px 0 10px'
				}
			}
		}

	};

	var _extends$9 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const gridMarginAndGutter = ['phone', 'tablet', 'desktop'].reduce((out, iter) => {
		return _extends$9({}, out, { [iter]: { gutter: '0', margin: '0' } });
	}, {});

	let bmpCssComponent$22 = instance.define({
		name: 'route-and-calendar', cssjs: cssjs$17
	});

	class RouteAndCalendar extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$22.attachStyles(this);
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			this.context = this.observe({
				from: this.from,
				to: this.to
			});
			return Promise.resolve();
		}

		flipHandlerForRouteTile({ from, to }) {
			this.context.from = to;
			this.context.to = from;
		}

		closeModal(e) {
			e.preventDefault();
			// this.closest('shared-modal-layer').close()
			// this.closest('modal-window').close()
			this.closest('modal-layer').close();
		}

		render() {
			return ME.container({
				mod: { className: 'flip-modal' },
				children: [ME.layout.grid({
					mod: gridMarginAndGutter,
					children: [ME.layout.cell({ common: 12, align: 'middle' }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'route-and-calendar-inner' },
						BMPVD.createBMPVirtulaDOMElement('button', { safeHTML: svgIcon.close(), className: 'close-route-and-calendar', onClick: this.closeModal.bind(this) }),
						flipableRouteTile({
							from: this.from,
							to: this.to,
							extractClickHandlerFrom: 'route-and-calendar',
							extractFlipHandlerFrom: 'route-and-calendar'
						}),
						priceDatepicker({ origin: this.context.from, destination: this.context.to })
					))]
				})]
			});
		}
	}

	if (!customElements.get('route-and-calendar')) customElements.define('route-and-calendar', RouteAndCalendar);
	const routeAndCalendar = ({ from, to }) => BMPVD.createBMPVirtulaDOMElement('route-and-calendar', { from: from, to: to });

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	class ModalSimple {

		constructor() {}

		show({ JSXContent = null, closeBtn = false, animateName = '', modClass = '' } = {}) {
			this.modalLayer = ModalLayer.show({
				modal: [BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: `mw-modal mw-modal__simple ${animateName} ${modClass}` },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'modal-outer' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'modal-inner' },
							JSXContent,
							closeBtn ? BMPVD.createBMPVirtulaDOMElement('button', { onClick: this.confirm.bind(this) }) : null
						)
					)
				)]
			});
			return new Promise((res, rej) => {
				this.promiseResolver = () => {
					res();
				};
			});
		}

		close(e) {
			this.promiseResolver();
			this.modalLayer.close();
			// if (e.target.classList.contains('modal-outer')) {
			// 	this.promiseResolver()
			// 	this.modalLayer.close()
			// }
		}

		confirm() {
			this.promiseResolver();
			this.modalLayer.close();
		}
	}

	var _extends$10 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const CARD_MAX_LENGTH = 4;

	let areas$1 = [];
	/**
	 * Get all routes by passed destination metropolitan area
	 * @returns { Array } Array with objects { from: { <MetropolitanArea> }, to: { <MetropolitanArea> } }
	 */
	const findRoutesByOrigin = from => {
		const destinationIcaoList = whereOriginIn(from.reference, 'city', 'priority').map(el => el.icao);
		return areas$1.filter(area => area.icao.find(icao => destinationIcaoList.includes(icao))).map(to => ({ from, to }));
	};

	const isEqual = (ma1, ma2) => ma1.reference.find(ref => ma2.reference.includes(ref));

	const getRoutesList = priorityFrom => {
		const geo = getUserLocation();
		// get all metropolitan areas sorted by geo
		const sortedAreas = sortMetropolitanAreas$1([geo.Latitude, geo.Longitude], areas$1);
		if (priorityFrom && priorityFrom.reference) {
			sortedAreas.sort((a, b) => isEqual(a, priorityFrom) ? -1 : // a == from
			isEqual(b, priorityFrom) ? 1 : 0 // b == from : nothing
			);
		}

		return sortedAreas.reduce(
		// set limit to "CARD_MAX_LENGTH" routes
		(routesList, from) => routesList.length >= CARD_MAX_LENGTH ? routesList : [...routesList, ...findRoutesByOrigin(from)], []).map(el => _extends$10({}, el, { img: `https://jetsmarter.com/data/site-v5/assets/countries/${el.to.ma.toLowerCase().replace(' ', '-')}.jpg` })).slice(0, CARD_MAX_LENGTH); // slice array by max length of cards
	};

	let bmpCssComponent$23 = instance.define({
		name: 'popular-routes', cssjs: cssjs$15
	});

	class PopularRoutes extends BMPVDWebComponent {

		constructor() {
			super();
		}

		disconnectedCallback() {
			instance$1.unsubscribe('search.selected_route', this.subID);
		}

		onAttached() {
			this.subID = instance$1.subscribe('search.selected_route', route => {
				this.context.routes = this.getRoutes(route);
			});
		}

		getRoutes(selectedRoute) {
			return getRoutesList(selectedRoute ? selectedRoute.from : null).map(route => {
				const [fromRef, toRef] = findValidRoute(route.from.reference, route.to.reference);
				return _extends$10({}, route, {
					from: _extends$10({}, route.from, { reference: fromRef.city }),
					to: _extends$10({}, route.to, { reference: toRef.city })
				});
			});
		}

		async ready() {
			bmpCssComponent$23.attachStyles(this);
			if (!window.IS_SSR) areas$1 = await formatAreas();
			this.context = this.observe({
				routes: this.getRoutes()
			});
		}

		async setRoute(origin, destination) {
			smoothScroll({ element: 'jetsm-home', duration: 300 });
			const urlGoto = `${location.origin}/?origin=${origin}&destination=${destination}`;

			window.history.pushState({ 'url': urlGoto }, '', urlGoto);
			const searchForm = document.querySelector('jetsm-leg-search');
			if (searchForm) {
				const evData = _extends$10({
					name: 'depart-date'
				}, { origin, destination });
				searchForm.dispatchEvent(new CustomEvent('showcalendar', { detail: evData }));
			}
			// window.dispatchEvent( new Event('popstate') )
		}

		desktopView(routes) {
			return routes.map(item => {
				return ME.layout.cell({ common: 3, tablet: 4 }, BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ type: 'button',
						'class': 'card btn-reset',
						'data-origin': item.from.reference,
						'data-destination': item.to.reference,
						onclick: ({ target }) => new ModalSimple().show({
							animateName: 'bouncing',
							JSXContent: routeAndCalendar({
								from: target.closest('button').getAttribute('data-origin'),
								to: target.closest('button').getAttribute('data-destination')
							})
						}) },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'popular-routes-card' },
						BMPVD.createBMPVirtulaDOMElement('img', { className: 'bg-holder', src: item.img }),
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'content' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'popular-routes-title' },
								h4('', item.from.ma),
								BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.planeMedium({ color: COLOR.white }), className: 'route-delimiter' }),
								h4('', item.to.ma)
							)
						),
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'route-start-price' },
							textSmall(`color: ${COLOR.white}; text-align: left;`, 'Starts from:'),
							minPriceForRoute({ from: item.from.reference, to: item.to.reference })
						)
					)
				));
			});
		}

		mobileView(routes) {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'popular-routes-title-mobile' },
				h3(`color: ${COLOR.dark}; padding: 0 10px 20px`, BMPVD.createBMPVirtulaDOMElement(
					'span',
					null,
					'Popular routes'
				)),
				BMPVD.createBMPVirtulaDOMElement(
					'swish-slider',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'bmp-slider',
						{ 'class': 'swish__ui', 'shifted-delta': '1.3' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ 'class': 'swish__slider' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ 'class': 'swish__slider_inner' },
								BMPVD.createBMPVirtulaDOMElement(
									'ul',
									{ 'class': 'swish__list' },
									routes.map(route => BMPVD.createBMPVirtulaDOMElement(
										'li',
										{ 'class': 'swish__item', 'data-thumb-img': route.img },
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ 'class': 'swish__item_inner' },
											BMPVD.createBMPVirtulaDOMElement(
												'button',
												{
													'data-origin': route.from.reference,
													'data-destination': route.to.reference,
													onclick: ({ target }) => new ModalSimple().show({
														animateName: 'bouncing',
														JSXContent: routeAndCalendar({
															from: target.closest('button').getAttribute('data-origin'),
															to: target.closest('button').getAttribute('data-destination')
														})
													}),
													'class': 'card btn-reset',
													style: `background: url('${route.img}') no-repeat 50% 50% / cover; width: 100%; height: 100%; border-radius: 6px; height: 290px;` },
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'swish__item_routes' },
													BMPVD.createBMPVirtulaDOMElement(
														'div',
														{ className: 'popular-routes-title' },
														h4('', route.from.ma),
														BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.planeMedium({ color: COLOR.white }), className: 'route-delimiter' }),
														h4('', route.to.ma)
													)
												),
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'route-start-price' },
													textSmall(`color: ${COLOR.white}; text-align: left;`, 'Starts from:'),
													minPriceForRoute({ from: route.from.reference, to: route.to.reference })
												)
											)
										)
									))
								)
							)
						)
					)
				)
			);
		}

		render() {

			return ME.container({
				mod: { className: 'mv1200' },
				children: [ME.layout.grid({
					mod: { phone: { margin: 0 } },
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'phone-hidden' },
						ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}`, BMPVD.createBMPVirtulaDOMElement(
							'span',
							null,
							'Popular routes'
						)))
					))]
				}), BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'phone-hidden' },
						ME.layout.grid({
							children: this.desktopView(this.context.routes)
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						null,
						this.mobileView(this.context.routes)
					)
				)]
			});
		}

	}

	customElements.define('popular-routes', PopularRoutes);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	// initiate JS in Css interface
	let bmpCss$1 = instance;

	let bmpCssComponent$24 = bmpCss$1.define({
		name: 'jetsm-home',
		cssjs: {
			'display': 'block',
			'.phone-hidden': {
				'@media (max-width: 480px)': {
					'display': 'none'
				}
			},
			'.card': {
				'width': '100%',
				'cursor': 'pointer'
			},
			'.section': {
				'padding-bottom': '103px'
			},
			'main': {
				'padding-top': '103px',
				'background-color': COLOR.white
			},
			'.popular-routes-title-mobile': {
				'display': 'none'
			},
			'.swish__ui': {
				'display': 'none'
			},
			'@media (max-width: 479px)': {
				'.popular-routes-title-mobile': {
					'display': 'block'
				},
				'main': {
					'padding-top': '20px',
					'padding-bottom': '40px',
					'background-color': COLOR.light
				},
				'.section': {
					'padding-bottom': '64px'
				},
				'.swish__ui': {
					'padding': '0 0 20px',
					'display': 'block'
				}
			},
			'.swish__ui .swish__item': {
				'.swish__item_inner': {
					'padding': '0 5px 0 5px'
				},

				'&:first-child': {
					'.swish__item_inner': {
						'padding-left': '10px'
					}
				},

				'&:last-child': {
					'.swish__item_inner': {
						'padding-right': '10px'
					}
				},
				'.swish__item_routes': {
					'position': 'absolute',
					'top': '20px',
					'left': '20px'
				}
			},
			// '.swish__ui .swish__item_inner': {
			// 	'padding': '0 10px'
			// },
			'.swish__ui .swish__item_inner > *': {
				// 'display': 'flex',
				// 'flex-direction': 'column',
				// 'justify-content': 'start',
				'padding': '20px 20px 30px 20px'
			},
			'.route-delimiter': {
				'text-align': 'left',
				'display': 'block',
				'margin': '5px 0 2px'
				// 'height': '2px',
				// 'background': COLOR.primary,
				// 'margin-bottom': '-2px'
			},
			'.priority-links-item': {
				'height': '350px',
				'display': 'flex',
				'background-size': 'cover',
				'background-position': '50% 50%',
				'border-radius': '6px',
				'text-decoration': 'none',
				'align-items': 'center',
				'padding': '12px',
				'transition-duration': FX.speed.fast,
				'box-shadow': FX.shadow.default,
				'&:hover': {
					'transition-duration': FX.speed.fast,
					'box-shadow': FX.shadow.hover
					// 'transform': `scale(${FX.scale.hover})`
				},
				'&:active:hover': {
					'transition-duration': FX.speed.fast,
					'box-shadow': FX.shadow.default
					// 'transform': 'scale(1)',
				}
			},

			'.homepage-content': {
				'padding': '0 0 64px'
			},

			'.route-start-price': {
				'position': 'absolute',
				'bottom': '20px',
				'right': '20px'
			}

		}
	});

	class Home extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$24.attachStyles(this);
		}

		getRoutesSection() {
			return ME.container({
				mod: { class: 'section routes' },
				children: [ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('popular-routes', null)), ME.layout.cell({ common: 12 }, linkButtonPrimary$1('', BMPVD.createBMPVirtulaDOMElement(
						'bmp-anchor',
						{ style: 'display: block; padding: 0 10px;' },
						BMPVD.createBMPVirtulaDOMElement(
							'a',
							{ href: '/flights/', style: 'margin: auto; display: block;' },
							'View all routes'
						)
					)))]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', null),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: ME.container({
					mod: { className: 'homepage-content' },
					children: [BMPVD.createBMPVirtulaDOMElement('home-hero', null), this.getRoutesSection(), priorityLinks()]
				})

			});
		}

	}

	if (!customElements.get('jetsm-home')) customElements.define('jetsm-home', Home);

	const cssjs$18 = {
		'display': 'block',
		'.route-list': {
			'padding': '0 0 57px'
		}
	};

	const cssjs$19 = {
		'display': 'block',
		// 'background-color': '#fff',
		// 'border-radius': '6px',

		'.flip-container': {
			'perspective': '2000px',
			'transform': 'translate3d(0,0,0)',
			'transform-style': 'preserve-3d',
			'-webkit-transform-style': 'preserve-3d',
			'-moz-transform-style': 'preserve-3d',
			'-o-transform-style': 'preserve-3d',
			'-ms-transform-style': 'preserve-3d'
		},
		'.flip-container.reverse .back': {
			'transform': 'rotateY(0deg) translate3d(0,0,0)'
		},
		'.flip-container.reverse .front': {
			'transform': 'rotateY(180deg) translate3d(0,0,0)'
		},
		'.flip-container, .front, .back': {
			'width': '100%',
			'height': '80px'
		},
		'.flipper': {
			'transition-duration': '0.6s',
			'transform-style': 'preserve-3d',
			'position': 'relative',
			'transform': 'translate3d(0,0,0)',
			'display': 'block'
		},
		'.front, .back': {
			'-webkit-backface-visibility': 'hidden',
			'backface-visibility': 'hidden',
			'-webkit-transition': '0.6s',
			'transition': '0.6s',
			'-webkit-transform-style': 'preserve-3d',
			'transform-style': 'preserve-3d',
			'transition-duration': '0.6s',
			'position': 'absolute',
			'top': '0',
			'left': '0'

		},
		'.front': {
			'z-index': '2',
			'-webkit-transform': 'rotateY(0deg)',
			'transform': 'rotateY(0deg)'
		},
		'.back': {
			'-webkit-transform': 'rotateY(-180deg) translate3d(0,0,0)',
			'transform': 'rotateY(-180deg) translate3d(0,0,0)'
		},

		'.route-tile': {
			'display': 'block'
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponentRouteTile$1 = instance.define({
		name: 'route-tile',
		cssjs: {
			'display': 'block',

			'.route-item': {
				'display': 'flex',
				'justify-content': 'space-between',
				'align-items': 'center',
				'border': '1px solid #979797',
				'border-radius': '6px',
				'height': '80px',
				'padding': '0 20px',
				'position': 'relative',
				'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 0px 0px 0px, rgba(0, 0, 0, 0.07) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 0px',
				'transition-duration': FX.transSpeedFast,

				'&:active': {
					'transition-duration': '.25s',
					'border': `1px solid ${COLOR.primary}`,
					'background-color': COLOR.primary,
					'h4': {
						'color': COLOR.white,
						'background': COLOR.primary,
						'transition-duration': '.25s'
					},
					'&:after': {
						'transition-duration': '.25s',
						'background': COLOR.white
					},
					'.route-item-icon': {
						'background': COLOR.primary,
						'border-color': COLOR.white,
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': `${COLOR.white}`
							}
						}
					},

					'&:hover': {
						'&:after': {
							'transition-duration': '.25s',
							'background': `${COLOR.white}`
						},
						'.route-item-icon': {
							'transition-duration': '.25s',
							'border-color': COLOR.white,
							'svg': {
								'path': {
									'transition-duration': '.25s',
									'stroke': COLOR.white
								}
							}
						}
					}
				},

				'&:hover': {
					'transition-duration': '.25s',
					'box-shadow': 'rgba(0, 0, 0, 0.1) 0px 3px 2px -1px, rgba(0, 0, 0, 0.07) 0px 3px 2px 0px, rgba(0, 0, 0, 0.06) 0px 3px 4px 0px',
					'&:after': {
						'transition-duration': '.25s',
						'background': COLOR.primary
					},
					'.route-item-icon': {
						'border-color': COLOR.primary,
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': COLOR.primary
							}
						}
					}
				},

				'&:after': {
					'content': "",
					'display': 'block',
					'position': 'absolute',
					'height': '1px',
					'background': '#A8A8A8',
					'width': '80%',
					'top': '0',
					'bottom': '0',
					'margin': 'auto',
					'left': '0',
					'right': '0',
					'z-index': '1',
					'transition-duration': '.25s'
				},

				'h4': {
					'z-index': '2',
					'background': '#fff',
					'position': 'relative',
					'display': 'inline-block',
					'transition-duration': '.25s',
					'color': `${COLOR.dark}`,
					'letter-spacing': '-0.4px',

					'@media (max-width: 960px)': {
						'font-size': '18px'
					}
				},

				'.route-item-from': {
					'width': 'calc(50% - 20px)',
					'text-align': 'left',
					'h4': {
						'padding-right': '5px'
					}
				},

				'.route-item-to': {
					'width': 'calc(50% - 20px)',
					'text-align': 'right',
					'h4': {
						'padding-left': '5px'
					}
				},

				'.route-item-img': {
					'background': 'transparent',
					'border': 'none',
					'-webkit-appearance': 'none',
					'-moz-appearance': 'none',
					'appearance': 'none',
					'-webkit-tap-highlight-color': 'transparent',
					'outline': 'none',
					'cursor': 'pointer'
				},

				'.route-item-icon': {
					'background': '#fff',
					'z-index': '2',
					'cursor': 'pointer',
					'position': 'relative',
					'transition-duration': '.25s',
					'border-radius': FX.radiusSmall,
					'border': '1px solid #A8A8A8',
					'width': '37px',
					'height': '37px',
					'display': 'flex',
					'align-content': 'center',
					'align-items': 'center',
					'justify-content': 'center',

					'&:hover': {
						'background-color': COLOR.primary,
						'transition-duration': '.25s',
						'svg': {
							'path': {
								'transition-duration': '.25s',
								'stroke': COLOR.white
							}
						}
					},

					'svg': {
						'g': {
							'transition-duration': '.25s',
							'fill': '#fff'
						}
					}
				}
			}

		}
	});

	class RouteTile$1 extends BMPVDWebComponent {
		constructor() {
			super();
		}

		flipCard(e) {
			e.preventDefault();
			e.stopPropagation();
			if (this.flipHolder && typeof this.flipHolder.flipHandler === 'function') this.flipHolder.flipHandler({ from: this.from, to: this.to });
		}

		ready() {
			bmpCssComponentRouteTile$1.attachStyles(this);
			this.flipHolder = this.closest(this.getAttribute('flip-holder'));
			this.flipable = this.getAttribute('flipable');
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			return Promise.resolve();
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'a',
				{
					className: 'route-item',
					href: `/?origin=${this.from}&destination=${this.to}` },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'route-item-from' },
					h4(``, this.from)
				),
				this.flipable ? BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ className: 'route-item-img', onClick: this.flipCard.bind(this) },
					BMPVD.createBMPVirtulaDOMElement('span', { className: 'route-item-icon', safeHTML: svgIcon.allRoutesArrows() })
				) : null,
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'route-item-to' },
					h4(``, this.to)
				)
			);
		}
	}

	if (!customElements.get('route-tile')) customElements.define('route-tile', RouteTile$1);
	const routeTile$1 = ({
		from, to,
		flipable = false,
		onClick,
		extractFlipFrom
	}) => BMPVD.createBMPVirtulaDOMElement('route-tile', { from: from, to: to, flipable: flipable, 'flip-holder': extractFlipFrom, onClick: onClick });

	let bmpCssComponent$25 = instance.define({
		name: 'flipable-route-tile', cssjs: cssjs$19
	});
	class FlipableRouteTile$1 extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$25.attachStyles(this);
			this.clickHolder = this.closest(this.getAttribute('click-holder'));
			this.flipHolder = this.closest(this.getAttribute('flip-holder'));
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			return Promise.resolve();
		}

		flipHandler({ from, to }) {
			this.querySelector('.flip-container').classList.toggle('reverse');
			if (this.flipHolder && typeof this.flipHolder.flipHandlerForRouteTile === 'function') this.clickHolder.flipHandlerForRouteTile({ from, to });
		}

		routeClickHandler({ from, to }) {
			if (this.clickHolder && typeof this.clickHolder.clickHandlerForRouteTile === 'function') this.clickHolder.clickHandlerForRouteTile({ from, to });else return;
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'flip-container' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'flipper' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'front' },
						routeTile$1({
							from: this.from,
							to: this.to,
							onClick: e => {
								e.preventDefault();this.routeClickHandler({ from: this.from, to: this.to });
							},
							extractFlipFrom: 'flipable-route-tile',
							flipable: true
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'back' },
						routeTile$1({
							from: this.to,
							to: this.from,
							onClick: e => {
								e.preventDefault();this.routeClickHandler({ from: this.to, to: this.from });
							},
							extractFlipFrom: 'flipable-route-tile',
							flipable: true
						})
					)
				)
			);
		}
	}

	if (!customElements.get('flipable-route-tile')) customElements.define('flipable-route-tile', FlipableRouteTile$1);
	/** Generates <flipable-route-tile/> component
	 * @param { String } from
	 * @param { String } to
	 * @param { String } extractClickHandlerFrom CSS Selector
	 * @param { String } extractFlipHandlerFrom CSS Selector
	 * @returns { Object } Virtual Dom Node
	 */
	const flipableRouteTile$1 = ({
		from, to,
		extractClickHandlerFrom = null,
		extractFlipHandlerFrom = null
	}) => BMPVD.createBMPVirtulaDOMElement('flipable-route-tile', { from: from, to: to, 'click-holder': extractClickHandlerFrom, 'flip-holder': extractFlipHandlerFrom });

	const cssjs$20 = {
		'display': 'block',
		// 'background': 'rgba(0,0,0,0.5)',
		// 'z-index': '1000',
		// 'position': 'fixed',
		// 'top': '0',
		// 'bottom': '0',
		// 'left': '0',
		// 'right': '0',
		// 'overflow-y': 'scroll',


		'.flip-modal': {
			// 'position': 'relative',
			// 'padding': '100px 20px 50px',
			// 'z-index': '1',
			// 'min-height': '100vh',
			// 'min-height': '100vh',

			'flipable-route-tile': {
				'padding': '30px 0 30px',
				'background': "#EEECE7",
				'border-radius': '6px 6px 0 0',
				'& ~ price-datepicker': {
					'.date-picker-container': {
						'box-shadow': 'none'
					}
				},

				'.front': {
					'background-color': '#EEECE7',
					'border-radius': '6px',
					'height': '60px'
				},
				'.back': {
					'background-color': '#EEECE7',
					'border-radius': '6px',
					'height': '60px'
				},
				'.route-item': {
					'.route-item-icon': {
						background: '#EEECE7',
						'&:hover': {
							background: '#FE6A57'
						}
					},
					'h4': {
						background: '#EEECE7'
					},
					'&:active h4': {
						background: '#FE6A57'
					}
				}
			},

			'.flip-container': {
				'height': '60px',
				'perspective': '2000px',
				'width': '100%',
				'max-width': '500px',
				'margin': 'auto',

				'route-tile': {
					'.route-item': {
						'height': '60px',
						'border': 'none',
						'box-shadow': 'none',
						'&:hover': {
							'box-shadow': 'none'
						},
						'h4': {
							'font-size': '24px',
							'font-weight': '400'
						}
					}
				}
			}
		},

		'.route-and-calendar-inner': {
			'background': '#fff',
			'position': 'relative',
			'border-radius': '6px',
			'max-width': '790px',
			'width': '100%',
			'margin': 'auto'
		},

		'.close-route-and-calendar': {
			'position': 'absolute',
			'top': '0',
			'right': '0',
			"-webkit-appearance": 'none',
			'-moz-appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'background': 'transparent',
			'appearance': 'none',
			'outline': 'none',
			'border': 'none',
			'width': '60px',
			'height': '60px',
			'cursor': 'pointer'
		},

		'@media (max-width: 600px)': {
			'.flip-modal': {
				'padding': '0',
				'.flip-container': {
					'route-tile': {
						'.route-item': {
							'h4': {
								'font-size': '18px',
								'font-weight': '400'
							}
						}
					}
				},
				'flipable-route-tile': {
					'padding': '50px 0 10px'
				}
			}
		}

	};

	var _extends$11 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const gridMarginAndGutter$1 = ['phone', 'tablet', 'desktop'].reduce((out, iter) => {
		return _extends$11({}, out, { [iter]: { gutter: '0', margin: '0' } });
	}, {});

	let bmpCssComponent$26 = instance.define({
		name: 'route-and-calendar', cssjs: cssjs$20
	});

	class RouteAndCalendar$1 extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$26.attachStyles(this);
			this.from = this.getAttribute('from');
			this.to = this.getAttribute('to');
			this.context = this.observe({
				from: this.from,
				to: this.to
			});
			return Promise.resolve();
		}

		flipHandlerForRouteTile({ from, to }) {
			this.context.from = to;
			this.context.to = from;
		}

		closeModal(e) {
			e.preventDefault();
			// this.closest('shared-modal-layer').close()
			// this.closest('modal-window').close()
			this.closest('modal-layer').close();
		}

		render() {
			return ME.container({
				mod: { className: 'flip-modal' },
				children: [ME.layout.grid({
					mod: gridMarginAndGutter$1,
					children: [ME.layout.cell({ common: 12, align: 'middle' }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'route-and-calendar-inner' },
						BMPVD.createBMPVirtulaDOMElement('button', { safeHTML: svgIcon.close(), className: 'close-route-and-calendar', onClick: this.closeModal.bind(this) }),
						flipableRouteTile$1({
							from: this.from,
							to: this.to,
							extractClickHandlerFrom: 'route-and-calendar',
							extractFlipHandlerFrom: 'route-and-calendar'
						}),
						priceDatepicker({ origin: this.context.from, destination: this.context.to })
					))]
				})]
			});
		}
	}

	if (!customElements.get('route-and-calendar')) customElements.define('route-and-calendar', RouteAndCalendar$1);
	const routeAndCalendar$1 = ({ from, to }) => BMPVD.createBMPVirtulaDOMElement('route-and-calendar', { from: from, to: to });

	const cssjs$21 = {

		'&.default': {
			'display': 'block',
			'position': 'fixed',
			'top': '0',
			'bottom': '0',
			'right': '0',
			'left': '0',
			'margin': 'auto',
			'display': 'block',
			'overflow': 'scroll',
			'z-index': '100',
			'-webkit-overflow-scrolling': 'touch',
			'.modal-window-outer': {
				'position': 'relative',
				'top': '0',
				'bottom': '0',
				'left': '0',
				'right': '0',
				'margin': 'auto',
				'min-height': '100vh',
				'display': 'flex',
				'max-width': '768px',
				'align-content': 'center',
				'align-items': 'center'
			},
			'.modal-window-inner': {
				'position': 'relative',
				'padding': '20px',
				'overflow': 'scroll'
			},
			'.modal-window-content': {
				'padding': '20px',
				'background-color': '#fff',
				'position': 'relative',
				'transform': 'translate3d(0, 0, 0)',
				'display': 'block',
				'z-index': '2'
			},
			'.modal-window-overlay': {
				'z-index': '1',
				'position': 'fixed',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)',
				'width': '200%',
				'height': '200%',
				'background-color': 'rgba(0, 0, 0, 0.5)'
			}
		},

		'&.all-routes': {
			// 'display': 'block',
			'display': 'flex',
			'position': 'fixed',
			'top': '0',
			'bottom': '0',
			'right': '0',
			'left': '0',
			'margin': 'auto',
			'display': 'block',
			'overflow': 'scroll',
			'z-index': '100',
			'-webkit-overflow-scrolling': 'touch',

			'.modal-window-outer': {
				'position': 'relative',
				'top': '0',
				'bottom': '0',
				'left': '0',
				'right': '0',
				'margin': 'auto',
				// 'min-height': '100vh',
				'z-index': '1'
			},
			'.modal-window-inner': {
				'position': 'relative'
				// 'overflow': 'scroll',
			},
			'.modal-window-content': {
				'position': 'relative',
				'transform': 'translate3d(0, 0, 0)',
				'display': 'block',
				'z-index': '2'
			},
			'.modal-window-overlay': {
				'z-index': '1',
				'position': 'fixed',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)',
				'width': '200%',
				'height': '200%',
				'background-color': 'rgba(0, 0, 0, 0.5)'
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$27 = instance.define({
		name: 'modal-window', cssjs: cssjs$21
	});

	let currentModal$1;
	let currentTop$2;
	let currentName;

	class ModalWindow extends BMPVDWebComponent {

		constructor() {
			super();
			window.addEventListener('popstate', this.close.bind(this));
		}

		static show({ modal: modal, name: name } = {}) {
			currentTop$2 = Math.round(window.pageYOffset);
			document.body.style.top = `${-currentTop$2}px`;
			document.body.classList.add('mw-is-open');
			currentModal$1 = modal;
			currentName = name;
			document.body.insertAdjacentHTML('beforeend', '<modal-window />');
		}

		onAttached() {
			if (currentName) this.classList.add(currentName);
		}

		close() {
			document.body.classList.remove('mw-is-open');
			window.scrollTo(0, currentTop$2);
			document.body.removeAttribute('style');

			this.parentNode.removeChild(this);
			currentModal$1 = null;
		}

		ready() {
			bmpCssComponent$27.attachStyles(this);
			return Promise.resolve();
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.close.bind(this));
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'mw' },
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'modal-window-overlay', onClick: e => this.close() }),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'modal-window-outer' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'modal-window-inner' },
						BMPVD.createBMPVirtulaDOMElement(
							'button',
							null,
							'CLOSE'
						),
						currentModal$1
					)
				)
			);
		}
	}

	customElements.define('modal-window', ModalWindow);

	const cssjs$22 = {
		'display': 'block',
		'position': 'relative',
		'z-index': '1',
		'padding': '50px 0 50px',

		'@media (max-width: 500px)': {
			'padding': '0'
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$28 = instance.define({
		name: 'modal-calendar-routes', cssjs: cssjs$22
	});

	class ModalCalendarRoutes extends BMPVDWebComponent {

		constructor() {
			super();
			// window.addEventListener('popstate', this.close.bind(this))
		}

		ready() {
			this.context = this.observe({ show: false });
			bmpCssComponent$28.attachStyles(this);
			return Promise.resolve();
		}

		disconnectedCallback() {
			// window.removeEventListener('popstate', this.close.bind(this))
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement('div', null);
		}
	}

	customElements.define('modal-calendar-routes', ModalCalendarRoutes);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	// showAlert() {
	// 	new ModalAlert({ btnText: 'confirm' })
	// 		.show({
	// 			JSXContent:
	// 				<div>
	// 					<ul>
	// 						<li>Lorem ipsum dolor sit amet.</li>

	// 					</ul>
	// 				</div>
	// 		})
	// 		.then(r => console.log('success'))
	// 		.catch(err => console.log(err))
	// }

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	// showChoice() {
	// 	new ModalDialog()
	// 		.show({
	// 			confirmText: 'es',
	// 			cancelText: 'oh no',
	// 			JSXContent:
	// 				<div>
	// 					<ul>
	// 						<li>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate voluptas blanditiis minus unde eum ipsam reprehenderit in similique vero repudiandae? Cum dolorem temporibus nobis voluptate sed quam laboriosam nisi voluptatum.</li>
	// 						<li>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate voluptas blanditiis minus unde eum ipsam reprehenderit in similique vero repudiandae? Cum dolorem temporibus nobis voluptate sed quam laboriosam nisi voluptatum.</li>
	// 						<li>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate voluptas blanditiis minus unde eum ipsam reprehenderit in similique vero repudiandae? Cum dolorem temporibus nobis voluptate sed quam laboriosam nisi voluptatum.</li>
	// 						<li>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate voluptas blanditiis minus unde eum ipsam reprehenderit in similique vero repudiandae? Cum dolorem temporibus nobis voluptate sed quam laboriosam nisi voluptatum.</li>
	// 						<li>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Voluptate voluptas blanditiis minus unde eum ipsam reprehenderit in similique vero repudiandae? Cum dolorem temporibus nobis voluptate sed quam laboriosam nisi voluptatum.</li>
	// 					</ul>
	// 				</div>
	// 		})
	// 		.then(r => console.log('success'))
	// 		.catch(err => console.log('cancel'))
	// }

	var _extends$12 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	let bmpCssComponent$29 = instance.define({
		name: 'routes-list',
		cssjs: cssjs$18
	});

	class RoutesList extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$29.attachStyles(this);
			this.context = this.observe({
				routes: []
			});
			routesRegionListPromise().then(res => {
				this.context.routes = res.list.map(city => _extends$12({}, city, {
					routes: alphabeticSortRoutes(city.routes)
				}));
			});
			return Promise.resolve();
		}

		// TODO: Provide Custom Props in BMPVD and clean this nasty workaround!!!
		clickHandlerForRouteTile({ from, to }) {
			// ModalLayer.show({
			// 	modal: <modal-calendar-routes>{routeAndCalendar({ from, to })}</modal-calendar-routes>
			// })
			new ModalSimple().show({
				animateName: 'bouncing',
				JSXContent: routeAndCalendar$1({ from, to })
			});
			SendGA.event({
				eventCategory: 'buttons',
				eventAction: 'clicked',
				eventLabel: 'flights',
				eventValue: `${from} — ${to}`
			});
		}

		render() {

			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(./assets/img/pages/routes/routes-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: ME.container({
					mod: { className: 'page-content' },
					children: [ME.layout.grid({
						children: [
						// ME.layout.cell({ common: 1 }),
						ME.layout.cell({ common: 6, desktop: 12, tablet: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/', className: 'back-btn', style: 'margin-bottom: 53px' },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						))]
					}), ...this.context.routes.map(area => ME.container({
						mod: { className: 'route-list' },
						children: [ME.layout.grid({
							children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 12, desktop: 12, tablet: 6, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 0;`, area.name))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 12, desktop: 12, tablet: 12, phone: 12 }, ME.layout.grid({
								mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
								children: area.routes.map(([from, to]) => ME.layout.cell({ common: 6, tablet: 12, phone: 12 }, flipableRouteTile$1({ from: from.city, to: to.city, extractClickHandlerFrom: 'routes-list' })))
							}))]
						})]
					}))]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	if (!customElements.get('routes-list')) customElements.define('routes-list', RoutesList);

	const cssjs$23 = {
		display: 'block',
		'min-height': '100vh',

		'width': '100%',

		'&[data-slug="owners-program"]': {
			'jet-header': {
				'background': '#fff !important',
				'a': {
					'color': COLOR.dark,
					'&:hover': {
						'color': COLOR.primary
					}
				},
				'.open-modal-btn': {
					'color': COLOR.dark,
					'&:hover': {
						'color': COLOR.primary
					}
				},
				'.auth-link-divider': {
					color: COLOR.darkBlured
				}
			}
		},

		'.jetsm-form': {
			'padding-top': '210px',
			'background': '50% 50%/cover no-repeat transparent',

			'&.hidden [type="submit"]': {
				'visibility': 'hidden'
			},
			'.btn': {
				'margin-top': '40px',

				'display': 'block',
				'width': '100%',
				'height': '50px',
				'background': '#FE6A57',
				'color': '#fff',
				'cursor': 'pointer',
				'text-decoration': 'none',
				'max-width': '350px',
				'text-align': 'center',
				'line-height': '50px',
				'font-family': '"Roboto"',
				'letter-spacing': '-0.5px',
				'border-radius': '6px',
				'font-weight': '300',
				'box-shadow': FX.shadow.default,
				'transition-duration': FX.speed.fast,
				'&:hover': {
					'box-shadow': FX.shadow.hover,
					'transition-duration': FX.speed.fast,
					'transform': `scale(${FX.scale.hover})`
				},
				'&:active:hover': {
					'box-shadow': FX.shadow.default,
					'transition-duration': FX.speed.fast,
					'transform': 'scale(1)'
				},
				'span': {
					'font-size': '24px',
					'text-transform': 'none'
				}
			},
			'padding-bottom': '50px'
		},
		'.error-message': {
			'position': 'absolute',
			'bottom': '-16px',
			'left': '0',
			'z-index': '1',
			'display': 'none',
			'color': '#CD5639',
			'font-size': '12px',
			'line-height': '12px',
			p: {
				'height': 'auto',
				'margin': '0',
				'text-transform': 'uppercase',
				'color': '#CD5639'
			}
		},
		'@media (max-width: 480px)': {
			'height': 'auto',
			'.jetsm-form': {
				'padding-top': '70px'
			}
		},
		'.h2': {
			margin: '0 0 68px'
		},

		'.h5': {
			margin: '0 0 30px'
		},

		'.form-group-wrapper': {
			'display': 'flex',
			'width': '100%',
			'flex-wrap': 'wrap'
		},

		'.form-group': {

			'width': '100%',
			'margin-bottom': '3.5em',
			'@media (max-width: 620px)': {
				width: '100%',
				'margin-bottom': '2.14em'
			},
			'&.form-group-left': {
				width: '45%',
				'margin-right': '5%'
			},
			'&.form-group-right': {
				'width': '45%',
				'margin-left': '5%',
				'@media (max-width: 620px)': {
					width: '100%',
					'margin-left': '0',
					'margin-bottom': '50px'
				}
			}
		},
		'@media (max-width: 599px)': {
			'.form-group.form-group-left': {
				width: '100% !important',
				margin: 0
			},
			'.form-group.form-group-right': {
				width: '100% !important',
				margin: 0
			}
		},
		'.form-group-item': {
			'padding-bottom': '2px',
			'position': 'relative',
			'min-height': '38px',

			'&:last-child': {
				'margin-bottom': '0'
			},

			'&.error': {
				'.error-message': {
					'display': 'block'
				}
			},
			'&.field-input': {
				'margin-bottom': '30px',
				'border-bottom': '1px solid ' + COLOR.neutral,
				'&:after': {
					'content': '',
					'transition-duration': '.25s',
					'display': 'block',
					'position': 'absolute',
					'width': '0',
					'bottom': '-1px',
					'height': '1px',
					'box-sizing': 'border-box'
				},
				'&.error': {
					'.error-message': {
						'display': 'block'
					}
				},
				'input': {
					'font-family': 'Roboto',
					'line-height': '32px',
					'font-size': '20px',
					'padding-bottom': '5px',
					'padding-left': '5px',
					'width': '100%',
					'border': 'none',
					'-webkit-text-fill-color': '#fff',
					'-webkit-appearance': 'none',
					'-moz-appearance': 'none',
					'appearance': 'none',
					'-webkit-tap-highlight-color': 'transparent',
					'box-shadow': 'none',
					'outline': 'none',
					'display': 'block',
					'font-weight': '300',
					'text-transform': 'none',
					'background-color': 'transparent',
					'color': '#fff',

					'&:-webkit-autofill': {
						'-webkit-box-shadow': '0 0 0 30px #433158 inset',
						'-webkit-text-fill-color': COLOR.white
					},
					'&::placeholder': {
						color: COLOR.lightBorder
					},
					'&::-webkit-input-placeholder': {
						color: COLOR.lightBorder
					},
					'&:-moz-placeholder': {
						color: COLOR.lightBorder
					},
					'&:-ms-input-placeholder': {
						color: COLOR.lightBorder
					}
				},
				label: {
					'font-family': 'Roboto',
					'font-size': '20px',
					'font-weight': 200,
					'line-height': '20px',
					'color': COLOR.lightBorder

				},
				'.focused label': {
					// 'font-size': '16px'
					'-webkit-transform': 'translate3d(-10%, -130%, 0) scale(.8)',
					'transform': 'translate3d(-10%, -130%, 0) scale(.8)'
				},
				'&.phone-input ': {
					'.phone-field__wrapper': {
						position: 'relative'
					},
					'.phone-field.integrated': {
						background: 'transparent'
					}
				}
			},
			'&.field-textarea': {
				'padding-bottom': '0',
				textarea: {
					'-webkit-appearance': 'none',
					'-moz-appearance': 'none',
					'appearance': 'none',
					'-webkit-tap-highlight-color': 'transparent',
					'box-shadow': 'none',
					'outline': 'none',
					'color': '#fff',
					'width': '100%',
					'font-weight': '300',
					'font-family': 'Roboto',
					'padding': '30px 20px',
					'font-size': '20px',
					'min-height': '24em',
					'margin-bottom': '40px',
					background: 'transparent',
					'resize': 'none',
					'border': '1px solid ' + COLOR.neutral
				},
				label: {
					'display': 'block',
					'margin-bottom': '(5 / $base + em)',
					'color': '#fff',
					'font-weight': '200'
				},
				'.counter': {
					'font-size': '(10 / $base + em)',
					'padding': '(5 / 10 + em)',
					'bottom': '-(18 / 10 + em)',
					'border': '1px solid rgba(255, 255, 255, 0.5)',
					'border-top': 'none',
					'line-height': 'normal',
					'position': 'absolute',
					'width': '100%',
					'color': '#fff'
				},
				'.error-message': {
					'bottom': '-32px',
					'@media (min-width: 1440px)': {
						bottom: '-36px'
					}
				}
			},
			'&.field-selectbox': {
				'margin-bottom': '30px',
				'.selectbox-group': {
					'cursor': 'pointer',
					'z-index': '2'
				},
				'&.opened': {
					'z-index': '3'
				}
			},
			'.ui__from_block': {
				'&.error': {
					'.error-message': {
						'display': 'block'
					}
				}
			}
		},
		'.checkbox-group': {

			'.checkbox-group-item': {
				'position': 'relative',
				'margin-bottom': '20px',
				width: '250px',
				display: 'inline-block',
				'&:nth-child(2n)': {
					width: 'calc(100% - 300px)'
				},
				'@media (max-width: 640px)': {
					width: '100% !important '
				},
				'&:last-child': {
					'margin-bottom': '0'
				},
				'.checker': {
					'display': 'inline-block',
					'vertical-align': 'middle',
					'height': '31px',
					'cursor': 'pointer',
					'position': 'relative',
					'width': '52px',
					"&:before": {
						'content': '',
						'position': 'absolute',
						'top': '0px',
						'left': '0',
						'width': '48px',
						'height': '27px',
						'border-radius': '40px',
						'border': '2px solid ' + COLOR.darkMedium,
						background: COLOR.darkMedium,
						'-webkit-transition': 'background-color .3s, border-color .3s',
						'transition': 'background-color .3s',
						'-webkit-transform': 'translate3d(0, 0, 0)',
						'-moz-transform': 'translate3d(0, 0, 0)',
						'-ms-transform': 'translate3d(0, 0, 0)',
						'-o-transform': 'translate3d(0, 0, 0)',
						'transform': 'translate3d(0, 0, 0)'
					},
					'&:after': {
						'content': '',
						'position': 'absolute',
						'top': '2px',
						'left': '2px',
						'width': '27px',
						'height': '27px',
						'border-radius': '50%',
						'background': COLOR.white,
						'transition': 'all .2s',
						'-webkit-transform': 'translate3d(0, 0, 0)',
						'-moz-transform': 'translate3d(0, 0, 0)',
						'-ms-transform': 'translate3d(0, 0, 0)',
						'-o-transform': 'translate3d(0, 0, 0)',
						'transform': 'translate3d(0, 0, 0)'
					}
				},
				'input': {
					'width': '52px',
					'height': '31px',
					'z-index': 1,
					'&:checked': {
						'& + .checker': {

							'&:before': {
								border: '2px solid #ff5c49',
								background: COLOR.primary,
								'border-color': COLOR.primary
							},
							'&:after': {
								left: '23px'
							}
						}
					},
					'& ~ label': {
						display: 'inline-block',
						'vertical-align': 'middle'
					}
				}
			},
			'input': {
				'opacity': '0',
				'position': 'absolute',
				'cursor': 'pointer',
				'width': '(20 / $base + em)',
				'height': '(20 / $base + em)',
				'left': '0',
				'top': '0',

				'&:checked + label:after': {
					'opacity': '1',
					'transform': 'rotate(-45deg) scale(1)',
					'transition-duration': '.1s',
					'transition-timing-function': 'ease-in'
				}
			},
			// input: {
			// 	'opacity': '0',
			// 	'position': 'absolute',
			// 	'cursor': 'pointer',
			// 	'width': '(20 / $base + em)',
			// 	'height': '(20 / $base + em)',
			// 	'left': '0',
			// 	'top': '0',
			// },
			label: {
				'display': 'block',
				'font-weight': '300',
				'vertical-align': 'middle',
				'position': 'relative',
				'color': '#fff',
				'cursor': 'pointer',
				'line-height': '20px',
				'font-family': 'Roboto',

				// '&:before': {
				// 	'content': '',
				// 	'display': 'inline-block',
				// 	'width': '(20 / $base + em)',
				// 	'height': '(20 / $base + em)',
				// 	'border': '1px solid #fff',
				// 	'box-sizing': 'border-box',
				// 	'border-radius': '0',
				// 	'vertical-align': 'top',
				// },
				// '&:after': {
				// 	'content': '',
				// 	'transition-duration': '.1s',
				// 	'color': '#fff',
				// 	'opacity': '0',
				// 	'position': 'absolute',
				// 	'left': '(4 / $base + em)',
				// 	'top': '(5 / $base + em)',
				// 	'width': '(13 / $base + em)',
				// 	'height': '(6 / $base + em)',
				// 	'border-bottom': 'solid 2px currentColor',
				// 	'border-left': 'solid 2px currentColor',
				// 	transform: 'rotate(-45deg) scale(0)',
				// 	'transition-timing-function': 'ease-out',
				// },
				span: {
					'text-transform': 'capitalize',
					'display': 'inline-block',
					'line-height': '20px',
					// 'width': 'calc(100% - 3em)',
					'margin-left': '.5em'
				}
			}
		},
		'.ui__btn_default': {
			'margin-bottom': '0',
			'margin': 'auto'
		},

		'.success-message': {
			height: '100vh',
			'padding-top': '20em'
		},

		'&.template-light': {
			color: COLOR.dark,
			'.success-message': {
				color: COLOR.dark
			},
			'.jetsm-form': {
				'padding-top': '280px'
			},
			'.form-group': {
				'marign-bottom': 0
			},
			'.form-group-item': {
				'&.field-input': {
					label: {
						color: COLOR.darkMedium
					},
					'input': {
						color: COLOR.dark,
						'-webkit-text-fill-color': 'inherit',
						'&::placeholder': {
							color: COLOR.darkMedium
						},
						'::-webkit-input-placeholder': {
							color: COLOR.darkMedium
						},
						'&:-moz-placeholder': {
							color: COLOR.darkMedium
						},
						'&:-ms-input-placeholder': {
							color: COLOR.darkMedium
						},
						'&:-webkit-autofill': {
							'-webkit-box-shadow': '0 0 0 30px #fff inset',
							'-webkit-text-fill-color': COLOR.dark
						}
					}
				},
				'&.field-textarea': {

					'textarea': {
						color: COLOR.dark,
						'-webkit-text-fill-color': 'inherit',
						'&::placeholder': {
							color: COLOR.darkMedium
						},
						'::-webkit-input-placeholder': {
							color: COLOR.darkMedium
						},
						'&:-moz-placeholder': {
							color: COLOR.darkMedium
						},
						'&:-ms-input-placeholder': {
							color: COLOR.darkMedium
						}

					}
				}
			}
		},
		'@media (max-width: 479px)': {
			'height': 'auto',
			'&.template-light': {
				'.jetsm-form': {
					'padding-top': '70px'
				}
			}
		}
	};

	var _extends$13 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	/**
	 * Sanitizer which filters a set of whitelisted tags, attributes and css.
	 *
	 */
	class Sanitize {

		static unconstrainted(x) {
			return x;
		}
		static get allowedAttributes() {
			return {
				'dir': this.unconstrainted,
				'lang': this.unconstrainted,
				'title': this.unconstrainted,
				'class': this.unconstrainted
			};
		}
		static get allowedInputAttributes() {
			return _extends$13({}, this.allowedAttributes, {
				'value': this.unconstrainted,
				'name': this.unconstrainted
			});
		}
		static get defaultTags() {
			return {
				'p': Sanitize.allowedAttributes,
				'br': Sanitize.allowedAttributes,
				'b': Sanitize.allowedAttributes,
				'i': Sanitize.allowedAttributes,
				'u': Sanitize.allowedAttributes,
				'ol': Sanitize.allowedAttributes,
				'ul': Sanitize.allowedAttributes,
				'li': Sanitize.allowedAttributes,
				'dd': Sanitize.allowedAttributes,
				'dl': Sanitize.allowedAttributes,
				'dt': Sanitize.allowedAttributes,
				'h1': Sanitize.allowedAttributes,
				'h2': Sanitize.allowedAttributes,
				'h3': Sanitize.allowedAttributes,
				'h4': Sanitize.allowedAttributes,
				'h5': Sanitize.allowedAttributes,
				'h6': Sanitize.allowedAttributes
			};
		}

		/**
		 * @constructor
		 * @param {Boolean} escape whether to escape or strip undesirable content.
		 * @param {Object} tags allowed tag-attribute-attribute-parsers.
		 * @param {Array} css allowed css elements.
		 * @param {Array} scheme allowed url scheme
		 */
		constructor(escape = true, tags = {}, css = null, urls = null) {
			this.escape = escape;
			// Configure small set of default tags
			this.allowedTags = tags || Sanitize.defaultTags;
			// disallow all css by default
			this.allowedCss = css || [];

			if (urls == null) {
				urls = ['http://', 'https://', 'mailto', 'tel'];
			}

			// const url_sanitizer = str => urls.find( url => str.startsWith(url) ) ? str : ''

			// Use the browser to parse the input but create a new HTMLDocument.
			this.doc = document.implementation.createHTMLDocument("");
		}

		stripTags(input) {
			let tmp = this.doc.createElement("DIV");
			tmp.innerHTML = input;
			let sanitized = this.sanitizeNode(tmp);
			return sanitized.textContent || sanitized.innerText || "";
		}

		sanitizeString(input) {
			let tmp = this.doc.createElement("DIV");
			tmp.innerHTML = input;

			return [...tmp.childNodes].map(node => this.sanitizeNode(node)).map(el => el.outerHTML || el.innerHTML || el.textContent || "").join('');
		}

		sanitizeNode(node) {

			// Note: <form> can have it's nodeName overriden by a child node. It's
			// not a big deal here, so we can punt on this.
			const node_name = node.nodeName.toLowerCase();

			// text nodes are always safe
			if (node.nodeType === Node.TEXT_NODE) return node;

			// always strip comments
			if (node_name == '#comment') return this.doc.createTextNode('');

			// this node isn't allowed
			if (!this.allowedTags.hasOwnProperty(node_name)) {
				return this.doc.createTextNode(this.sanitizeString(node.innerHTML));
			}

			// create node that will be returned as allowed
			const copy = this.doc.createElement(node_name);

			// copy the whitelist of attributes using the per-attribute sanitizer
			Object.keys(node.attributes).forEach(key => {
				const attr = node.attributes[key].name;
				if (this.allowedTags[node_name].hasOwnProperty(attr)) {
					// method that will be applyed to
					const sanitizer = this.allowedTags[node_name][attr];
					if (typeof sanitizer == 'function') copy.setAttribute(attr, sanitizer(node.getAttribute(attr)));
				}
			});

			// copy the whitelist of css properties
			this.allowedCss.forEach(css => copy.style[css] = node.style[css]);

			// recursively sanitize child nodes
			while (node.childNodes.length > 0) {
				const child = node.removeChild(node.childNodes[0]);
				copy.appendChild(this.sanitizeNode(child));
			}
			return copy;
		}
	}

	var _extends$14 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const api = new ResourceStorage();
	const errSanitizer = new Sanitize({
		tags: {} // disable all tags
	});
	const formSanitizer = new Sanitize(true, _extends$14({
		'div': Sanitize.allowedAttributes,
		'select': Sanitize.allowedInputAttributes,
		'option': Sanitize.allowedInputAttributes,
		'input': Sanitize.allowedInputAttributes,
		'bmp-anchor': Sanitize.allowedAttributes,
		'a': Sanitize.allowedAttributes
	}, Sanitize.defaultTags));

	let bmpCssComponent$30 = instance.define({ name: 'jetsm-form', cssjs: cssjs$23 });

	class JetsmForm extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$30.attachStyles(this);

			this.slug = this.getAttribute('data-slug');
			this.context = this.observe({
				formHTML: null,
				done: false,
				pending: false,
				errors: []
			});
		}

		disconnectedCallback() {
			if (this.phoneInput) ReactApp.disconnect(this.phoneInput);
		}

		async onAttached() {
			await this.loadForm();
		}

		async loadForm() {
			const { data } = await api.graphRequest(`form: Snippet(pathname: "${this.slug}", namespace: "form") { template }`);
			// this.context.formHTML = formSanitizer.sanitizeString(data.form.template)
			// TODO: sanitize form template
			this.context.formHTML = data.form.template;
			setTimeout(() => {
				this.phoneInput = this.querySelector('.phone-input');
				// console.log( 'render', phoneInput )
				if (this.phoneInput && !this.phoneInput.classList.contains('.integrated')) ReactApp.phoneInput(this.phoneInput, '', () => {});
			}, 200);
		}

		serialize(form) {

			// serialize form
			const data = {};
			for (var i = 0; i < form.elements.length; i++) {
				const el = form.elements[i];
				const err = el.closest('.form-group-item');
				if (err) err.classList.remove('error');
				if (!el.name) continue;
				const val = el.parentNode.classList.contains('phone-cc') ? el.value.replace(/[-_+\s]+/g, '') : el.value;
				const allInputs = document.querySelectorAll('[name="' + el.name + '"]');

				switch (el.type) {
					case "checkbox":
					case "radio":
						if (allInputs && allInputs.length > 1) {
							if (!data[el.name]) data[el.name] = [];
							if (el.checked) data[el.name].push(val); // checkbox multiple
						} else {
							if (el.checked) // checkbox is single => HARDCODE server waits array of single choise instead of string <=
								data[el.name] = el.checked ? [el.checked.toString()] : '';else delete data[el.name];
						}

						break;
					default:
						data[el.name] = val;
						break;
				}
			}
			return data;
		}

		successMessage() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'success-message text-center' },
				h1('font-weight:400;', 'THANK YOU!'),
				h5('margin-top: 30px;', 'A JetSmarter representative will be in touch soon.')
			);
		}

		async handleSubmit(ev) {

			ev.preventDefault();
			this.context.pending = true;
			try {
				const res = await api.postRequest(`api/v1/forms/${this.slug}/`, this.serialize(ev.target.closest('form')));
				const jsonResult = JSON.parse(res);
				if (jsonResult.status == 'error') {
					Object.keys(jsonResult.error).forEach(fieldname => {
						const field = this.querySelector(`[name="${fieldname}"]`).closest('.form-group-item');
						field.classList.add('error');
						field.querySelector('.error-message').innerHTML = `<p>${errSanitizer.stripTags(jsonResult.error[fieldname])}</p>`;
						smoothScroll({ element: '.jetsm-form .error', duration: 500, slack: 20 });
					});
				} else {
					this.context.done = true;
				}
			} catch (e) {
				throw new Error(e);
				// console.log( 'err', e )
			}
			this.context.pending = false;
		}

		getFormTemplate() {
			return ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, this.context.done ? this.successMessage() : BMPVD.createBMPVirtulaDOMElement('form', { 'class': `jetsm-form ${this.context.pending ? 'hidden' : ""}`,
					safeHTML: this.context.formHTML || svgIcon.preloader(),
					onsubmit: ev => this.handleSubmit(ev)
				}), BMPVD.createBMPVirtulaDOMElement('div', { 'class': `preloader ${this.context.pending ? '' : "hidden"}`, safeHTML: svgIcon.preloader({ inline: false }) }))]
			});
		}

		render() {
			return this.hasAttribute('with-scafold') ? ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { style: this.hasAttribute('bg-contain') ? '' : `background: url(${this.getAttribute('data-bg')}` }),
				contentBackground: this.hasAttribute('bg-contain') ? this.getAttribute('data-bg') : null,
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: this.getFormTemplate()
			}) : this.getFormTemplate();
		}

	}

	if (!customElements.get('jetsm-form')) customElements.define('jetsm-form', JetsmForm);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$31 = instance.define({
		name: 'jet-flights',
		cssjs: {
			'display': 'block',

			'flight-details__back-button': {
				'display': 'none'
			},
			'.flights_not_found': {
				'padding': '40px 0 20px',
				'min-height': '470px',
				height: 'calc(100vh - 500px)'
			},

			'.app.integrated-app': {
				'.breadcrumbs': {
					'display': 'none'
				},
				'.page': {
					// 'padding-top': '80px',
					'&.flights-list': {
						// 'padding-top': '0px',
					}
				}
			},

			'.jetsm-flights-page': {
				// 'padding-top': '80px',
				'.app.integrated-app': {
					'.back-button.flight-details__back-button': {
						'margin-top': '53px'
					}
				}
			},

			'.jet-flights-page': {
				'&.breadcrumbs-visible': {
					'.app.integrated-app': {
						'.breadcrumbs': {
							// 'display': 'flex',
							// 'padding-top': '80px',
						}
					}
				}
			},

			'.jet-flights-page-back': {
				'margin-top': '63px',
				'padding': '0 40px 0 16px',
				'width': '129px',
				'.back-btn-arrow-icon': {
					'left': '15px'
				}
			},

			'@media (max-width: 1220px)': {
				'.jet-flights-page-back': {
					'margin-left': '10px'
				}
			},

			'@media (max-width: 480px)': {
				'.jet-flights-page': {
					'padding-top': '80px'
				},
				'.jet-flights-page-back': {
					'margin-top': '0px',
					'margin-left': '0px'
				},
				'jetsm-heading': {
					display: 'none'
				}
			}
		}
	});

	class JetFlights extends BMPVDWebComponent {
		constructor() {
			super();
		}

		static getUrlConf() {
			// TODO: Implement url conf of all flights (for sitemap)
			return [];
		}

		onAttached() {}

		async ready() {
			let viewParams = JSON.parse(this.getAttribute('view-params'));
			bmpCssComponent$31.attachStyles(this);

			this.ctx = this.observe({
				page: '',
				showSearch: viewParams.shuttleId ? false : true,
				routePath: viewParams.route ? viewParams.route : null
			});

			this.areas = (await formatAreas()).filter(area => !!area.reference);
		}

		findMaAndIcao(origin, destination) {
			const originArea = findArea(origin, this.areas, true);
			const destinationArea = findArea(destination, this.areas, true);

			// if area not found, probably it is icao
			const originIcao = !findArea(origin, this.areas) ? origin : null;
			const destinationIcao = !findArea(destination, this.areas) ? destination : null;

			if (originArea && destinationArea) {
				const route = findValidRoute(originArea.reference, destinationArea.reference);
				if (route) {
					const [routeOrigin, routeDestination] = route;
					return {
						origin: {
							ma: routeOrigin.city,
							icao: originIcao || routeOrigin.icao
						},
						destination: {
							ma: routeDestination.city,
							icao: destinationIcao || routeDestination.icao
						}
					};
				}
			}

			return {
				origin: { icao: originArea ? originArea.icao[0] : origin },
				destination: { icao: destinationArea ? destinationArea.icao[0] : destination }
			};
		}

		async attachReact(element) {
			this.reactEl = element;
			const router = document.querySelector('bmp-router');
			const goTo = router.go.bind(router);
			let route;
			let shuttleId;
			// TODO: just for tesing, pass real data from store
			let searchParams = await JetsmSearch.storage().getRoutes();
			try {
				let viewParams = JSON.parse(this.getAttribute('view-params'));
				route = viewParams.route.replace('nyc-', 'kteb-');
				shuttleId = viewParams.shuttleId;
			} catch (e) {}
			// TODO: validate route and shuttleId
			const refFindAreaAndIcao = this.findMaAndIcao.bind(this);
			if (route && shuttleId) {
				this.ctx.page = 'flightDetails';
				ReactCaller$1.run(this.ctx.page, element, goTo, instance$1, refFindAreaAndIcao, route, shuttleId);
			} else if (route) {
				this.ctx.page = 'flightsList';
				ReactCaller$1.run(this.ctx.page, element, goTo, instance$1, refFindAreaAndIcao, route, searchParams);
			} else {
				this.ctx.page = 'checkOut';
				ReactCaller$1.run(this.ctx.page, element, goTo);
			}
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.reactEl);
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: `jet-flights-page ${!this.ctx.showSearch ? 'breadcrumbs-visible' : ''}` },
						BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url("https://jetsmarter.com/data/site-v5/assets/root_slider/3.jpg") no-repeat 50% 50% / cover;' }),
						ME.layout.grid({
							children: this.ctx.page == 'flightDetails' ? [ME.layout.cell({ desktop: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ href: !this.ctx.showSearch ? `/flights/${this.ctx.routePath}` : '/', className: 'back-btn jet-flights-page-back', style: `color: ${COLOR.dark}` },
									BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
									'Back'
								)
							))] : []
						}),
						this.ctx.showSearch && this.ctx.page !== 'checkOut' ? BMPVD.createBMPVirtulaDOMElement('jetsm-search', { theme: 'flight-list', 'route-path': this.ctx.routePath }) : null,
						BMPVD.createBMPVirtulaDOMElement('div', { className: 'jetsm-flights-page', ref: el => !window.IS_SSR && this.attachReact(el) })
					)]
				})
			});
		}

	}

	if (!customElements.get('jet-flights')) customElements.define('jet-flights', JetFlights);

	class JetsmNoFlights extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			this.context = this.observe({
				origin: this.props.origin,
				destination: this.props.destination,
				date: this.props.date
			});

			const container = this.closest('.jet-flights-page');
			container.querySelector('jetsm-search').style.display = 'none';
			container.style.backgroundColor = COLOR.darkMedium;
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'flights_not_found' },
				ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, h3('color: #fff; margin: 0;', BMPVD.createBMPVirtulaDOMElement(
						'span',
						null,
						'Sorry, no flights\xA0on ',
						BMPVD.createBMPVirtulaDOMElement(
							'span',
							{ style: 'white-space: nowrap;' },
							this.context.date
						),
						'.',
						BMPVD.createBMPVirtulaDOMElement('br', null),
						' See\xA0other dates:'
					)))]
				}),
				BMPVD.createBMPVirtulaDOMElement('jetsm-search', {
					style: `position: relative; transform: translate3d(0,0,0); left: 0; top: 0;`,
					origin: this.context.origin,
					destination: this.context.destination,
					date: null
				})
			);
		}
	}

	if (!customElements.get('jetsm-no-flights')) customElements.define('jetsm-no-flights', JetsmNoFlights);

	const typographyLegalDetail = {

		'.legal-detail-page': {
			'a': {
				'transition-duration': '0.25s',
				'text-decoration': 'none',
				'color': `${COLOR.primary}`,
				'border-bottom': '1px solid transparent',
				'&:hover': {
					'border-bottom': `1px solid ${COLOR.primary}`
				}
			}
		},

		'dl': {
			'dt': {
				'font-family': 'Roboto, sans-serif',
				'font-size': '20px',
				'line-height': '30px',
				'padding-bottom': '20px',
				'font-weight': '300'
			},
			'dd': {
				'font-family': 'Roboto, sans-serif',
				'font-size': '20px',
				'line-height': '30px',
				'padding-left': '20px',
				'padding-bottom': '20px',
				'font-weight': '300'
			}
		},

		'.news-detail-page': {
			'a': {
				'transition-duration': '0.25s',
				'text-decoration': 'none',
				'color': `${COLOR.primary}`,
				'border-bottom': '1px solid transparent',
				'&:hover': {
					'border-bottom': `1px solid ${COLOR.primary}`
				}
			}
		},

		'table': {
			'th': {
				'text-align': 'left'
			},
			'td': {
				'padding': '20px',
				'text-align': 'left'
			},
			'tr': {
				'&:nth-child(2n-1)': {
					'td': {
						'background-color': `${COLOR.light}`
					}
				}
			},
			'p': {
				'padding-bottom': '0'
			}
		},

		'h1': {
			'font-family': 'Gotham, sans-serif',
			'font-size': '48px',
			'line-height': '40px',
			'letter-spacing': '-2px',
			'font-weight': '400',
			'margin': '0 0 50px',
			'strong': {
				'font-weight': '400'
			}
		},

		'h2': {
			'font-family': 'Gotham, sans-serif',
			'font-size': '36px',
			'line-height': '40px',
			'letter-spacing': '-2px',
			'font-weight': '400',
			'margin': '0 0 50px',
			'strong': {
				'font-weight': '400'
			}
		},

		'ol': {
			'margin-left': '30px',
			'li': {
				'list-style-type': 'decimal',
				'font-family': 'Roboto, sans-serif',
				'font-size': '20px',
				'line-height': '30px',
				'padding-bottom': '20px',
				'font-weight': '300'
			}
		},

		'ul': {
			'margin-left': '20px',
			'li': {
				'list-style-type': 'disc',
				'font-family': 'Roboto, sans-serif',
				'font-size': '20px',
				'line-height': '30px',
				'padding-bottom': '20px',
				'font-weight': '300'
			}
		},

		'h3': {
			'font-family': 'Roboto, sans-serif',
			'font-weight': 'bold',
			'font-size': '20px',
			'line-height': '30px',
			'padding-bottom': '20px'
		},

		'p': {
			'font-family': 'Roboto, sans-serif',
			'font-size': '20px',
			'line-height': '30px',
			'padding-bottom': '20px',
			'font-weight': '300'
		},

		'strong': {
			'font-weight': '500'
		}

	};

	const typographyLegalList = {

		'.pca-list': {
			'bmp-anchor': {
				'a': {
					'transition-duration': '0.25s',
					'text-decoration': 'none',
					'color': `${COLOR.dark}`
				},
				'&:hover': {
					'a': {
						'transition-duration': '0.25s',
						'color': `${COLOR.primary}`
					}
				}
			}
		},

		'.legal-list-page': {
			'bmp-anchor': {
				'a': {
					'transition-duration': '0.25s',
					'text-decoration': 'none',
					'color': `${COLOR.dark}`
				},
				'&:hover': {
					'a': {
						'transition-duration': '0.25s',
						'color': `${COLOR.primary}`
					}
				}
			}
		},

		'.pca-items': {
			'bmp-anchor': {

				'a': {
					'transition-duration': '0.25s',
					'text-decoration': 'none',
					'color': `${COLOR.dark}`
				},

				'&:hover': {
					'a': {
						'transition-duration': '0.25s',
						'color': `${COLOR.primary}`
					}
				}
			}
		},

		'.elements-bordered': {
			'padding': '0px 0 60px'
		}
	};

	const typographyFaq = {
		'color': `${COLOR.dark}`,

		'h3': {
			'font-size': '36px',
			'line-height': '40px',
			'margin': '0 0 30px',
			'letter-spacing': '-1.5px'
		},

		'.faq-item': {
			// 'margin': '0 0 20px',
			'&.visible': {
				'.answer': {
					'max-height': '1000px',
					'overflow': 'hidden',
					'transition-duration': '0.7s'
				},
				'.question': {
					'p': {
						'font-weight': '600'
					}
				}
			}
		},

		'.faq-list-page': {
			'.element': {
				'margin': '0 0 50px'
			}
		},

		'.question': {
			'&:hover': {
				'p': {
					'color': `${COLOR.primary}`,
					'border-bottom': `1px solid ${COLOR.primary}`
				}
			},
			'p': {
				'display': 'inline-block',
				'border-bottom': '1px solid transparent',
				'cursor': 'pointer',
				'font-weight': '400',
				'margin': '0'
			}
		},

		'.answer': {
			'padding': '10px 0 0',
			'overflow': 'hidden',
			'transition-duration': '0.3s'
		},

		'p': {
			'font-family': 'Roboto',
			'font-size': '20px',
			'line-height': '30px',
			'margin': '0 0 20px',
			'font-weight': '300'
		},

		'ol': {
			'font-family': 'Roboto',
			'font-size': '20px',
			'line-height': '30px',
			'padding': '0 0 20px',
			'font-weight': '300',
			'li': {
				'padding': '0 0 20px'
			}
		},

		'a': {
			'text-decoration': 'none',
			'color': `${COLOR.primary}`,
			'white-space': 'nowrap'
		},

		'b': {
			'font-weight': '400'
		}
	};

	var _extends$15 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$24 = _extends$15({
		'display': 'block',
		'color': `${COLOR.dark}`
	}, typographyLegalDetail);

	var _extends$16 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const sanitizer = new Sanitize(true, _extends$16({
		'div': Sanitize.allowedAttributes,
		'bmp-anchor': Sanitize.allowedAttributes,
		'a': Sanitize.allowedAttributes
	}, Sanitize.defaultTags));

	const view = {

		pcaList({ list, pending }) {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'pca-list' },
				ME.container({
					mod: { className: 'page-content' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/legal/', className: 'back-btn', style: `margin-bottom: 53px; color: ${COLOR.dark}` },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						), h2(`color: ${COLOR.dark}`, 'Public charter agreements'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'pca-items' },
							list.map(el => h5(`color: ${COLOR.dark};margin: 20px 0 0;`, BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								h5(`color: ${COLOR.dark}`, BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ className: 'default-link', style: `font-weight: 500`, href: `/legal/public-charter-agreements/${el.document_number}/` },
									el.operator_name,
									' (',
									el.document_number,
									')'
								))
							)))
						))]
					})]
				}),
				pending ? BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'preloader inline', safeHTML: svgIcon.preloader() }) : ''
			);
		},

		pcaDetail({ element, pending }) {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'legal-detail-page' },
				ME.container({
					mod: { className: 'page-content' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/legal/public-charter-agreements/', className: 'back-btn', style: `margin-bottom: 53px; color: ${COLOR.dark}` },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						), h2('font-weight: 400;', element ? element.documentNumber : ''))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'element-detail', safeHTML: pending ? '' : element ? sanitizer.sanitizeString(element.renderedContent) : `<h4 class="h4-style" style="color: ${COLOR.dark}">Document not found</h4>` }))]
					})]
				}),
				pending ? BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'preloader inline', safeHTML: svgIcon.preloader() }) : ''
			);
		},

		detail({ element, pending }) {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'legal-detail-page' },
				ME.container({
					mod: { className: 'page-content' },
					children: [// `<h4 class="h4-style" style="color: ${COLOR.dark}">Document not found</h3>`
					pending ? '' : ME.layout.grid({
						children: [
						//ME.layout.cell({ common: 12 },
						//	h5(`margin: 0 0 20px; font-weight: 300;`, <bmp-anchor><a href="/legal/" className="default-link" style={`color: ${COLOR.primary};`}>Back to Legal</a></bmp-anchor>)
						//),
						ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/legal/', className: 'back-btn', style: `margin-bottom: 53px; color: ${COLOR.dark}` },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						), BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'element-detail', safeHTML: element ? element.content : `<h4 class="h4-style" style="color: ${COLOR.dark}">Document not found</h4>` }))]
					})]
				}),
				pending ? BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'preloader inline', safeHTML: svgIcon.preloader() }) : ''
			);
		},

		list(context) {
			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 10 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'legal-list-page' },
						h2(`color: ${COLOR.dark}; padding: 0 0 64px;`, 'Legal'),
						text(`color: ${COLOR.dark}; margin-bottom: 20px`, 'Please read the following terms and conditions carefully before accessing or using JetSmarter products, services, application, and website.'),
						text(`color: ${COLOR.dark}; margin-bottom: 50px`, 'Your access and use of JetSmarter products, services, application, or website constitutes your agreement to be bound by these terms and establishes a contractual relationship between you and JetSmarter.')
					)), ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'legal-list-page' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							context.list.map(({ slug, title }) => BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ 'class': 'elements-bordered' },
								h3('', BMPVD.createBMPVirtulaDOMElement(
									'bmp-anchor',
									null,
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: `/legal/${slug}/`, 'class': 'element bordered-line' },
										title
									)
								))
							))
						),
						context.pending ? BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'preloader inline', safeHTML: svgIcon.preloader() }) : ''
					))]
				})]
			});
		}

	};

	const fetchLegals = async () => {
		const query = `RN(name='dynaMo', instance_name='legal').f(published=True, show_in_menu=True)`;
		const { data } = await resourceStorageInstance.getRN(query);

		// check all legals for docs length > 0
		const RNs = data.map(legal => `RN(name='dynaMo', instance_name='doc_type').f(slug='${legal.slug}', published=True)`);
		const documents = await resourceStorageInstance.getRN(RNs);

		const legalList = data.filter((el, i) => documents[i].data.length > 0);
		legalList.push({
			slug: 'public-charter-agreements',
			title: 'Public Charter Agreements'
		});
		return legalList;
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$32 = instance.define({
		name: 'jet-legal-detail', cssjs: cssjs$24
	});
	let lastElement;

	class JetsmLegalDetail extends BMPVDWebComponent {
		constructor() {
			super();
		}

		/** Sitemap integration */
		static async getUrlConf(parentPattern, replacer) {
			const legalList = await fetchLegals();
			return legalList.map(legal => {
				return replacer(parentPattern, { legal_slug: legal.slug });
			});
		}

		static async getLastElement() {
			await this.fetchPromise;
			return this.lastElement;
		}

		static get lastElement() {
			return lastElement;
		}

		ready() {
			bmpCssComponent$32.attachStyles(this);
			this.context = this.observe({
				element: {},
				pending: true
			});
		}

		async onAttached() {
			this.context.pending = true;
			try {
				const { legal_slug } = JSON.parse(this.getAttribute('view-params'));
				const rn = `RN(name='dynaMo', instance_name='doc_type', type='detail').f(slug='${legal_slug}', published=True)`;
				this.fetchPromise = resourceStorageInstance.getRN(rn);
				const { data } = await this.fetchPromise;
				this.context.element = lastElement = data;
				this.context.pending = false;
			} catch (e) {
				this.context.pending = false;
			}
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view.detail(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-legal-detail')) customElements.define('jetsm-legal-detail', JetsmLegalDetail);

	var _extends$17 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$25 = _extends$17({
		display: 'block'
	}, typographyLegalList);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$33 = instance.define({
		name: 'jet-legal-list', cssjs: cssjs$25
	});

	class JetsmLegalList extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {

			bmpCssComponent$33.attachStyles(this);

			this.context = this.observe({
				pending: true,
				list: []
			});
		}

		async onAttached() {
			this.context.list = await fetchLegals();
			this.context.pending = false;
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view.list(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-legal-list')) customElements.define('jetsm-legal-list', JetsmLegalList);

	var _extends$18 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$26 = _extends$18({
		display: 'block',
		color: COLOR.dark
	}, typographyLegalList);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$34 = instance.define({
		name: 'jet-pca', cssjs: cssjs$26
	});

	class JetsmPCA extends BMPVDWebComponent {
		constructor() {
			super();
		}
		ready() {

			bmpCssComponent$34.attachStyles(this);

			this.context = this.observe({
				pending: true,
				list: []
			});
		}

		async onAttached() {

			const { data } = await resourceStorageInstance.getRN(`RN(name='pca')`);
			this.context.list = data;
			this.context.pending = false;
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view.pcaList(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-pca')) customElements.define('jetsm-pca', JetsmPCA);

	var _extends$19 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$27 = _extends$19({
		display: 'block',
		color: COLOR.dark
	}, typographyLegalDetail);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$35 = instance.define({
		name: 'jet-pca-detail', cssjs: cssjs$27
	});
	let lastElement$1, lastPromise;

	class JetsmPCADetail extends BMPVDWebComponent {
		constructor() {
			super();
		}

		static async getUrlConf(pattern, replacer) {
			const { data } = await resourceStorageInstance.getRN(`RN(name='pca')`);
			return data.map(legal => replacer(pattern, {
				document_number: legal.document_number
			}));
		}

		static async getLastElement() {
			await lastPromise;
			return this.lastElement;
		}

		static get lastElement() {
			return lastElement$1;
		}

		ready() {

			bmpCssComponent$35.attachStyles(this);

			this.context = this.observe({
				pending: true,
				element: {}
			});
		}

		async onAttached() {

			const { document_number } = JSON.parse(this.getAttribute('view-params'));

			let query;
			let lastChar = document_number.slice(document_number.length - 1, document_number.length);
			// HARDCODE --> is non-member document query - slice "n" from end of number
			if (lastChar === 'n') {
				query = `
					document: PublicCharterAgreement(documentNumber: "${document_number.slice(0, -1)}") {
						documentNumber, nonMemberRenderedContent
				}`;
			} else {
				query = `
					document: PublicCharterAgreement(documentNumber: "${document_number}") {
						documentNumber, renderedContent
				}`;
			}
			lastPromise = resourceStorageInstance.graphRequest(query);
			const { data } = await lastPromise;
			if (data.document && data.document.nonMemberRenderedContent !== undefined) data.document.renderedContent = data.document.nonMemberRenderedContent;
			// <-- HARDCODE to unify rendered content in view

			this.context.element = lastElement$1 = data.document;
			this.context.pending = false;
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view.pcaDetail(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-pca-detail')) customElements.define('jetsm-pca-detail', JetsmPCADetail);

	var _extends$20 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$28 = _extends$20({
		display: 'block'
	}, typographyFaq);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$36 = instance.define({
		name: 'hide-large-area',
		cssjs: {
			'display': 'block',
			'overflow': 'hidden',
			'transition-duration': '0.3s',

			'.faq-btn': {
				'width': '136px',
				'height': '30px',
				'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/pages/faq/icon-plus.svg")',
				'text-align': 'right',
				'background-repeat': 'no-repeat',
				'background-size': '26px',
				'background-position': '0% 50%',
				'border': 'none',
				'font-size': '20px',
				'color': `${COLOR.primary}`,
				'font-family': 'Roboto',
				'font-weight': '200',
				'padding': '0',
				'cursor': 'pointer',
				'background-color': 'transparent',

				'&.open': {
					'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/pages/faq/icon-minus.svg")'
				}
			}
		}
	});

	class HideLargeArea extends HTMLElement {
		constructor() {
			super();
		}

		showContent(trigger) {
			let hiddenParent = trigger.parentElement;
			let hiddenContent = hiddenParent.querySelector('[hidden-item]');
			let area = trigger.closest('hide-large-area');
			let getRealItemHeight = parseInt(hiddenContent.getAttribute('real-height'));
			let areaCurentHeight = parseInt(window.getComputedStyle(area).height);

			!hiddenParent.hasAttribute('show-content') ? hiddenParent.setAttribute('show-content', 'true') : hiddenParent.removeAttribute('show-content');

			if (hiddenContent.getAttribute('hidden-item') == "hidden") {
				hiddenContent.setAttribute('hidden-item', "visible");
				hiddenContent.style.maxHeight = `${getRealItemHeight}px`;
				area.style.height = `${areaCurentHeight + getRealItemHeight}px`;
			} else if (hiddenContent.getAttribute('hidden-item') == "visible") {
				hiddenContent.setAttribute('hidden-item', "hidden");
				hiddenContent.style.maxHeight = '0px';
				area.style.height = `${areaCurentHeight - getRealItemHeight}px`;
			}
		}

		showMore() {
			let areaRealHeight = parseInt(this.getAttribute('area-real-height'));
			let areaInitHeight = parseInt(this.getAttribute('area-init-height'));

			let openItems = this.querySelectorAll('[hidden-item="visible"]');

			let openItemsVisibles = this.querySelectorAll('[animate-item="visible"][show-content="true"]');
			// console.log(openItemsVisibles);

			let openItemsheight = 0;[...openItems].forEach(openItem => {
				openItemsheight += openItem.offsetHeight;
			});

			let openItemsheightVisibles = 0;[...openItemsVisibles].forEach(openItem => {
				openItemsheightVisibles += openItem.offsetHeight;
			});

			if (!this.hasAttribute('collapse')) {
				this.setAttribute('collapse', 'true');
				this.style.height = `${areaRealHeight + openItemsheight}px`;
				this.querySelectorAll('[animate-item="hidden"]').forEach(itm => {
					itm.style.display = 'block';
				});
			} else if (this.hasAttribute('collapse')) {

				this.removeAttribute('collapse');
				this.style.height = `${areaInitHeight + openItemsheightVisibles}px`;
				this.querySelectorAll('[animate-item="hidden"]').forEach(itm => {
					itm.style.display = 'none';
				});
			}
		}

		connectedCallback() {
			bmpCssComponent$36.attachStyles(this);
			const visibleItems = parseInt(this.getAttribute('visible-items'));
			const showMoreButton = this.querySelector('[show-more]');
			let items = this.querySelectorAll('[animate-item]');

			let areaHeight = 0;
			let areaRealHeight = 0;[...items].forEach((item, idx) => {
				let trigger = item.querySelector('[trigger-item]');
				let hiddenContent = item.querySelector('[hidden-item]');
				trigger.addEventListener('click', e => this.showContent(trigger), false);
				hiddenContent.setAttribute('real-height', hiddenContent.offsetHeight);
				hiddenContent.style.maxHeight = 0;
				areaRealHeight += item.offsetHeight;

				if (idx >= visibleItems) {
					item.style.display = 'none';
					item.setAttribute('animate-item', 'hidden');
				}
			});[...items].splice(0, visibleItems).forEach(item => {
				areaHeight += item.offsetHeight;
			});

			this.setAttribute('area-init-height', areaHeight + showMoreButton.offsetHeight);
			this.setAttribute('area-real-height', areaRealHeight + showMoreButton.offsetHeight);
			this.style.height = `${areaHeight + showMoreButton.offsetHeight}px`;

			showMoreButton.addEventListener('click', e => this.showMore(), false);
		}
	}

	if (!customElements.get('hide-large-area')) customElements.define('hide-large-area', HideLargeArea);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$37 = instance.define({
		name: 'accordion-section',
		cssjs: {
			'display': 'block',
			'transition-duration': '0.3s',
			'padding': '0 0 64px',
			'overflow': 'hidden',

			'accordion-item': {
				'display': 'block',
				'transition-duration': '0.3s',
				'overflow': 'hidden',
				'margin': '0 0 10px'
			},

			'.hidden-wrapper': {
				'transition-duration': '0.7s',
				'overflow': 'hidden'
			},

			'.faq-btn': {
				'width': '136px',
				'height': '30px',
				'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/pages/faq/icon-plus.svg")',
				'text-align': 'right',
				'background-repeat': 'no-repeat',
				'background-size': '26px',
				'background-position': '0% 50%',
				'border': 'none',
				'font-size': '20px',
				'color': COLOR.primary,
				'font-family': 'Roboto',
				'font-weight': '200',
				'padding': '0',
				'cursor': 'pointer',
				'background-color': 'transparent',

				'&.open': {
					'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/pages/faq/icon-minus.svg")'
				}
			}
		}
	});

	class AccordionItem extends BMPVDWebComponent {
		constructor() {
			super();
		}

		onAttached() {}

		ready() {
			let data = JSON.parse(this.getAttribute('item-data'));
			this.context = this.observe({
				title: data.question,
				content: data.answer,
				expanded: false,
				realHeight: 0
			});
			return Promise.resolve();
		}

		expandedItem(e) {
			this.context.expanded = !this.context.expanded;
		}

		render() {

			return BMPVD.createBMPVirtulaDOMElement(
				'dl',
				{ className: `faq-item ${this.context.expanded ? 'visible' : ''}` },
				BMPVD.createBMPVirtulaDOMElement('dt', { className: 'question',
					onClick: e => this.expandedItem(e),
					safeHTML: this.context.title
				}),
				BMPVD.createBMPVirtulaDOMElement('dd', { className: 'answer', style: `max-height: ${this.context.expanded ? '800px' : '0px'}`, safeHTML: this.context.content })
			);
		}
	}

	if (!customElements.get('accordion-item')) customElements.define('accordion-item', AccordionItem);

	class AccordionSection extends BMPVDWebComponent {
		constructor() {
			super();
			/**
		 * calculate height {foldedHeight} of the first four accordion-item elements
		 * foldedHeight = first 4 height
		 * add resize listener and recalculate {foldedHeight}
		 */
		}

		// disconectedCallback () { remove resize listener }

		ready() {
			bmpCssComponent$37.attachStyles(this);
			this.context = this.observe({
				foldedHeight: 'auto',
				maxH: 0,
				expanded: false,
				node: faqs[this.getAttribute('section-index')].node.elements.edges
			});

			return Promise.resolve();
		}

		onAttached() {}

		expanding() {}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'section',
				{ style: `max-height: ${this.context.foldedHeight}` },
				this.context.node.slice(0, 4).map(({ node }) => BMPVD.createBMPVirtulaDOMElement('accordion-item', { 'item-data': JSON.stringify(node) })),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'hidden-wrapper', style: this.context.expanded ? 'max-height: 3500px' : 'max-height: 0' },
					this.context.node.slice(4, this.context.node.length).map(({ node }) => BMPVD.createBMPVirtulaDOMElement('accordion-item', { 'item-data': JSON.stringify(node) }))
				),
				this.context.node.length <= 4 ? null : BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'show-more-button-wrapper' },
					BMPVD.createBMPVirtulaDOMElement(
						'button',
						{
							className: `faq-btn ${this.context.expanded ? 'open' : ''}`,
							onClick: () => this.context.expanded = !this.context.expanded,
							'show-more-button': '' },
						this.context.expanded ? 'Show Less' : 'Show More'
					)
				)
			);
		}
	}

	if (!customElements.get('accordion-section')) customElements.define('accordion-section', AccordionSection);

	let faqs = [];

	const view$1 = {
		list(context) {
			faqs = context.elements;

			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 60px; `, 'FAQs'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ...context.elements.map((node, index) => BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							h3('', node.node.name),
							BMPVD.createBMPVirtulaDOMElement('accordion-section', { 'section-index': index })
						)))]
					}))]
				})]
			});
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$38 = instance.define({
		name: 'jet-faq', cssjs: cssjs$28
	});

	class JetsmFaqList extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {

			bmpCssComponent$38.attachStyles(this);

			this.context = this.observe({
				elements: [],
				pending: true
			});

			return Promise.resolve();
		}

		async onAttached() {
			this.context.pending = true;
			this.context.elements = await this.loadData();
			this.context.pending = false;
		}

		async loadData() {

			const { data } = await resourceStorageInstance.graphRequest(`
				categories: FAQCategories {
					edges { node {
							name slug
							elements: faq {
								edges { node { answer question } }
							}
					} }
				}
				`);
			return data.categories.edges;
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/faq/faq-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view$1.list(this.context)
			});
		}
	}

	if (!customElements.get('jetsm-faq-list')) customElements.define('jetsm-faq-list', JetsmFaqList);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */
	// import { menusList } from '../../../models/menu.js'

	let bmpCssComponent$39 = instance.define({
		name: 'page-404',
		cssjs: {
			'display': 'block',
			'min-height': '100vh',
			'background': 'url("https://jetsmarter.com/data/site-v5/assets/404.jpg") no-repeat 50% 50% / cover',
			'display': 'flex',
			'align-items': 'center',
			'align-content': 'center',

			'.inner-404': {
				'width': '100%'
			},

			'.page-link': {
				'font-family': 'Roboto',
				'font-size': '13px',
				'color': COLOR.light,
				'line-height': '30px',
				'text-decoration': 'none'
			},
			'.btn-red': {
				'display': 'block',
				'background-color': COLOR.primary,
				'border': 'none',
				'width': '100%',
				'max-width': '390px',
				'height': '50px',
				'border-radius': '6px',
				'cursor': 'pointer',
				'outline': 'none',
				'text-align': 'center',
				'& > *': {
					'font-family': 'Roboto',
					'font-size': '24px',
					'line-height': '50px',
					'color': COLOR.white,
					'font-weight': '200',
					'text-decoration': 'none',
					'display': 'inline-block'
				}
			}
		}
	});

	class Page404 extends BMPVDWebComponent {

		constructor() {
			super();
		}

		disconnectedCallback() {
			clearTimeout(this.redirectDelay);
		}

		onAttached() {
			// this.redirectDelay = setTimeout(() => location.replace(location.origin), 3000);
		}

		ready() {
			return new Promise(resolve => {
				bmpCssComponent$39.attachStyles(this);
				resolve();
			});
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { 'hide-logo': true }),
				body: ME.container({
					mod: { className: 'inner-404' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 10 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							h2('color:#fff;margin-bottom: 38px;font-weight: 500', BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'404'
							)),
							h4('color:#fff;margin-bottom: 20px', BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'The requested page was not found.'
							)),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ style: 'padding-top: 0px' },
								BMPVD.createBMPVirtulaDOMElement(
									'bmp-anchor',
									{ 'class': 'btn-red' },
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: '/' },
										'Go back'
									)
								)
							)
						))]
					})]
				})
			});
		}
	}

	if (!customElements.get('page-404')) customElements.define('page-404', Page404);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$40 = instance.define({
		name: 'profile-sidebar',
		cssjs: {
			'display': 'block',
			'min-height': '100vh',
			'z-index': '1',
			'position': 'relative',

			'@media (max-width: 839px)': {
				'min-height': 'auto'
			},

			'.full-width': {
				'max-width': '100%'
			},

			'bmp-anchor': {
				'a': {
					'color': '#fff',
					'text-decoration': 'none',
					'&.active': {
						'color': `${COLOR.primary}`
					}
				}
			},

			'.prifile-user-photo': {
				'margin': '50px 0 30px',
				'width': '140px',
				'height': '140px',
				'overflow': 'hidden',
				'border-radius': '12px',
				'background-color': '#fff',
				'display': 'flex',
				'align-items': 'center',
				'justify-content': 'center',

				'&.default': {
					'img': {
						'max-width': '60px'
					}
				},

				'img': {
					'width': '100%',
					'height': 'auto'
				}
			},

			'.side-bar-links': {
				'.side-bar-link': {
					'display': 'block',
					'margin': '0 0 32px',

					'&:last-child': {
						'margin-bottom': '0'
					}
				}
			}
		}
	});

	const profileSideBar = [
	// {
	// 	text: 'Verify your ID',
	// 	url: '/profile/verify/',
	// 	isActive: 'verify'
	// },
	{
		text: 'Payment methods',
		url: '/profile/payment-methods/',
		isActive: 'payment'
	}, {
		text: 'Edit profile',
		url: '/profile/',
		isActive: 'edit'
	},
	// {
	// 	text: 'Promo Code',
	// 	url: '/profile/promo/',
	// 	isActive: 'promo'
	// },
	{
		text: 'Log out',
		url: '/logout/'
	}];

	class ProfileSidebar extends BMPVDWebComponent {

		constructor() {
			super();
		}

		disconnectedCallback() {
			instance$1.unsubscribe('user', this.updateUser);
		}

		onAttached() {
			this.context.user = instance$1.getFromStorage('user');
			this.updateUser = user => {
				this.context.user = user;
			};
			instance$1.subscribe('user', this.updateUser);
		}

		ready() {
			this.currentPage = this.getAttribute('current-page');
			bmpCssComponent$40.attachStyles(this);
			this.context = this.observe({ user: {} });

			return Promise.resolve();
		}

		sideBarLink() {
			return profileSideBar.map(({ text: text$$1, url, isActive }) => BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'side-bar-link' },
				h4('color:#fff; font-family: "Gotham"; font-weight: 500;', BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: url, className: this.currentPage == isActive ? 'active' : '' },
						text$$1
					)
				))
			));
		}

		render() {
			const { user } = this.context;
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'profile-sidebar' },
				ME.container({
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.inner(ME.layout.cell({ common: 2 }), ME.layout.cell({ common: 9 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { className: 'prifile-user-photo default', style: `background: url(${user && user.avatar_url ? user.avatar_url : 'https://jetsmarter.com/data/site-v5/assets/ui-icon/avatar.gif'}) center center/cover no-repeat` }))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								h4('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									user ? user.name : ''
								))
							))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'Membership:'
								))
							)), ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									user && user.membershipTierPrice ? user.membershipTierPrice[0].programName : ''
								))
							))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'Member since:'
								))
							)), ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									user ? new Date(user.client_create_time).toDateString() : ''
								))
							))]
						}),

						// ME.layout.grid({
						// 	children: [
						// 		ME.layout.cell({ common: 6 },
						// 			<div>
						// 				{text('color:#fff;', <span>Renew date:</span>)}
						// 			</div>
						// 		),
						// 		ME.layout.cell({ common: 6 },
						// 			<div>{text('color:#fff;', <span>may 2022</span>)}</div>
						// 		)
						// 	]
						// }),

						ME.layout.grid({
							children: [ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'Flight credit:'
								))
							)), ME.layout.cell({ common: 6 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								text('color:#fff;', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'$',
									user ? user.flight_credits || '0' : ''
								))
							))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'side-bar-links' },
								this.sideBarLink()
							))]
						}))))]
					})]
				})
			);
		}

	}

	if (!customElements.get('profile-sidebar')) customElements.define('profile-sidebar', ProfileSidebar);

	const cssjs$29 = {
		'display': 'block',
		'min-height': '100vh'
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$41 = instance.define({
		name: 'profile-edit',
		cssjs: cssjs$29
	});

	class ProfileEdit extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$41.attachStyles(this);
			this.subID = instance$1.subscribe('user', user => {
				this.context.user = user;
			});

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				pending: false
			});
		}

		onAttached() {
			const el = this.querySelector('#reactprofile');
			ReactCaller$1.run('editProfile', el, instance$1);
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.querySelector('#reactprofile'));
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					mod: { className: 'visual-bg', style: 'background: url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover; height: 210px;' },
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', { 'class': 'relative' })]
				}),
				body: ME.container({
					mod: { className: 'page-content' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'Edit profile'))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactprofile', style: `display: ${this.context.user && this.context.user.isAuthorized ? 'block' : 'none'}` }), !this.context.user || !this.context.user.isAuthorized ? h5(`color: ${COLOR.dark}`, 'Please log in or create an account.') : null)]
						}))]
					})]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	if (!customElements.get('profile-edit')) customElements.define('profile-edit', ProfileEdit);

	const cssjs$30 = {
		'display': 'block',
		'min-height': '100vh',

		'#reactpayment': {
			'.payment-methods-list__item.\--add': {
				'color': COLOR.dark,
				'border': `1px solid ${COLOR.dark}`,
				'background': 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI1MHB4IiBoZWlnaHQ9IjUwcHgiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDUwIDUwIj48ZyBpZD0iRGVza3RvcCIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMSI+PGcgaWQ9Ik1lbnUtLy1QYXltZW50LW1ldGhvZHMiIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEwOTUuMDAwMDAwLCAtNTUxLjAwMDAwMCkiPjxnIGlkPSJHcm91cC0yIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxMDk1LjAwMDAwMCwgNTUxLjAwMDAwMCkiPjxyZWN0IGlkPSJSZWN0YW5nbGUtNiIgd2lkdGg9IjUwIiBoZWlnaHQ9IjIiIHg9IjAiIHk9IjI0IiBmaWxsPSIjNDQ0MjNFIi8+PHJlY3QgaWQ9IlJlY3RhbmdsZS02IiB3aWR0aD0iMiIgaGVpZ2h0PSI1MCIgeD0iMjQiIHk9IjAiIGZpbGw9IiM0NDQyM0UiLz48L2c+PC9nPjwvZz48L3N2Zz4=") no-repeat center 70px'
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let args = {};

	const genUniqHash = () => {
		let hash = `${Math.random().toString(36).substr(2, 5)}`;
		return args.hasOwnProperty(hash) ? genUniqHash() : hash;
	};

	class IfUserNot extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static show(ifYes, ifNo) {
			let hash = genUniqHash();
			args[hash] = [ifYes, ifNo];
			return BMPVD.createBMPVirtulaDOMElement('if-user-not', { 'args-index': hash });
		}

		ready() {
			this.argsIndex = this.getAttribute('args-index');

			this.subID = instance$1.subscribe('user', user => {
				this.context.user = user;
			});

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				pending: false
			});

			return Promise.resolve();
		}

		disconnectedCallback() {
			// args = Object.keys(args).reduce((out, iter, i, arr) => {
			// 	if (iter !== this.argsIndex)
			// 		return { ...out, [iter] : arr[iter] }
			// 	return out
			// }, {})
		}

		render() {
			return this.context.user && this.context.user.isAuthorized ? args[this.argsIndex][0] : args[this.argsIndex][1];
		}

	}

	if (!customElements.get('if-user-not')) customElements.define('if-user-not', IfUserNot);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$42 = instance.define({
		name: 'profile-payment',
		cssjs: cssjs$30
	});

	class WrapReactpayment extends HTMLElement {
		constructor() {
			super();
		}
		connectedCallback() {
			this.innerHTML = '<div id="reactpayment"></div>';
			ReactCaller$1.run('paymentMethods', this.querySelector('#reactpayment'), instance$1);
		}
		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.querySelector('#reactpayment'));
		}
	}
	if (!customElements.get('wrap-reactpayment')) customElements.define('wrap-reactpayment', WrapReactpayment);

	class ProfilePayment extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$42.attachStyles(this);
			this.ifUserNot = IfUserNot.show(BMPVD.createBMPVirtulaDOMElement('wrap-reactpayment', null), BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				h5(`color: ${COLOR.dark}`, 'Please log in or create an account.')
			));
			return Promise.resolve();
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					mod: { className: 'visual-bg', style: 'background: url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover; height: 210px;' },
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', { 'class': 'relative' })]
				}),
				body: ME.container({
					mod: { className: 'page-content' },
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'Payment method'))]
						}), ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, this.ifUserNot)]
						}))]
					})]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	if (!customElements.get('profile-payment')) customElements.define('profile-payment', ProfilePayment);

	const cssjs$31 = {
		'display': 'block',
		'min-height': '100vh',
		'background': 'url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover',

		'.overlay': {
			'position': 'absolute',
			'left': '0',
			'top': '0',
			'bottom': '0',
			'width': '100%',
			'height': '100%',
			'overflow-y': 'auto',
			'background-color': 'rgba(0, 0, 0, 0.2)'
		},

		'.react-container': {
			'min-height': '100vh',
			'height': '100%',
			'position': 'relative'
		},

		'@media (max-width: 839px)': {
			'.react-container': {
				'min-height': 'auto'
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$43 = instance.define({
		name: 'profile-promo',
		cssjs: cssjs$31
	});

	class ProfilePromo extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$43.attachStyles(this);
			return Promise.resolve();
		}

		onAttached() {
			const el = this.querySelector('#reactpromo');
			const router = document.querySelector('bmp-router');
			const goTo = router.go.bind(router);
			ReactApp.profilePromo(el, goTo, instance$1);
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { 'hide-logo': true }),
				body: ME.container({
					mod: { className: 'react-container' },
					children: [BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'overlay' },
						BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactpromo' })
					)]
				}),
				// footer: jetFooter(),
				sidebar: BMPVD.createBMPVirtulaDOMElement('profile-sidebar', { 'current-page': 'promo' })
			});
		}

	}

	if (!customElements.get('profile-promo')) customElements.define('profile-promo', ProfilePromo);

	const cssjs$32 = {
		'display': 'block',
		'min-height': '100vh',
		'color': COLOR.dark,

		'p': {
			'color': COLOR.dark
		},
		'h3': {
			'color': COLOR.dark
		},
		'small': {
			'color': COLOR.dark
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$44 = instance.define({
		name: 'profile-verify',
		cssjs: cssjs$32
	});

	class WrapVerifyReactpayment extends BMPVDWebComponent {
		constructor() {
			super();
		}
		ready() {
			this.subID = instance$1.subscribe('user', user => {
				this.context.user = user;
			});

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				pending: false
			});
		}

		onAttached() {
			ReactCaller$1.run('verifyId', this.querySelector('#reactverify'), instance$1);
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.querySelector('#reactverify'));
			instance$1.unsubscribe('user', this.subID);
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactverify', style: `display: ${this.context.user && this.context.user.needIdVerification && !storedGeoIp.is_gdpr ? 'block' : 'none'}` }),
				this.context.user && this.context.user.needIdVerification && !storedGeoIp.is_gdpr ? null : h4(`color: ${COLOR.dark};`, 'For the safety of our community, ID verification must be completed prior to boarding your first flight.')
			);
		}
	}

	if (!customElements.get('wrap-verify-reactpayment')) customElements.define('wrap-verify-reactpayment', WrapVerifyReactpayment);

	class ProfileVerify extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$44.attachStyles(this);
			this.ifUserNot = IfUserNot.show(BMPVD.createBMPVirtulaDOMElement('wrap-verify-reactpayment', null), h4(`color: ${COLOR.dark};`, 'For the safety of our community, ID verification must be completed prior to boarding your first flight.'));

			return Promise.resolve();
		}

		onAttached() {
			const el = this.querySelector('#reactverify');
			ReactCaller$1.run('verifyId', el, instance$1);
		}

		getBody() {

			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'Verify'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('wrap-verify-reactpayment', null))]
					}))]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					mod: { className: 'visual-bg', style: 'background: url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover; height: 210px;' },
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', { 'class': 'relative' })]
				}),
				body: this.getBody(),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	if (!customElements.get('profile-verify')) customElements.define('profile-verify', ProfileVerify);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$45 = instance.define({
		name: 'jetsm-login',
		cssjs: {
			'display': 'block',
			'background': 'url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover',
			'min-height': '100vh',
			'padding-top': '130px'
		}
	});

	class JetsmLogin extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$45.attachStyles(this);
			return Promise.resolve();
		}

		onAttached() {
			const router = document.querySelector('bmp-router');
			const goTo = router.go.bind(router);
			this.reactEl = this.querySelector('#reactlogin');
			ReactCaller.run('login', this.reactEl, goTo, instance$1);
		}

		disconnectedCallback() {
			ReactCaller.run('disconnect', this.reactEl);
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { 'hide-logo': '' }),
				body: ME.container({
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactlogin' }))]
					})]
				})
			});
		}

	}

	if (!customElements.get('jetsm-login')) customElements.define('jetsm-login', JetsmLogin);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$46 = instance.define({
		name: 'jetsm-sign-up',
		cssjs: {
			'display': 'block',
			'background': 'url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover',
			'min-height': '100vh',
			'padding-top': '130px'
		}
	});

	class JetsmSignUp extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$46.attachStyles(this);
			return Promise.resolve();
		}

		onAttached() {
			this.reactEl = this.querySelector('#reactsignup');
			const router = document.querySelector('bmp-router');
			const goTo = router.go.bind(router);
			ReactCaller$1.run('signup', this.reactEl, goTo, instance$1);
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.reactEl);
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { 'hide-logo': '' }),
				body: ME.container({
					children: [ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactsignup' }))]
					})]
				})
			});
		}

	}

	if (!customElements.get('jetsm-sign-up')) customElements.define('jetsm-sign-up', JetsmSignUp);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$47 = instance.define({
		name: 'jetsm-logout',
		cssjs: {
			'display': 'block',
			'background': 'url("https://jetsmarter.com/data/site-v5/assets/pages/profile/profile.jpg") no-repeat 50% 50% / cover',
			'min-height': '100vh',
			'padding-top': '130px'
		}
	});

	class JetsmLogout extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$47.attachStyles(this);
			return Promise.resolve();
		}

		onAttached() {
			this.reactEl = this.querySelector('#reactlogout');
			const router = document.querySelector('bmp-router');
			const goTo = router.go.bind(router);
			ReactCaller$1.run('logout', this.reactEl, goTo, instance$1);
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.reactEl);
		}

		render() {
			return ME.scafold({
				appBar: BMPVD.createBMPVirtulaDOMElement('jet-header', { 'hide-logo': '' }),
				body: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('div', { id: 'reactlogout' })]
				})
			});
		}
	}

	if (!customElements.get('jetsm-logout')) customElements.define('jetsm-logout', JetsmLogout);

	const cssjs$33 = {
		'display': 'block',

		'.flex-table': {
			width: '100%',
			display: 'flex',
			'padding': '0 0 60px'
		},
		'.flex-table-inner': {
			'width': '100%',
			'display': 'flex',
			'flex-direction': 'column'
		},
		'.flex-table-header': {
			'width': '100%',
			'display': 'flex'
		},
		'.flex-table-header-inner': {
			'width': '50%',
			'color': COLOR.dark,
			'&:first-child': {
				'margin-right': '10px'
			}
		},
		'.flex-table-item': {
			'display': 'flex',
			'width': '100%',

			'&:nth-child(odd)': {
				'.flex-table-item-inner': {
					'background': COLOR.light
				}
			},
			'&:last-child': {
				'.bull': {
					'display': 'none'
				},
				'.flex-table-item-inner': {
					'font-size': '13px',
					'padding-top': '40px',
					'background': 'transparent'
				}
			}
		},
		'.flex-table-item-inner': {
			'width': '50%',
			'color': COLOR.dark,
			'font-size': '18px',
			'font-family': 'Roboto, sans-serif',
			'display': 'flex',
			'padding': '17px 15px',
			'align-items': 'flex-start',
			'line-height': '26px',

			'&:first-child': {
				'margin-right': '10px'
			}
		},

		'sup': {
			'font-size': '10px',
			'color': COLOR.dark,
			'line-height': '0'
		},
		'.bull': {
			padding: '0 20px 0 0'
		},

		'.flex-table-mobile': {
			'display': 'none',

			'.bull': {
				padding: '0 20px 0 0'
			},

			'.flex-table-mobile-item': {
				'color': COLOR.dark,
				'font-size': '18px',
				'font-family': 'Roboto, sans-serif',
				'padding': '21px 20px',
				'line-height': '26px',

				'&:nth-child(odd)': {
					'background': COLOR.light
				}
			}
		},

		'.jet-list': {
			'display': 'flex',
			'align-items': 'flex-end',
			'justify-content': 'space-between',
			'padding': '0 0 73px',
			'.jet-item': {
				'width': '20%',
				'padding': '10px'
			},
			'.jet-item-img': {
				'max-width': '100%',
				'display': 'block',
				'margin': 'auto',

				'&.heavy-jet': {
					'max-width': '100%'
				},
				'&.super-midsize-jet': {
					'max-width': '90%'
				},
				'&.midsize-jet': {
					'max-width': '90%'
				},
				'&.light-jet': {
					'max-width': '75%'
				},
				'&.helicopter': {
					'max-width': '50%'
				}
			}
		},

		'.hiw-card': {
			'margin': '0 0 87px'
		},

		'@media (max-width: 839px)': {
			'.flex-table-item-inner': {
				'width': '100%'
			},
			'.hiw-card': {
				'margin': '0 0 60px'
			},
			'.flex-table': {
				'display': 'none'
			},
			'.flex-table-mobile': {
				'display': 'block',
				'padding': '0 0 60px'
			},
			'.jet-list': {
				'display': 'flex',
				'align-items': 'flex-end',
				'justify-content': 'space-between',
				'flex-wrap': 'wrap',

				'.jet-item': {
					'width': '100%',
					'padding': '10px'
				},

				'.jet-item-img': {
					'max-width': '100%'
				}
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$48 = instance.define({
		name: 'jetsm-hiw',
		cssjs: cssjs$33
	});

	const benefitsTable = [{
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Book seats on\xA0flights'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Create on-demand shared\xA0&\xA0private flights across the\xA0globe'
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Create flights worldwide'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Guaranteed availability with ',
				BMPVD.createBMPVirtulaDOMElement(
					'span',
					{ style: 'white-space: nowrap' },
					'24-hour'
				),
				' notice on\xA0private charters',
				BMPVD.createBMPVirtulaDOMElement(
					'sup',
					null,
					'1'
				)
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: 'color: #B3B1B4' },
				'Flight discounts'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Discounted member pricing on\xA0flights'
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: 'color: #B3B1B4' },
				'Priority flight\xA0availability'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Priority flight availability over ',
				BMPVD.createBMPVirtulaDOMElement(
					'span',
					{ style: 'white-space: nowrap' },
					'non-members'
				)
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: 'color: #B3B1B4' },
				'Access to\xA0VIP events'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Access to VIP events'
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: 'color: #B3B1B4' },
				'Luxury partner benefits'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'Luxury partner benefits'
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: 'color: #B3B1B4' },
				'24/7 concierge'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'24/7 concierge'
			) }]
	}, {
		payg: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				'\xA0'
			) }],
		jsm: [{ text: BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				BMPVD.createBMPVirtulaDOMElement(
					'sup',
					null,
					'1'
				),
				' Applicable to\xA0select fleet categories and\xA0excluding peak\xA0days'
			) }]
	}];

	class JetsmHiw extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$48.attachStyles(this);
			return Promise.resolve();
		}

		createBody() {
			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'How it Works'), h4(`color: ${COLOR.dark}; margin: 0 0 34px; font-weight: 400`, 'JetSmarter gives you two ways to fly:'))]
					}), ME.layout.grid({
						mod: { desktop: { margin: '0 0 64px' } },
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'flex flex-reverse' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'flex-item' },
								ME.layout.grid({
									mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
									children: [ME.layout.cell({ common: 10 }, h3(`color: ${COLOR.dark}; margin: 30px 0 30px; font-weight: 400`, 'Find'), text(`color: ${COLOR.dark}`, 'Browse and book seats on existing shared flights around the world and experience the perks of flying private for less than you thought possible. Seats are offered on flights created by the community and flights initiated and pre-scheduled by JetSmarter or its partners.')), ME.layout.cell({ common: 1 })]
								})
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'flex-item' },
								ME.layout.grid({
									mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
									children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/hiw-img-1.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
								})
							)
						))]
					}), ME.layout.grid({
						mod: { desktop: { margin: '0 0 64px' } },
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'flex' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'flex-item' },
								ME.layout.grid({
									mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
									children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/hiw-img-2.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
								})
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'flex-item' },
								ME.layout.grid({
									mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
									children: [ME.layout.cell({ common: 2, phone: 0 }), ME.layout.cell({ common: 10, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 30px 0 30px; font-weight: 400`, 'Create'), text(`color: ${COLOR.dark}`, 'Choose your aircraft, where and when you want to fly, and how many seats you need — or book all the seats to make it private. You\'ll always enjoy our low-price guarantee, best-in-class flight support, and save thousands compared to traditional charters.'))]
								})
							)
						))]
					}), ME.container({
						mod: { className: 'hiw-card' },
						children: [ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; font-weight: 400; padding: 20px 0 50px;`, 'Start flying with us')), ME.layout.cell({ desktop: 12, tablet: 8, phone: 4 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'flex-table' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flex-table-inner' },
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'flex-table-header' },
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-header-inner' },
												h3(`color: ${COLOR.dark}; margin: 0 0 10px;`, 'Pay-as-you-go')
											),
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-header-inner' },
												h3(`color: ${COLOR.dark}; margin: 0 0 10px;`, 'JetSmarter Membership'),
												h4(`color: ${COLOR.primary}; margin: 0 0 10px; font-weight: 500;`, '$2,500/year')
											)
										),
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'flex-table-header' },
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-header-inner' },
												h4(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Book flights',
													BMPVD.createBMPVirtulaDOMElement('br', null),
													' at non-member\xA0rates'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-header-inner' },
												h4(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Ideal for anyone that flies more than one round-trip per year'
												))
											)
										),
										benefitsTable.map(item => BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'flex-table-item' },
											item['payg'].map(el => BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-item-inner' },
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'bull' },
													'\u2022'
												),
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													null,
													el.text
												)
											)),
											item['jsm'].map(el => BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-item-inner' },
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'bull' },
													'\u2022'
												),
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													null,
													el.text
												)
											))
										))
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'flex-table-mobile' },
									h3(`color: ${COLOR.dark}; margin: 0 0 20px;`, 'Pay-as-you-go'),
									h4(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, BMPVD.createBMPVirtulaDOMElement(
										'span',
										null,
										'Book flights',
										BMPVD.createBMPVirtulaDOMElement('br', null),
										' at non-member rates'
									)),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flex-table-mobile-list' },
										benefitsTable.map(item => BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'flex-table-item' },
											item['payg'].map(el => BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'flex-table-item-inner' },
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													{ className: 'bull' },
													'\u2022'
												),
												BMPVD.createBMPVirtulaDOMElement(
													'div',
													null,
													el.text
												)
											))
										))
									),
									h3(`color: ${COLOR.dark}; margin: 0 0 10px;`, 'JetSmarter Membership'),
									h4(`color: ${COLOR.primary}; margin: 0 0 10px; font-weight: 500;`, '$2,500/year'),
									h4(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, BMPVD.createBMPVirtulaDOMElement(
										'span',
										null,
										'Ideal for anyone that flies more than one round-trip per year'
									)),
									benefitsTable.map(item => BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flex-table-item' },
										item['jsm'].map(el => BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'flex-table-item-inner' },
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'bull' },
												'\u2022'
											),
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												null,
												el.text
											)
										))
									))
								),
								h4(`color: ${COLOR.dark}; font-weight: 400`, BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'Looking for a\xA0group or\xA0customizable business plan? Call\xA0us\xA0at\xA0',
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: 'tel:+18889VIPJET', style: `color: ${COLOR.primary}; white-space: nowrap;` },
										BMPVD.createBMPVirtulaDOMElement(
											'span',
											{ className: 'notranslate' },
											'888 9 VIP JET'
										)
									),
									' to\xA0inquire about your\xA0options.'
								)),
								h4(`color: ${COLOR.dark}; font-weight: 400`, BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'Have questions about membership? We\xA0invite you to\xA0speak with a\xA0',
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: 'https://calendly.com/jetsmarter-team/jetsmarter-introductory-call-web/', target: '_blank', style: `color: ${COLOR.primary}; white-space: nowrap;` },
										'Membership\xA0Specialist.'
									)
								))
							))]
						})]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px;`, 'Where will you go?'), h4(`color: ${COLOR.dark}; font-weight: 400`, 'Essentially, wherever you\'d like.'), text(`color: ${COLOR.dark}; margin: 0 0 30px;`, 'Create flights to and from 170+ countries worldwide, or fly on high-frequency routes between major cities. For example, between New York, L.A., and South Florida alone, JetSmarter connects fliers to more than 100 flights every week.'), linkButtonPrimary$1('padding: 0px 0 60px;', BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/?focus=origin' },
								'Book a flight'
							)
						)))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px;`, 'Fly how you want, when you want'), text(`color: ${COLOR.dark}; margin: 0 0 30px;`, 'Because JetSmarter partners with premium flight operators and pilots, the aircraft options are virtually limitless.'), BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'jet-list' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'jet-item' },
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'jet-item-img heavy-jet', src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/jets/jet-img-1.svg', alt: '' }),
								text(`color: ${COLOR.dark}; font-weight: 500; text-align: center; padding: 20px 0 0`, 'Heavy Jet')
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'jet-item' },
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'jet-item-img super-midsize-jet', src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/jets/jet-img-2.svg', alt: '' }),
								text(`color: ${COLOR.dark}; font-weight: 500; text-align: center; padding: 20px 0 0`, 'Super Midsize Jet')
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'jet-item' },
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'jet-item-img midsize-jet', src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/jets/jet-img-3.svg', alt: '' }),
								text(`color: ${COLOR.dark}; font-weight: 500; text-align: center; padding: 20px 0 0`, 'Midsize Jet')
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'jet-item' },
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'jet-item-img light-jet', src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/jets/jet-img-4.svg', alt: '' }),
								text(`color: ${COLOR.dark}; font-weight: 500; text-align: center; padding: 20px 0 0`, 'Light jet')
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'jet-item' },
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'jet-item-img helicopter', src: 'https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/jets/jet-img-5.svg', alt: '' }),
								text(`color: ${COLOR.dark}; font-weight: 500; text-align: center; padding: 20px 0 0`, 'Helicopter')
							)
						), linkButtonPrimary$1('display: inline-block; width: 100%; max-width: 350px; margin-right: 30px; margin-bottom: 20px;', BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/fleet/' },
								'See the fleet'
							)
						)))]
					}))]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/hiw-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: this.createBody(),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}
	}

	if (!customElements.get('jetsm-hiw')) customElements.define('jetsm-hiw', JetsmHiw);

	const cssjs$34 = {
		'display': 'block',

		'.hiw-price-table-mobile': {
			'display': 'none'
		},
		'.hiw-price-table-mobile-item': {
			'padding': '0 0 60px'
		},

		'.hiw-price-table': {

			'display': 'table',
			'width': '100%',
			'padding': '0 0 60px',

			'.hiw-price-row': {
				'display': 'table-row',

				'&:nth-child(1)': {
					'.hiw-price-cell': {
						'padding': '0 0 34px'
					}
				},
				'&:nth-child(2)': {
					'.hiw-price-cell': {
						'padding': '0 0 45px'
					}
				},
				'&:nth-child(3)': {
					'.hiw-price-cell': {
						'padding': '0 0 34px'
					}
				}
			},

			'.hiw-price-cell': {
				'width': '33.33%',
				'display': 'table-cell'
			}

		},

		'.hiw-price-list': {
			'margin': '0 0 0 18px',
			'padding-right': '20px',

			'li': {
				'list-style-type': 'disc',
				'color': `#625F57`
			}
		},

		'@media (max-width: 960px)': {
			'.hiw-price-table': {
				'display': 'none'
			},
			'.hiw-price-table-mobile': {
				'display': 'block'
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$49 = instance.define({
		name: 'jetsm-hiw-pricing',
		cssjs: cssjs$34
	});

	class JetsmHiwPricing extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$49.attachStyles(this);
			return Promise.resolve();
		}

		createBody() {
			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/how-it-works/', className: 'back-btn', style: 'margin-bottom: 53px' },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						), h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'Membership Prices'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'hiw-price-table' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-row' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h3(`color: ${COLOR.dark}`, 'Starter')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h3(`color: ${COLOR.dark}`, 'Individual')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h3(`color: ${COLOR.dark}`, 'Family')
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-row' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '_'),
										h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '$1,995'),
										h5(`color: ${COLOR.dark}; font-weight: 400;`, 'one-time fee')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '$3,000'),
										h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '$4,950'),
										h5(`color: ${COLOR.dark}; font-weight: 400;`, 'annual membership fee')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '$3,000'),
										h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
										h4(`color: ${COLOR.primary}; font-weight: 400;`, '$9,950'),
										h5(`color: ${COLOR.dark}; font-weight: 400;`, 'annual membership fee')
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-row' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.dark}; font-weight: 400;`, 'One user')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.dark}; font-weight: 400;`, 'One user')
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										h4(`color: ${COLOR.dark}; font-weight: 400;`, 'Includes four users*')
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-row' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'hiw-price-list' },
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Get member discounts on\xA06\xA0flights for\xA0the\xA0year'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Expires 12 months from purchase date or\xA0upon completion of\xA06th\xA0flight'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Discount redeemable on\xA0one\xA0seat per\xA0flight'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Upgrade to our Individual or\xA0Family plan to\xA0access discounts on\xA0unlimited flights, VIP\xA0events, ',
													BMPVD.createBMPVirtulaDOMElement(
														'span',
														{ style: 'white-space: nowrap;' },
														'24/7 concierge'
													),
													', and\xA0more'
												))
											)
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'hiw-price-list' },
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Discounted member pricing on\xA0flights'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Priority flight availability ',
													BMPVD.createBMPVirtulaDOMElement(
														'span',
														{ style: 'white-space: nowrap;' },
														'over non-members'
													)
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Book unlimited seats for\xA0about the\xA0cost of\xA0commercial'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Create on-demand shared &\xA0private\xA0flights across the\xA0globe'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Access to VIP events, ',
													BMPVD.createBMPVirtulaDOMElement(
														'span',
														{ style: 'white-space: nowrap;' },
														'24/7 concierge'
													),
													' service, and\xA0luxury partner\xA0benefits'
												))
											)
										)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										BMPVD.createBMPVirtulaDOMElement(
											'ul',
											{ className: 'hiw-price-list' },
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Discounted member pricing on\xA0flights'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Priority flight availability ',
													BMPVD.createBMPVirtulaDOMElement(
														'span',
														{ style: 'white-space: nowrap;' },
														'over non-members'
													)
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Book unlimited seats for\xA0about the\xA0cost of\xA0commercial'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Create on-demand shared & private flights across the\xA0globe'
												))
											),
											BMPVD.createBMPVirtulaDOMElement(
												'li',
												null,
												h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
													'span',
													null,
													'Access to VIP events, ',
													BMPVD.createBMPVirtulaDOMElement(
														'span',
														{ style: 'white-space: nowrap;' },
														'24/7 concierge'
													),
													' service, and\xA0luxury partner\xA0benefits'
												))
											),
											textSmall(`color: #625F57; padding: 30px 0 0; font-weight: 300`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'*Add up to\xA0six additional users for\xA0$1,950 per\xA0person\xA0annually'
											))
										)
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-row' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										linkButtonPrimary$1('padding: 30px 10px 0 0; display: block;', BMPVD.createBMPVirtulaDOMElement(
											'bmp-anchor',
											{ style: 'margin: auto;' },
											BMPVD.createBMPVirtulaDOMElement(
												'a',
												{ style: 'display: block;', href: '/' },
												'Purchase'
											)
										))
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										linkButtonPrimary$1('padding: 30px 10px 0 0; display: block;', BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ style: 'display: block;', href: 'https://send.jetsmarter.com/', target: '_blank' },
											'Purchase'
										))
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'hiw-price-cell' },
										linkButtonPrimary$1('padding: 30px 10px 0 0; display: block;', BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ style: 'display: block;', href: 'https://send.jetsmarter.com/', target: '_blank' },
											'Purchase'
										))
									)
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'hiw-price-table-mobile' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-table-mobile-item' },
									h3(`color: ${COLOR.dark}; margin: 0 0 20px;`, 'Starter'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '—'),
									h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '$4,950'),
									h5(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, 'one-time fee'),
									h4(`color: ${COLOR.dark}; margin: 0 0 20px; font-weight: 400;`, 'One user'),
									BMPVD.createBMPVirtulaDOMElement(
										'ul',
										{ className: 'hiw-price-list' },
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Get member discounts on\xA06\xA0flights for\xA0the\xA0year'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Expires 12 months from purchase date or\xA0upon completion of\xA06th\xA0flight'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Discount redeemable on\xA0one\xA0seat per\xA0flight'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Upgrade to our Individual or\xA0Family plan to\xA0access discounts on\xA0unlimited flights, VIP\xA0events, ',
												BMPVD.createBMPVirtulaDOMElement(
													'span',
													{ style: 'white-space: nowrap;' },
													'24/7 concierge'
												),
												', and\xA0more'
											))
										)
									),
									linkButtonPrimary$1('padding: 30px 0 0px; display: block;', BMPVD.createBMPVirtulaDOMElement(
										'bmp-anchor',
										{ style: 'margin: auto;' },
										BMPVD.createBMPVirtulaDOMElement(
											'a',
											{ style: 'display: block;', href: '/' },
											'Purchase'
										)
									))
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-table-mobile-item' },
									h3(`color: ${COLOR.dark}; margin: 0 0 20px;`, 'Individual'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '$3,000'),
									h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '$4,950'),
									h5(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, 'annual membership fee'),
									h4(`color: ${COLOR.dark}; margin: 0 0 20px; font-weight: 400;`, 'One user'),
									BMPVD.createBMPVirtulaDOMElement(
										'ul',
										{ className: 'hiw-price-list' },
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Discounted member pricing on\xA0flights'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Priority flight availability ',
												BMPVD.createBMPVirtulaDOMElement(
													'span',
													{ style: 'white-space: nowrap;' },
													'over non-members'
												)
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Book unlimited seats for\xA0about the\xA0cost of\xA0commercial'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Create on-demand shared &\xA0private\xA0flights across the\xA0globe'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Access to VIP events, ',
												BMPVD.createBMPVirtulaDOMElement(
													'span',
													{ style: 'white-space: nowrap;' },
													'24/7 concierge'
												),
												' service, and\xA0luxury partner\xA0benefits'
											))
										)
									),
									linkButtonPrimary$1('padding: 20px 10px 0 0; display: block;', BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ style: 'display: block;', href: 'https://send.jetsmarter.com/', target: '_blank' },
										'Purchase'
									))
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'hiw-price-table-mobile-item' },
									h3(`color: ${COLOR.dark}; margin: 0 0 20px;`, 'Family'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '$3,000'),
									h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 10px`, 'one time initiation fee'),
									h4(`color: ${COLOR.primary}; font-weight: 400;`, '$9,950'),
									h5(`color: ${COLOR.dark}; margin: 0 0 30px; font-weight: 400;`, 'annual membership fee'),
									h4(`color: ${COLOR.dark}; margin: 0 0 20px; font-weight: 400;`, 'Includes four users*'),
									BMPVD.createBMPVirtulaDOMElement(
										'ul',
										{ className: 'hiw-price-list' },
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Discounted member pricing on\xA0flights'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Priority flight availability ',
												BMPVD.createBMPVirtulaDOMElement(
													'span',
													{ style: 'white-space: nowrap;' },
													'over non-members'
												)
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Book unlimited seats for\xA0about the\xA0cost of\xA0commercial'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Create on-demand shared & private flights across the\xA0globe'
											))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'li',
											null,
											h6(`color: #625F57; font-weight: 300;`, BMPVD.createBMPVirtulaDOMElement(
												'span',
												null,
												'Access to VIP events, ',
												BMPVD.createBMPVirtulaDOMElement(
													'span',
													{ style: 'white-space: nowrap;' },
													'24/7 concierge'
												),
												' service, and\xA0luxury partner\xA0benefits'
											))
										)
									),
									text(`color: #625F57; padding: 30px 0 0; font-weight: 300`, '*Add up to six additional users for $1,950 per person annually'),
									linkButtonPrimary$1('padding: 20px 10px 0 0; display: block;', BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ style: 'display: block;', href: 'https://send.jetsmarter.com/', target: '_blank' },
										'Purchase'
									))
								)
							),
							h5(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 0`, 'Looking for a customizable business travel solution? ', 'Call us at ', BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ className: 'default-link', style: `color: ${COLOR.primary};white-space: nowrap;`, href: 'tel:+18889847538' },
								'888 9 VIP JET'
							), ' to inquire about your options.'),
							text(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 34px`, 'Have questions about any of our plans? We invite you to speak with a ', BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ className: 'default-link', style: `color: ${COLOR.primary};`, rel: 'noopener', target: '_blank', href: 'https://calendly.com/jetsmarter-team/jetsmarter-introductory-call-web/' },
								'Membership Specialist.'
							))
						))]
					}))]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					mod: { className: 'visual-bg', style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/how-it-works/hiw-top.jpg) no-repeat 50% 50% / cover; height: 210px;' },
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', { 'class': 'relative' })]
				}),
				body: this.createBody(),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}
	}

	if (!customElements.get('jetsm-hiw-pricing')) customElements.define('jetsm-hiw-pricing', JetsmHiwPricing);

	const cssjs$35 = {
		'display': 'block',

		'.app-icon': {
			'width': '84px',
			'height': '84px',
			'display': 'block',
			'margin': '0 0 30px'
		},
		'.phone-field.integrated': {
			'max-width': '390px',
			margin: '45px 0 30px'
		},
		'.error-message': {
			color: COLOR.primary,
			'font-family': 'Roboto',
			'font-weight': 200

		},
		'.btn': {}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$50 = instance.define({
		name: 'jetsm-download',
		cssjs: cssjs$35
	});

	class JetsmDownload extends BMPVDWebComponent {

		constructor() {
			super();
		}

		branchConf() {
			return {
				tags: [],
				channel: 'get the app',
				feature: 'text-me-the-app',
				data: {
					'$og_image_url': 'https://jetsmarter.com/data/lands/images/sms_images.jpg',
					"$og_title": 'JetSmarter | Fly on Private Jets',
					"$og_description": 'JetSmarter | Fly on Private Jets',
					"$ios_passive_deepview": 'jetsmarter_deepview_qapd',
					"$android_passive_deepview": 'jetsmarter_deepview_qapd'
				}
			};
		}

		sendSms(phone) {

			return new Promise(resolve => {
				const callback = (err, result) => {
					setTimeout(_ => {
						if (err) {
							this.context.error = 'Please enter a valid phone number';
						} else {
							this.context.error = '';
							this.context.success = true;
						}
						resolve();
					}, 150);
				};

				branch.sendSMS(this.phone.replace(/[^\d]+/, ''), this.branchConf(), {}, callback);
			});
		}

		ready() {
			if (!window.IS_SSR) {
				/** load and init branch.io */
				(function (b, r, a, n, c, h, _, s, d, k) {
					if (!b[n] || !b[n]._q) {
						for (; s < _.length;) c(h, _[s++]);d = r.createElement(a);d.async = 1;d.src = "https://cdn.branch.io/branch-latest.min.js";k = r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d, k);b[n] = h;
					}
				})(window, document, "script", "branch", function (b, r) {
					b[r] = function () {
						b._q.push([r, arguments]);
					};
				}, { _q: [], _v: 1 }, "addListener applyCode banner closeBanner creditHistory credits data deepview deepviewCta first getCode init link logout redeem referrals removeListener sendSMS setBranchViewData setIdentity track validateCode".split(" "), 0);
				branch.init('key_live_pcl9dhYtUSpeGpWf92gosnkmECfQFUIR');
			}

			bmpCssComponent$50.attachStyles(this);
			this.context = this.observe({
				pending: false,
				success: false,
				error: ''
			});
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.reactEl);
		}

		writePhone(val) {
			this.phone = val;
		}

		async handleSubmit(ev) {
			ev.preventDefault();

			if (!this.phone) {
				this.context.error = 'Please enter a valid phone number';
			} else {
				this.context.error = '';
				this.context.pending = true;
				await this.sendSms();
				this.context.pending = false;
			}
		}

		successMessage() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ 'class': 'success-message' },
				h2('color: ' + COLOR.primary, 'ON ITS WAY'),
				h5('margin-top: 30px;color: ' + COLOR.dark, BMPVD.createBMPVirtulaDOMElement(
					'p',
					null,
					'An app download link has\xA0been sent to\xA0you via\xA0text message.'
				))
			);
		}

		form() {
			return BMPVD.createBMPVirtulaDOMElement(
				'form',
				{ onsubmit: ev => this.handleSubmit(ev) },
				h4(`color: ${COLOR.dark}; margin: 0 0 0px; font-weight: 400`, BMPVD.createBMPVirtulaDOMElement(
					'span',
					null,
					'Enter your phone number with\xA0country code, and\xA0we\u2019ll send you the download link.'
				)),
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'phone-input', ref: el => {
						this.reactEl = el;
						ReactCaller$1.run('phoneInput', this.reactEl, '', this.writePhone.bind(this));
					}
				}),
				this.context.pending ? BMPVD.createBMPVirtulaDOMElement('div', { 'class': `preloader ${this.context.pending ? '' : "hidden"}`, safeHTML: svgIcon.preloader() }) : BMPVD.createBMPVirtulaDOMElement('span', null),
				this.context.pending ? BMPVD.createBMPVirtulaDOMElement('span', null) : linkButtonPrimary$1('', BMPVD.createBMPVirtulaDOMElement(
					'button',
					{ type: 'submit' },
					'Get the app'
				)),
				this.context.error ? BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'error-message', style: 'padding-top: 10px;' },
					this.context.error
				) : null
			);
		}

		createBody() {
			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 20px`, BMPVD.createBMPVirtulaDOMElement(
							'span',
							null,
							'Download the\xA0app'
						)))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 6, tablet: 6, phone: 12 }, ME.layout.grid({
							children: [ME.layout.cell({ common: 10 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								BMPVD.createBMPVirtulaDOMElement('img', { className: 'app-icon', src: 'https://jetsmarter.com/data/site-v4/images/jetsmarter_app_icon.svg', alt: '' }),
								this.context.success ? this.successMessage() : this.form()
							))]
						})), ME.layout.cell({ common: 6, tablet: 6, phone: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { style: 'max-width: 100%', src: 'https://jetsmarter.com/data/site-v5/assets/pages/download/download-img-1.jpg', alt: '' }))]
					}))]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/download/download-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: this.createBody(),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}
	}

	if (!customElements.get('jetsm-download')) customElements.define('jetsm-download', JetsmDownload);

	var _extends$21 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const cssjs$36 = _extends$21({
		'display': 'block'
	}, typographyLegalDetail, {

		'color': `${COLOR.dark}`,

		'.news-detail-page': {
			'img': {
				'width': '100%',
				'height': 'auto'
			},

			'.news-detail-content': {
				'img': {
					'max-width': '100%',
					'height': 'auto !important'
				},
				'iframe': {
					'max-width': '100%'
				}
			},

			'a': {
				'transition-duration': '0.25s',
				'text-decoration': 'none',
				'color': `${COLOR.primary}`,
				'border-bottom': '1px solid transparent',
				'&:hover': {
					'border-bottom': `1px solid ${COLOR.primary}`
				}
			}
		},

		'.custom-blog': {
			'img': {
				'width': '100%',
				'height': 'auto',
				'display': 'block'
			}
		},

		'@media (max-width: 479px)': {
			'jetsm-heading': {
				'display': 'none'
			},
			'.news-detail-page': {
				'.news-detail-content': {
					'padding-top': '64px'
				}
			}
		}

	});

	const toLocaleDateStringSupportsLocales$1 = () => {
		try {
			new Date().toLocaleDateString('i');
		} catch (e) {
			return e.name === 'RangeError';
		}
		return false;
	};

	const formatDate = ({
		dateString,
		formatMonth = 'short',
		formatDay = '2-digit',
		formatYear = 'numeric',
		formatWeekday = 'long' } = {}) => {
		let date = new Date(dateString);
		date = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
		if (toLocaleDateStringSupportsLocales$1()) return {
			weekday: date.toLocaleDateString('en-US', { weekday: formatWeekday }),
			month: date.toLocaleDateString('en-US', { month: formatMonth }),
			day: date.toLocaleDateString('en-US', { day: formatDay }),
			year: date.toLocaleDateString('en-US', { year: formatYear })
		};else {
			return date.toLocaleDateString();
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$2 = {
		detail(context) {

			let { title, content, image, updated_at } = context.element;

			return ME.container({
				mod: { className: 'page-content news-detail-page' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'news-detail-content' },
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ href: '/blog/', className: 'back-btn', style: 'margin-bottom: 53px' },
									BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
									'Back'
								)
							),
							h2(`color: ${COLOR.dark}`, title),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								image ? BMPVD.createBMPVirtulaDOMElement('img', { src: `${window.SERVER_NAME}/data/${image}`, alt: title }) : ''
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: content || svgIcon.preloader() })
							)
						))]
					}))]
				})]
			});
		},

		list(context, handleFilter, loadMore, handleButtonTop, pressStore, handleNewsClick) {

			return ME.container({
				mod: { className: 'page-content news-list-page' },
				children: [ME.container({
					mod: { className: 'news-arrow-container' },
					children: [ME.layout.grid({
						mod: { desktop: { margin: '20px' }, tablet: { margin: '20px' }, phone: { margin: '20px' } },
						children: [ME.layout.cell({ desktop: 12, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { className: 'news-arrow-top-icon', onClick: handleButtonTop, safeHTML: svgIcon.borderArrowTop() }))]
					})]
				}), ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'news-filter' },
							['news', 'blog'].map(name => BMPVD.createBMPVirtulaDOMElement(
								'button',
								{
									className: `news-filter__button ${name === context.type ? 'is-active' : ''}`,
									onClick: handleFilter, to: name },
								name
							))
						))]
					}))]
				}), ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'news-top' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'news-top__descr' },
								text('', BMPVD.createBMPVirtulaDOMElement(
									'span',
									null,
									'As we continue to revolutionize the private aviation industry, ours is a story you\u2019re going to want to follow. ',
									BMPVD.createBMPVirtulaDOMElement('br', null),
									'Please send all press inquiries to ',
									BMPVD.createBMPVirtulaDOMElement(
										'a',
										{ href: 'mailto:press@jetsmarter.com', className: 'default-link', style: `color: ${COLOR.primary};` },
										'press@jetsmarter.com'
									)
								))
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'news-top__type' },
								h2('', context.type)
							)
						))]
					}))]
				}), ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, !context.pending ? this.createMain(context, pressStore, handleNewsClick) : BMPVD.createBMPVirtulaDOMElement('div', null))]
				}), ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [ME.layout.cell({ common: 12 }, ME.container({
						mod: { className: 'news-list-wrapper' },
						children: [ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
								children: !context.pending ? this.articleBody(context, pressStore, handleNewsClick) : BMPVD.createBMPVirtulaDOMElement('div', null)
							}))]
						})]
					}))]
				}), ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { className: `inline preloader ${context.loadMorePending || context.pending ? '' : 'hidden'}`, safeHTML: svgIcon.preloader() }), BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'show-more-btn-warpper' },
							context.loadMorePending || context.pending ? BMPVD.createBMPVirtulaDOMElement('span', null) : linkButtonPrimary$1('', BMPVD.createBMPVirtulaDOMElement(
								'button',
								{ onClick: loadMore, style: 'margin: auto; position: relative; z-index: 1;' },
								'Show more'
							))
						))]
					}))]
				})]
			});
		},

		createMain(context, pressStore, handleNewsClick) {

			let elem;

			if (context.type === 'blog') {
				elem = pressStore['blogmain'].node;
				let formattedDate = formatDate({ dateString: elem.updatedAt });
				let renderFormatDate = formattedDate.day && formattedDate.month && formattedDate.year ? `${formattedDate.month} ${formattedDate.day}, ${formattedDate.year}` : formattedDate;

				return BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					ME.layout.grid({
						children: [ME.layout.cell({ desktop: 6, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'a',
							{ className: 'news-item-main__image', onClick: handleNewsClick, href: `/blog/${elem.slug}` },
							BMPVD.createBMPVirtulaDOMElement('img', { src: this.getImage(elem), alt: elem.pageTitle })
						)), ME.layout.cell({ desktop: 6, tablet: 12, phone: 12 }, ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ desktop: 1, tablet: 0, phone: 0 }), ME.layout.cell({ desktop: 11, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'news-item-main__date' },
									h5('', renderFormatDate, BMPVD.createBMPVirtulaDOMElement(
										'span',
										{ className: 'news-item-main__type' },
										'\xA0 Blog'
									))
								),
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ onClick: handleNewsClick, href: `/blog/${elem.slug}`, style: 'text-decoration: none;' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'news-item-main__title' },
										h3('', elem.pageTitle)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'news-item-main__descr' },
										text('', BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: elem.description }))
									)
								)
							))]
						}))]
					})
				);
			}

			if (context.type === 'news') {
				elem = pressStore['newsmain'].node;
				return ME.layout.grid({
					children: [ME.layout.cell({ desktop: 6, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement('a', { className: 'news-item-main__image', href: elem.url, rel: 'noopener', target: '_blank', style: `background: url('${this.getImage(elem)}') #D8D8D8 no-repeat 50% 50% / ${elem.source !== null ? '70%' : 'cover'}` })), ME.layout.cell({ desktop: 6, tablet: 12, phone: 12 }, ME.layout.grid({
						mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
						children: [ME.layout.cell({ desktop: 1, tablet: 0, phone: 0 }), ME.layout.cell({ desktop: 11, tablet: 12, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'news-item-main__date' },
								h5('', elem.updatedAt, BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ className: 'news-item-main__type' },
									'\xA0 ',
									elem.type === 'PressReleaseNode' ? 'Press-Release' : 'News'
								))
							),
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: elem.url, target: '_blank', rel: 'noopener', style: 'text-decoration: none;' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'news-item-main__title' },
									h3('', elem.title)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'news-item-main__descr' },
									text('', BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: elem.description }))
								)
							)
						))]
					}))]
				});
			}
		},

		createBodyNews(item) {
			return ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
				'a',
				{ className: 'news-item', href: item.url, rel: 'noopener', target: '_blank' },
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'news-item__img',
					style: `background: url('${this.getImage(item)}') #D8D8D8 no-repeat 50% 50% / ${item.source !== null ? '70%' : 'cover'}` }),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__date' },
					h5('', item.updatedAt, BMPVD.createBMPVirtulaDOMElement(
						'span',
						{ className: 'news-item__type' },
						'\xA0',
						item.type === 'PressReleaseNode' ? 'Press-Release' : 'News'
					))
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__title' },
					h4('', item.title)
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__descr' },
					h6('', BMPVD.createBMPVirtulaDOMElement('span', { safeHTML: item.description }))
				)
			));
		},

		createBodyBlog(item, handleNewsClick) {
			let formattedDate = formatDate({ dateString: item.updatedAt });
			let renderFormatDate = formattedDate.day && formattedDate.month && formattedDate.year ? `${formattedDate.day} ${formattedDate.month}, ${formattedDate.year}` : formattedDate;

			return ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
				'a',
				{ className: 'news-item', onClick: handleNewsClick, href: `/blog/${item.slug}` },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__img' },
					BMPVD.createBMPVirtulaDOMElement('img', { src: this.getImage(item), alt: item.pageTitle })
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__date' },
					h5('', renderFormatDate, BMPVD.createBMPVirtulaDOMElement(
						'span',
						{ className: 'news-item__type' },
						'\xA0',
						item.type
					))
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__title' },
					h4('', item.pageTitle)
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'news-item__descr' },
					h6('', BMPVD.createBMPVirtulaDOMElement('span', { safeHTML: item.description }))
				)
			));
		},

		articleBody(context, pressStore, handleNewsClick) {
			if (!context.pending && context.type === 'news') {
				return pressStore[context.type].articles.edges.map(({ node }) => {
					return this.createBodyNews(node);
				});
			}
			if (!context.pending && context.type === 'blog') {
				return pressStore[context.type].articles.edges.map(({ node }) => {
					if (node.published) {
						return this.createBodyBlog(node, handleNewsClick);
					}
				});
			}
		},

		getImage(item) {
			if (item.type && item.type === "BlogNewNode") {
				if (item.source) {
					return item.source ? `${window.SERVER_NAME + '/data/' + item.source.logo}` : '';
				} else {
					return `https://jetsmarter.com/data/site-v4/images/press-release-cover.jpg`;
				}
			} else {
				switch (item.type) {
					case "blog":
						return item.sq ? `${window.SERVER_NAME + item.hq}` : '';
					case "news":
					case "BlogNewNode":
						return item.source ? `${window.SERVER_NAME + item.source.logo}` : '';
					default:
						return `https://jetsmarter.com/data/site-v4/images/press-release-cover.jpg`;
				}
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$51 = instance.define({
		name: 'jet-news-detail', cssjs: cssjs$36
	});
	let lastElement$2;
	let lastPromise$1;

	class JetsmNewsDetail extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$51.attachStyles(this);
			this.context = this.observe({
				element: {},
				pending: true
			});
			const uriData = JSON.parse(this.getAttribute('view-params'));
			lastPromise$1 = this.loadData(uriData.slug);
		}

		static async getLastElement() {
			await lastPromise$1;
			return this.lastElement;
		}

		static get lastElement() {
			return lastElement$2;
		}

		async loadData(slug) {
			const { data } = await resourceStorageInstance.getRN(`RN(name='blog', type='detail').filter( published='True', slug='${slug.replace(/(\'|\(|\))/g, `\\\\$1`)}' ).only( 'content', 'title', 'updated_at', 'image' )`);
			this.context.element = lastElement$2 = data;
			this.context.pending = false;
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view$2.detail(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-news-detail')) customElements.define('jetsm-news-detail', JetsmNewsDetail);

	const cssjs$37 = {
		display: 'block',

		'.news-arrow-container': {
			'position': 'fixed',
			'width': '100%',
			'z-index': '1',
			'bottom': '0',
			'opacity': '0',
			'visibility': 'hidden',
			'transition-duration': FX.speed.fast,

			'&.is-visible': {
				'opacity': '1',
				'visibility': 'visible'
			}
		},

		'.news-top__descr': {
			'color': COLOR.dark,
			'margin': '0 0 72px'
		},
		'.news-top__type': {
			'color': COLOR.dark,
			'margin': '0 0 20px',
			'text-transform': 'capitalize'
		},

		'.news-item-main__date': {
			'padding': '0 0 20px',

			'.h5-style': {
				'font-weight': '400',
				'color': COLOR.dark,
				'font-family': FONT.primary
			}
		},
		'.news-item-main__type': {
			'font-weight': '400',
			'color': COLOR.primary
		},
		'.news-item-main__title': {
			'color': COLOR.dark,
			'padding': '0 0 20px',
			'transition-duration': FX.speed.fast,

			'&:hover': {
				'color': COLOR.primary,
				'transition-duration': FX.speed.fast
			}
		},
		'.news-item-main__descr': {
			'color': COLOR.dark
		},

		'.news-item__title': {
			'.h4-style': {
				'transition-duration': FX.speed.fast,
				'margin': '0 0 30px',
				'font-weight': '400',
				'padding': '0 0 5px',
				'min-height': '100px',
				'text-decoration': 'none',
				'color': COLOR.dark
			}
		},

		'.news-item__descr': {
			'color': COLOR.dark,
			'font-weight': '300'
		},

		'.news-item__date': {
			'margin': '0 0 30px',
			'.h5-style': {
				'font-family': 'Gotham',
				'font-weight': '400',
				'color': COLOR.dark
			}
		},

		'.news-item__type': {
			'color': COLOR.primary,
			'text-transform': 'capitalize'
		},

		'.news-arrow-top-icon': {
			'width': '50px',
			'height': '50px',
			'display': 'block',
			'cursor': 'pointer',
			'float': 'right',

			'&:hover': {
				'svg': {
					'box-shadow': FX.shadow.hover,
					'border-radius': '6px',
					'overflow': 'hidden',
					'path': {
						'&:first-child': {
							'fill': COLOR.primary,
							'stroke': COLOR.primary
						},
						'&:last-child': {
							'stroke': COLOR.white
						}
					}
				}
			},

			'svg': {
				'box-shadow': FX.shadow.hover,
				'border-radius': '6px',
				'overflow': 'hidden',
				'path': {
					'&:first-child': {
						'fill': COLOR.white,
						'stroke': COLOR.white
					}
				}
			}
		},

		'.main-news-img': {
			'max-width': '100%',
			'border-radius': FX.radius.medium,
			'position': 'absolute'
		},

		'.news-item-main__image': {
			'display': 'block',
			'position': 'relative',
			'height': '0',
			'overflow': 'hidden',
			'min-height': '0',
			'background-color': COLOR.neutral,
			'border-radius': FX.radius.medium,
			'transition-duration': FX.transSpeedFast,
			'box-shadow': FX.shadowDefault,
			'padding': '0 0 75%',

			'img': {
				'width': 'auto',
				'height': '100%',
				'position': 'absolute',
				'top': '50%',
				'left': '50%',
				'transform': 'translate(-50%, -50%)'
			},

			'&:hover': {
				'transform': `scale(${FX.scale.hover})`,
				'transition-duration': FX.transSpeedFast,
				'box-shadow': FX.shadowHover
			},
			'&:active:hover': {
				'transform': 'scale(1)',
				'transition-duration': FX.transSpeedFast,
				'box-shadow': FX.shadow.default
			}
		},

		'.news-filter': {
			'display': 'flex'
		},
		'.news-filter__button': {
			'-webkit-appearance': 'none',
			'-moz-appearance': 'none',
			'appearance': 'none',
			'-webkit-tap-highlight-color': 'transparent',
			'outline': 'none',
			'position': 'relative',
			'display': 'block',
			'width': '120px',
			'border': `1px solid ${COLOR.primary}`,
			'background-color': 'transparent',
			'color': COLOR.dark,
			'height': '60px',
			'font-family': FONT.primary,
			'font-size': '20px',
			'font-weight': '400',
			'margin': '0',
			'padding': '0',
			'cursor': 'pointer',
			'line-height': '60px',
			'text-align': 'center',
			'transition-duration': '.25s',
			'text-transform': 'capitalize',
			'text-decoration': 'none',
			'&.is-active': {
				'color': COLOR.white,
				'background-color': COLOR.primary
			},
			'&:first-child': {
				'border-radius': `${FX.radius.medium} 0 0 ${FX.radius.medium}`
			},
			'&:last-child': {
				'border-radius': `0 ${FX.radius.medium} ${FX.radius.medium} 0`
			}
		},

		'.news-item': {
			'display': 'block',
			'height': '100%',
			'margin': '0 0 64px',
			'text-decoration': 'none',

			'&:hover': {
				'.news-item__img': {
					'transform': `scale(${FX.scale.hover})`,
					'transition-duration': FX.transSpeedFast,
					'box-shadow': FX.shadowHover
				},
				'.news-item__title': {
					'.h4-style': {
						'transition-duration': FX.speed.fast,
						'color': COLOR.primary
					}
				}
			},

			'&:active:hover': {
				'.news-item__img': {
					'transform': 'scale(1)',
					'transition-duration': FX.transSpeedFast,
					'box-shadow': FX.shadow.default
				},
				'.news-item__title': {
					'.h4-style': {
						'transition-duration': FX.speed.fast,
						'color': COLOR.dark
					}
				}
			},

			'.news-item__img': {
				'display': 'block',
				'position': 'relative',
				'width': '100%',
				'margin': '0 0 10px',
				'height': '0',
				'padding': '0 0 75%',
				'overflow': 'hidden',
				'transition-duration': FX.transSpeedFast,
				'box-shadow': FX.shadowDefault,
				'border-radius': '12px',

				'img': {
					'position': 'absolute',
					'left': '50%',
					'top': '50%',
					'transform': 'translate(-50%, -50%)',
					'height': '100%',
					'width': 'auto'
				}
			},
			'.news-item-link-text': {
				'h4': {
					'color': COLOR.dark,
					'transition-duration': FX.transSpeedFast,
					'text-decoration': 'none',
					'&:hover': {
						'transition-duration': FX.transSpeedFast,
						'color': COLOR.primary,
						'text-decoration': 'underline'
					}
				}
			},
			'bmp-anchor': {
				'display': 'block',
				'a': {
					'text-decoration': 'none'
				}
			}
		},

		'@media (max-width: 839px)': {
			'.news-filter__button': {
				'width': '120px',
				'font-size': '20px',
				'height': '60px',
				'line-height': '60px'
			},
			'.news-item-main__descr': {
				'padding': '0 0 34px'
			}
		},

		'@media (max-width: 479px)': {
			'.news-list-page': {
				'.show-more-btn-warpper': {
					'padding-bottom': '50px'
				}
			},
			'.news-item': {
				'margin': '0 0 34px'
			},
			'.news-item__title': {
				'.h4-style': {
					'min-height': 'auto',
					'margin': '0 0 10px'
				}
			},
			'.news-item__date': {
				'margin': '0 0 10px'
			},
			'.news-top__descr': {
				'margin': '0 0 34px'
			},
			'.news-top__type': {
				'margin': '0'
			},
			'.news-filter__button': {
				'width': '50%'
			}
		}

	};

	class PressStore {
		constructor() {
			this.data = {
				blog: [],
				news: [],
				blogmain: [],
				newsmain: [],
				currentType: null,
				currentPosition: 0
			};
		}

		get blog() {
			return this.data.news;
		}

		get news() {
			return this.data.blog;
		}

		get blogmain() {
			return this.data.blogmain;
		}

		get newsmain() {
			return this.data.newsmain;
		}

		get currentType() {
			return this.data.currentType;
		}

		get currentPosition() {
			return this.data.currentPosition;
		}

		get() {
			this.observable = observe({ data: this.data }, data => {
				return data;
			});
			return this.observable;
		}
	}

	const pressStore = new PressStore();

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const graphSchemeQuery = ({ ctx, cursor = "" } = {}) => {
		switch (ctx.type) {
			case 'blog':
				return `articles: BlogPosts (first: ${cursor === '' ? 10 : 9}, after: "${cursor}", inFeed: true) {
				pageInfo { startCursor endCursor hasPreviousPage hasNextPage }
				edges {
					node { type slug updatedAt pageTitle description pageDescription contentPreview published image hq sq lq  }
				}
			} `;
			case 'news':
				return `articles: NewsPressPosts(first: ${cursor === '' ? 10 : 9}, after: "${cursor}") {
					pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
					edges {
						node {
							... on PressReleaseNode { title description url image content published updatedAt
								source { name logo }
							}
							... on BlogNewNode { title description url image content published updatedAt
								source { name logo }
							}
							type: __typename
						}
					}
				} `;
		}
	};

	let bmpCssComponent$52 = instance.define({
		name: 'jet-news-list', cssjs: cssjs$37
	});

	class JetsmNewsList extends BMPVDWebComponent {

		constructor() {
			super();
			this.pressStore = pressStore;
		}

		static async getUrlConf() {
			const resource = await resourceStorageInstance.graphRequest(`
				articles: BlogPosts {
					edges { node { slug } }
				}
			`);
			return resource.data.articles.edges.map(post => `/blog/${post.node.slug}/`);
		}

		currentForReady() {
			if (this.pressStore.get().data.currentType === null) {
				if (getUrlParams('type') !== false) {
					return getUrlParams('type');
				} else {
					return 'news';
				}
			} else {
				return this.pressStore.get().data.currentType;
			}
		}

		handleScroll() {
			this.jetFooterHeight = document.querySelector('jet-footer').offsetHeight;
			if (window.pageYOffset >= this.listWrapper.offsetTop + window.innerHeight) this.arrowContainer.classList.add('is-visible');else this.arrowContainer.classList.remove('is-visible');
			if (window.pageYOffset >= document.body.scrollHeight - document.documentElement.clientHeight - this.jetFooterHeight) this.arrowContainer.style.position = 'absolute';else this.arrowContainer.style.position = 'fixed';
		}

		disconnectedCallback() {
			window.removeEventListener('scroll', this.refHandleScroll);
		}

		async onAttached() {
			await this.loadData(this.context.type);
			this.arrowContainer = this.querySelector('.news-arrow-container');
			this.listWrapper = this.querySelector('.news-list-wrapper');
			this.refHandleScroll = this.handleScroll.bind(this);
			window.addEventListener('scroll', this.refHandleScroll);
			window.scrollTo(0, this.pressStore.get().data.currentPosition);
		}

		handleButtonTop() {
			smoothScroll({ element: '.page-content', duration: 500, slack: 50 });
		}

		ready() {
			bmpCssComponent$52.attachStyles(this);
			this.context = this.observe({
				pending: true,
				hasNext: true,
				loadMorePending: false,
				blog: [],
				news: [],
				blogmain: [],
				newsmain: [],
				type: window.location.pathname.match(/news/i) !== null ? window.location.pathname.match(/news/i)[0] : window.location.pathname.match(/blog/i) !== null ? window.location.pathname.match(/blog/i)[0] : window.location.pathname.replace(/\//g, '')
			});
		}

		async handleFilter(e) {
			const router = document.querySelector('bmp-router');
			this.pressStore.get().data.currentType = e.target.getAttribute('to');
			this.pressStore.get().data.currentPosition = 0;
			await this.loadData(this.context.type);
			router.go(`/${this.pressStore.get().data.currentType}/`);
		}

		async createMain(data, typeName) {
			if (typeName === 'news') {
				this.pressStore.get().data['newsmain'] = data.articles.edges.splice(0, 1)[0];
			}
			if (typeName === 'blog') {
				this.pressStore.get().data['blogmain'] = data.articles.edges.splice(0, 1)[0];
			}
		}

		async loadMore() {
			this.context.loadMorePending = true;
			let currentType = this.pressStore.get().data['currentType'] || this.context.type;

			const { data } = await resourceStorageInstance.graphRequest(graphSchemeQuery({
				ctx: this.context,
				cursor: this.pressStore.get().data[currentType].articles ? this.pressStore.get().data[currentType].articles.pageInfo.endCursor : ""
			}));
			this.pressStore.get().data[currentType].articles.edges.push(...data.articles.edges);
			this.pressStore.get().data[currentType].articles.pageInfo = data.articles.pageInfo;
			this.context.loadMorePending = false;
		}

		async loadData(typeName) {
			this.context.pending = true;

			if (!this.pressStore.get().data[typeName].articles) {
				const { data } = await resourceStorageInstance.graphRequest(graphSchemeQuery({
					ctx: this.context,
					cursor: this.pressStore.get().data[typeName].articles ? this.pressStore.get().data[typeName].articles.pageInfo.endCursor : ""
				}));
				await this.createMain(data, typeName);
				// this.context[typeName] = data
				this.pressStore.get().data[typeName] = data;
				this.pressStore.get().data.currentType = typeName;
			}

			setTimeout(() => this.context.pending = false, 10);
		}

		handleNewsClick(e) {
			e.preventDefault();
			const router = document.querySelector('bmp-router');
			this.pressStore.get().data.currentPosition = window.pageYOffset;
			let link = e.currentTarget.getAttribute('href');
			router.go(link);
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view$2.list(this.context, this.handleFilter.bind(this), this.loadMore.bind(this), this.handleButtonTop.bind(this), this.pressStore.get().data, this.handleNewsClick.bind(this))
			});
		}

	}

	if (!customElements.get('jetsm-news-list')) customElements.define('jetsm-news-list', JetsmNewsList);

	const cssjs$38 = {
		'display': 'block',

		'.carrer-filters': {
			'display': 'flex',
			'flex-wrap': 'wrap',
			'margin': '0 0 70px'
		},

		'.carrer-filters-item': {
			'width': '110px',
			'display': 'block',
			'height': '28px',
			'background-color': `${COLOR.primary}`,
			'line-height': '28px',
			'text-align': 'center',
			'border-radius': '6px',
			'border': `1px solid ${COLOR.primary}`,
			'font-family': "Roboto",
			'text-decoration': 'none',
			'color': `${COLOR.white}`,
			'font-size': '13px',
			'margin-right': '10px',

			'&.active': {
				'background-color': `${COLOR.white}`,
				'color': `${COLOR.dark}`
			}
		},

		'@media (max-width: 480px)': {
			// 'margin-bottom': '40px',
			'.carrer-filters': {

				'bmp-anchor': {
					display: 'block',
					width: '100%'
				}
			},
			'.carrer-filters-item': {

				width: '100%',
				margin: '0 0 10px',
				display: 'block'
			}
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$3 = {

		list(context) {

			return ME.container({
				mod: { className: 'page-content career-page' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 64px;`, 'Careers'), text(`color: ${COLOR.dark}; margin: 0 0 55px;`, 'Maybe you want to transform the way people travel. Maybe you’re driven to be part of something powerful. Whatever piques your curiosity most about work life at JetSmarter, we’re glad our paths have crossed here.'))]
					}), !context.pending && !context.list.length ? h3(`color: ${COLOR.primary};text-align: center;`, 'No open jobs at this moment') : ME.container({
						children: [ME.layout.grid({
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement("div", { "class": `inline preloader ${context.pending ? '' : 'hidden'}`, safeHTML: svgIcon.preloader() }), BMPVD.createBMPVirtulaDOMElement(
								"div",
								{ className: "carrer-filters" },
								context.filters.map(item => BMPVD.createBMPVirtulaDOMElement(
									"bmp-anchor",
									null,
									BMPVD.createBMPVirtulaDOMElement(
										"a",
										{ className: `carrer-filters-item ${context.selectedFilter == item.toLowerCase() ? 'active' : ''}`,
											href: `/career/${item == 'All' ? '' : `?filter=${item}`}` },
										item
									)
								))
							))]
						}), ME.layout.grid({
							children: context.list.map(({ department, city, title, url }) => {
								return ME.layout.cell({ common: 4 }, BMPVD.createBMPVirtulaDOMElement(
									"a",
									{ href: url, rel: "noopener", target: "_blank", style: "text-decoration: none;" },
									h5(`color: ${COLOR.primary}; font-weight: 400; font-family: "Gotham"; margin-bottom: 5px;`, department),
									h6(`color: ${COLOR.dark}; font-weight: 200; margin: 0 0 30px; font-family: "Gotham";`, city),
									h4(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 90px; font-family: "Gotham";`, title)
								));
							})
						})]
					}))]
				})]
			});
		}
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const router = document.querySelector('bmp-router');
	const bmpCssComponent$53 = instance.define({
		name: 'jet-career', cssjs: cssjs$38
	});

	class JetsmCareer extends BMPVDWebComponent {
		constructor() {
			super();
		}

		disconnectedCallback() {

			window.removeEventListener('popstate', this.refFilter, false);
		}

		ready() {
			bmpCssComponent$53.attachStyles(this);
			this.context = this.observe({
				list: [],
				filters: [],
				pending: true,
				selectedFilter: 'all'
			});
			this.refFilter = this.filterResult.bind(this);
			window.addEventListener('popstate', this.refFilter, false);
		}

		async onAttached() {
			await this.loadData();
		}

		async loadData() {
			// this.context.pending = true
			let rn = `RN(name='career').f(published=True)`;
			this.result = await resourceStorageInstance.getRN(rn);
			this.context.list = this.result.data;

			const filters = this.result.data.map(el => el.country).filter((country, i, arr) => arr.indexOf(country) == i); // only unique

			this.context.filters = ['All', ...(filters.length > 1 ? filters : {})];

			this.filterResult();
			this.context.pending = false;
		}

		filterResult() {
			let urlCountry = getUrlParams('filter');

			if (!urlCountry || urlCountry == 'all') {
				this.context.selectedFilter = 'all';
				this.context.list = this.result.data;
			} else if (urlCountry > '') {
				this.context.selectedFilter = decodeURIComponent(urlCountry).toLowerCase();
				this.context.list = this.result.data.filter(el => el.country.toLowerCase() == this.context.selectedFilter);
			}
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null),
				body: view$3.list(this.context)
			});
		}

	}

	if (!customElements.get('jetsm-career')) customElements.define('jetsm-career', JetsmCareer);

	const fleetJets = [
	// {
	// 	title: "Entry-level jet (VLJ)",
	// 	description: "This category is perfect to access small airports with shorter runways. Carrying 4-5 passengers and equipped with minimal amenities, entry-level jets are a great choice for shorter flights under 750 miles. The maximum takeoff carry weight is typically under 10,000 pounds."
	// },
	{
		title: 'VIP airliner',
		description: 'VIP airliners provide the most considerable amount of space and amenities of all Airbus & Boeing Aircraft families, featuring customized interiors, usually including a private bedroom. Usually used by sports teams or VIP travel, they can comfortably carry from 19 to over a hundred passengers on ranges up to 5,500 - 7,500 miles.',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/vip-jet.svg',
		columns: [[{ name: 'Airbus 319' }, { name: 'Boeing 737-500' }, { name: 'Dornier 328' }]]
	},
	// {
	// 	title: "Airliner",
	// 	description: "Airliners remove the hassle of transporting large groups, typically seating over 100 passengers on ranges between 2,000 and 4,000 miles."
	// },
	// {
	// 	title: "Ultra-long range",
	// 	description: "Ultra-long range aircrafts are designed explicitly for flights over 12 hours. Typically carrying from 8 to 19 passengers they make an excellent choice for non-stop intercontinental travel in medium size groups. They are the newest category of aircraft to enter the marketplace."
	// },
	{
		title: 'Heavy Jets',
		description: "Similar in capabilities to large commercial aircrafts, heavy jets are the preferred mode of travel on intercontinental flights. Aircraft in this category can comfortably carry 8-18 passengers, with ranges varying from 2,000 to over 4,000 miles, up to approximately 4 to 10 hours of flight time.",
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/heavy-jets.svg',
		columns: [[{ name: 'Challenger 601' }, { name: 'Challenger 604' }, { name: 'Challenger 605' }, { name: 'Challenger 850' }, { name: 'Global 5000' }, { name: 'Global 6000' }, { name: 'Global 7000' }, { name: 'Global Express/XRS' }], [{ name: 'Falcon 2000' }, { name: 'Falcon 2000EX' }, { name: 'Falcon 2000LX' }, { name: 'Falcon 7X' }, { name: 'Falcon 8X' }, { name: 'Falcon 900' }, { name: 'Falcon 900EX' }, { name: 'G III' }], [{ name: 'G IV' }, { name: 'G IV-SP' }, { name: 'G V' }, { name: 'G-350' }, { name: 'G-400' }, { name: 'G-450' }, { name: 'G-500' }, { name: 'G-550' }], [{ name: 'G-650ER' }, { name: 'G-650' }, { name: 'Legacy 600' }, { name: 'Legacy 650' }, { name: 'Lineage 1000' }, { name: 'Boeing BBJ' }, { name: 'Airbus ACJ' }, { name: 'Embraer 135' }]]
	}, {
		title: 'Super Midsize Jets',
		description: "Super mid-size jets are the ultimate cost-effective choice for longer flights as they are equipped with most amenities and accommodating passengers and luggage comfortably.<br><br/>They can typically accommodate 8-10 passengers on distances of 2,000 - 2,500 miles non-stop.",
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/super-midsize-jets.svg',
		columns: [[{ name: 'Challenger 300' }, { name: 'Challenger 350' }, { name: 'Citation Latitude' }, { name: 'Citation Sovereign+' }, { name: 'Citation Sovereign' }, { name: 'Citation X+' }, { name: 'Citation X' }, { name: 'Falcon 50' }], [{ name: 'Falcon 50EX' }, { name: 'G-200' }, { name: 'G-280' }, { name: 'Hawker 1000' }, { name: 'Hawker 4000' }, { name: 'Legacy 450' }, { name: 'Legacy 500' }]]
	}, {
		title: 'Midsize Jets ',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/midsize-jets.svg',
		description: "Mid-size aircrafts enable comfortable travel for longer flights of up to 4 hours non-stop. All models within the class are equipped with lavatories and often times with a divan. Mid-size jets can typically accommodate 5-9 passengers on distances of 1,500 - 2,000 miles non-stop.",
		columns: [[{ name: 'Citation Excel' }, { name: 'Citation III' }, { name: 'Citation VI' }, { name: 'Citation VII' }, { name: 'Citation XLS+' }, { name: 'Citation XLS' }, { name: 'Falcon 20' }, { name: 'G-100' }], [{ name: 'G-150' }, { name: 'Hawker 700A' }, { name: 'Hawker 800' }, { name: 'Hawker 800XP' }, { name: 'Hawker 900XP' }, { name: 'Learjet 60' }]]
	}, {
		title: 'Light Jets',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/light-jets.svg',
		description: "Light business jets can typically seat 5-6 passengers comfortably and are often equipped with reclining seats and air conditioning. They are best for short-range trips - up to about 1,000 miles non-stop or about 1 – 2 hours contingent on the number of passengers and weight on board.",
		columns: [[{ name: 'Beechjet 400' }, { name: 'Citation Bravo' }, { name: 'Citation CJ1+' }, { name: 'Citation CJ1' }, { name: 'Citation CJ2+' }, { name: 'Citation CJ2' }, { name: 'Citation CJ3' }, { name: 'Citation CJ4' }], [{ name: 'Citation Encore' }, { name: 'Citation Encore+' }, { name: 'Citation II / IISP' }, { name: 'Citation I / ISP' }, { name: 'Citation Jet' }, { name: 'Citation Mustang' }, { name: 'Citation S/II' }, { name: 'Citation Ultra' }], [{ name: 'Citation V' }, { name: 'Citation M2' }, { name: 'Falcon 10' }, { name: 'Hawker 400XP' }, { name: 'Honda Jet' }, { name: 'Learjet 35A' }, { name: 'Learjet 40/XR' }, { name: 'Learjet 45/XR' }], [{ name: 'Learjet 55' }, { name: 'Phenom 100' }, { name: 'Phenom 300' }, { name: 'Premier I' }]]
	},
	// {
	// 	title: 'Super Light Jets',
	// 	description: "Light business jets can typically seat 5-6 passengers comfortably and are often equipped with reclining seats and air conditioning. They are best for short-range trips - up to about 1,000 miles non-stop or about 1 – 2 hours contingent on the number of passengers and weight on board.",
	// },
	{
		title: 'Turboprop',
		description: 'Turboprops are most efficient in low altitudes and speeds under 450 mph which make them a cost-effective option for flights under two hours and landings at airports with short runways.',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/turboprop.svg',
		columns: [[{ name: 'Caravan' }, { name: 'King Air 90' }, { name: 'King Air 200' }, { name: 'King Air 250' }, { name: 'King Air 350' }, { name: 'PC-12' }]]
	}, {
		title: 'Entry-level jet',
		description: 'This category is perfect to access small airports with shorter runways. Carrying 4-5 passengers and equipped with minimal amenities, entry-level jets are a great choice for shorter flights under 750 miles. The maximum takeoff carry weight is typically under 10,000 pounds.',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/jets/entry-level-jet.svg',
		columns: [[{ name: 'Mustang' }, { name: 'Citation Mustang' }, { name: 'Phenom 100E' }, { name: 'Citation M2' }, { name: 'Citation CJ1' }]]
	}];

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$4 = () => ME.container({
		mod: { className: 'page-content page-fleet' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; font-family: Gotham; margin: 0 0 34px; font-weight: 400;`, 'Fleet'), text(`color: ${COLOR.dark}; margin: 0 0 64px; font-weight: 400;`, 'A level above first-class'), text(`color: ${COLOR.dark}; margin: 0 0 64px;`, BMPVD.createBMPVirtulaDOMElement(
					'span',
					null,
					'In addition to partnering with world-class ',
					BMPVD.createBMPVirtulaDOMElement(
						'span',
						{ style: `color: ${COLOR.primary}` },
						'private jet operators'
					),
					', we\u2019ve formed our own fleet of ',
					BMPVD.createBMPVirtulaDOMElement(
						'span',
						{ style: 'white-space: nowrap;' },
						'fully-dedicated'
					),
					' and ',
					BMPVD.createBMPVirtulaDOMElement(
						'span',
						{ style: 'white-space: nowrap;' },
						'JetSmarter-branded'
					),
					' Gulfstream IV-SP aircraft. Equipped with new interiors, five-star crews, and 4G Wi-Fi to deliver an unmatched level of luxury in air travel. Passengers also enjoy gourmet catering and in-flight cocktail service, courtesy of JetSmarter. Our dedicated fleet carry ARG/US Platinum, Wyvern Wingman, and IS-BAO Stage 3 safety ratings.'
				)))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 6, tablet: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement('img', { style: 'max-width: 100%; display: block;', src: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/img-1.jpg', alt: '' })
				)), ME.layout.cell({ common: 6, tablet: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement('img', { style: 'max-width: 100%; display: block;', src: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/img-2.jpg', alt: '' })
				))]
			}), BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'fleet-logos' },
				ME.layout.grid({
					children: [ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fleet-logo' },
						BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/is-bao.png', alt: 'is-bao' })
					)), ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fleet-logo' },
						BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/argus.png', alt: 'argus' })
					)), ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fleet-logo' },
						BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/wingman.png', alt: 'wingman' })
					))]
				})
			), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, text(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 34px; text-align: center;`, 'Add your aircraft to our dedicated fleet:'), linkButtonPrimary$1('', BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '/owners/', style: `display: block; margin: auto; text-decoration: none;` },
						'Join our owner program'
					)
				)))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 76px 0 34px;`, 'Preferred Partner Aircraft'), h4(`color: ${COLOR.dark}; margin: 0 0 0; font-weight: 400`, 'Access 3,000+ aircraft', BMPVD.createBMPVirtulaDOMElement('br', null)), text(`color: ${COLOR.dark}; margin: 0 0 64px;`, BMPVD.createBMPVirtulaDOMElement('br', null), 'Because we partner with private air carriers across the globe, the aircraft options are virtually limitless. Only operators’ whose aircraft and pilots meet our top safety and security standards make it into our preferred network.'))]
			}), ...fleetJets.map(jet => {
				return ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'fleet-list-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 3, tablet: 3, phone: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: jet.image, className: 'fleet-plane-icon', alt: jet.title })), ME.layout.cell({ common: 9, tablet: 9, phone: 12 }, ME.layout.grid({
								mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
								children: [ME.layout.cell({ common: 12 }, h4(`color: ${COLOR.dark}; font-weight: 500; margin: 0 0 14px;`, jet.title), h6(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 14px;`, jet.description)), ...(jet.columns || []).map(el => ME.layout.cell({ common: 3, tablet: 3, phone: 12 }, ...el.map(item => h6(`color: ${COLOR.dark}; font-weight: 200;`, item.name))))]
							}))]
						})
					))]
				});
			}))]
		})]
	});

	const boardMembersModel = [{
		name: 'Sergey Petrossov',
		link: 'sergey-petrossov',
		post: 'JetSmarter CEO',
		image: 'https://jetsmarter.com/data/site-v4/images/about/sergey_petrossov.jpg',
		description: 'Sergey founded JetSmarter in 2012 and currently serves as its CEO.',
		detail: [{
			content: ['Awarded Forbes 30 Under 30 in Consumer Technology and South Florida’s Top Working Professional by the Sun Suntinel Sergey Petrossov is always seeking ways to innovate industries.', 'Prior to JetSmarter, he co-founded two IT projects: an online chat system for website customer service and a distance-learning platform for Russian-speaking educational institutions. He also served as a board advisor to a South Florida-based private jet operator that, at the time, had the world’s largest on-demand Gulfstream charter fleet.', 'When Petrossov flew private for the first time he immediately identified challenges with the antiquated, brick-and-mortar approach to booking charter flights. Mobile marketplaces were on the rise, and he felt certain that the cumbersome private aviation booking process could be solved with technology – thus, the idea for JetSmarter was born.', 'After gathering his development team from previous projects and investing his own capital, Petrossov began the planning phase for an app that could connect flyers with top-rated private jet operators. The beta-version of JetSmarter launched in August 2012 as a proof of concept for select users. After raising additional funding and collaborating with hundreds of vendors and partners, Petrossov officially launched the JetSmarter app to the public in March 2013.', 'JetSmarter’s skillful technology, management, and advisory teams – many of whom are credited with successful project execution for NASA, Nokia, Microsoft, Mercedes Benz, BMW, Uber – bring a combined experience of more than 100 years in technology, private air travel and logistics to the table. It is their unceasing hard work combined with Petrossov’s vision that gave birth to the groundbreaking app JetSmarter is today.'],
			social: [{
				link: 'https://www.linkedin.com/in/spetrossov/',
				icon: 'https://jetsmarter.com/data/site-v5/images/icons/linkedin.svg',
				hashtag: '@spetrossov'
			}, {
				link: 'https://twitter.com/spetrossov',
				icon: 'https://jetsmarter.com/data/site-v5/images/icons/twitter.svg',
				hashtag: '@spetrossov'
			}, {
				link: 'https://www.instagram.com/sergey/',
				icon: 'https://jetsmarter.com/data/site-v5/images/icons/instagram.svg',
				hashtag: '@sergey'
			}]
		}]
	}, {
		name: 'Behdad Eghbali',
		link: 'behdad-eghbali',
		image: 'https://jetsmarter.com/data/site-v4/images/about/behdad-eghbali.jpg',
		description: 'Behdad Eghbali is the managing partner of Clearlake Capital Group LP, which he cofounded in 2006.',
		detail: [{
			content: ['Behdad Eghbali is the managing partner of Clearlake Capital Group LP, which he cofounded in 2006. Clearlake currently has approximately $4 billion of assets under management, and its senior investment principals have led or co-led more than 90 investments. Using a sector-focused approach, Clearlake seeks to partner with world-class management teams by providing patient, long-term capital to dynamic businesses that can benefit from Clearlake\'s operational transformation approach. The firm\'s core target sectors are software and technology-enabled services, industrials and energy, and consumers.'],
			social: []
		}]
	}, {
		name: 'José E. Feliciano',
		link: 'jose-e-feliciano',
		image: 'https://jetsmarter.com/data/site-v4/images/about/jose-feliciano_.jpg',
		description: 'José E. Feliciano is the managing partner of Clearlake Capital Group LP, which he cofounded in 2006.',
		detail: [{
			content: ['José E. Feliciano is the managing partner of Clearlake Capital Group LP, which he cofounded in 2006. Clearlake currently has approximately $4 billion of assets under management, and its senior investment principals have led or co-led more than 90 investments. Using a sector-focused approach, Clearlake seeks to partner with world-class management teams by providing patient, long-term capital to dynamic businesses that can benefit from Clearlake\'s operational transformation approach. The firm\'s core target sectors are software and technology-enabled services, industrials and energy, and consumers.'],
			social: []
		}]
	}, {
		name: 'Tom Ridge',
		link: 'tom-ridge',
		image: 'https://jetsmarter.com/data/site-v4/images/about/top-rigde.jpg',
		description: 'Tom Ridge was the first Secretary of the U.S. Department of Homeland Security and the former Governor of Pennsylvania. He now serves as Chairman of Ridge Global.',
		detail: [{
			content: ['Tom Ridge is Chairman of Ridge Global. He provides clients with solutions to cyber security, international security, and risk management issues.', 'Following the tragic events of September 11th, 2001, Tom Ridge became the first Assistant to the President for Homeland Security and, on January 24, 2003, became the first Secretary of the U.S. Department of Homeland Security. The creation of the country\'s 15th Cabinet Department marked the largest reorganization of government since the Truman administration and another call to service for the former soldier, congressman, and governor of Pennsylvania.', 'During his DHS tenure, Secretary Ridge worked with more than 180,000 employees from a combined 22 agencies to create an agency that facilitated the flow of people and goods, instituted layered security at air, land, and seaports, developed a unified national response and recovery plan, protected critical infrastructure, integrated new technology, and improved information sharing worldwide. Ridge served as Secretary of this historic and critical endeavor until February 1, 2005.', 'Before the events of September 11th, Ridge was twice elected Governor of Pennsylvania. He served as the state\'s 43rd governor from 1995 to 2001. Governor Ridge\'s aggressive technology strategy helped fuel the state\'s advances in economic development, education, health care, and the environment.', 'He serves on the boards of the Institute for Defense Analyses, the Center for the Study of the Presidency and Congress, Chairman of the National Organization on Disability, and other private and public entities. He currently serves as Chairman of the United States Vietnam War 50th Commemoration Advisory Committee and Chairman of the U.S. Chamber of Commerce\'s National Security Task Force.', 'He graduated from Harvard with honors. After his first year at Penn State University\'s Dickinson School of Law, he was drafted into the U.S. Army, where he served as an infantry staff sergeant in Vietnam, earning the Bronze Star for Valor, the Combat Infantry Badge, and the Vietnamese Cross of Gallantry.', 'After returning to Pennsylvania and to Dickinson, he earned his law degree and, later, became one of the first Vietnam combat veterans elected to the U.S. House of Representatives, where he served six terms.'],
			social: []
		}]
	}, {
		name: 'Christophe Navarre',
		link: 'christophe-navarre',
		image: 'https://jetsmarter.com/data/site-v4/images/about/beau_v.jpg',
		description: 'As former CEO of Moët-Hennessy, Christophe Navarre managed prestigious champagne brands such as Moët & Chandon, Dom Pérignon, and Veuve Clicquot, as well as Hennessy, Glenmorangie, and Ardberg Scotch whiskies, Belvedere vodka, and many other top labels.',
		detail: [{
			content: ['Christophe Navarre was born in Belgium and earned a degree in Business Administration from Liege University before joining the Continental Bank in 1980. He later moved to Exxon where he first held Marketing and Sales responsibilities with the Esso Group.', 'In 1989, he joined Interbrew where he successfully headed a number of subsidiaries while developing a strategy based on the promotion of premium brands and the launch of ultra innovative products. Starting as Managing Director of Brasseries Bellevue, he later became Chief Financial Officer of Interbrew Belgium, then President of Interbrew Italy before being appointed as the head of the French subsidiary in 1995.', 'Navarre joined the LVMH Group in 1997 as President and CEO of JAS Hennessy & Co where he was deeply involved in restructuring the company, while securing its leading position in the cognac industry.', 'In May 2001, he was appointed CEO of Moët-Hennessy, the Wine and Spirits division of LVMH, the world’s leading luxury good company. He managed the prestigious champagne brands Moët & Chandon, Dom Pérignon, Mercier, Veuve Clicquot, Ruinart and Krug as well as Hennessy, Glenmorangie, and Ardbeg Scotch whiskies, Belvedere vodka and several wines of the New World.', 'Among his various achievements, Navarre completed the European Marketing course at INSEAD in Fontainebleau. The father of four children, he finds solace in family life, golf, and motor sports, while cultivating an entrepreneurial spirit with real passion.', 'He was named Officier de la Légion d\'Honneur, Commandeur de l’Ordre du Mérite Agricole, Commandeur de l’Ordre de Léopold II, and Officier de l’Ordre de la Couronne. Among his other official positions, Navarre serves as a Board Member of the Comité Colbert, a member of the HEINEKEN Supervisory Board, and as Chairman of Vinexpo.'],
			social: []
		}]
	}];

	const cssjs$39 = {

		'font-family': 'Gotham, sans-serif',
		'opacity': '0',
		'transition-duration': '0.5s',
		'transition-property': 'opacity',
		'transition-delay': '.1s',
		'position': 'relative',
		'text-align': 'center',
		'display': 'none',
		'z-index': '8',

		'display': 'block',
		'position': 'fixed',
		'top': 0,
		'left': 0,
		'right': 0,
		'bottom': 0,
		'width': '100%',
		'height': '100%',

		'-webkit-transition': 'opacity 0.3s,visibility 0.3s',
		'transition': 'opacity 0.3s,visibility 0.3s',
		'visibility': 'hidden',
		'opacity': '0',
		'background': '#E5E0D8',
		'&.fullscreen': {
			'.video_controlls__full-screen': {
				'width': '100%',
				'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/ui-icon/exit-fullscreen.svg")'
			}
		},
		'&.showed': {
			'visibility': 'visible',
			'opacity': '1'
		},
		'.btn-close': {
			overflow: 'hidden',
			'position': 'absolute',
			'top': '20px',
			'right': '20px',
			'width': '70px',
			'height': '70px',
			'transition-duration': '0.3s',
			'z-index': '2',
			'border-radius': '5px',
			'background': `${COLOR.primary}`,
			svg: {
				display: 'block',
				width: '100%',
				height: '100%'
			}
		},
		'.video-player': {
			width: '100%',
			height: '100%'
		},
		video: {
			'min-height': '100%',
			'min-width': '100%',
			'position': 'absolute',
			'left': '50%',
			'top': '50%',
			'-moz-transform': 'translate3d(-50%, -50%, 0)',
			'-o-transform': 'translate3d(-50%, -50%, 0)',
			'-ms-transform': 'translate3d(-50%, -50%, 0)',
			'-webkit-transform': 'translate3d(-50%, -50%, 0)',
			'transform': 'translate3d(-50%, -50%, 0)'
		},

		button: {
			'cursor': 'pointer',
			'outline': 'none',
			'padding': '0',
			'border': '0',
			'background': 'transparent',
			'height': '70px'
		},
		'.video_controlls__full-screen': {
			'width': '100%',
			'background-image': 'url("https://jetsmarter.com/data/site-v5/assets/ui-icon/fullscreen.svg")'
		},
		'.video_buttons__secondary': {
			height: '70px'
		},
		'.video_container__play': {
			'position': 'absolute',
			'top': '0',
			'left': '0',
			'right': '0',
			'bottom': '0',
			'margin': 'auto',
			'width': '5em',
			'height': '5em',
			'display': 'none',
			'& > *': {
				'width': '100%',
				'height': '100%'
			},
			'.video-pause-path': {
				display: 'none'
			}
		},
		'&[close-ctrl="true"] .video_close': {
			'display': 'inline-block'
		},
		'.video_buttons': {
			height: '70px'
		},
		'.video_controls': {
			'width': '100%',
			'opacity': '0',
			'transition-duration': '0.3s',
			'position': 'absolute',
			'bottom': '0',
			'left': '0',
			'padding': '0',
			'@media (max-width: 700px)': {
				'padding': '20px'
			},
			'table': {
				'border-collapse': 'collapse',
				'table-layout': 'fixed'
			},
			'.video_buttons__wrapp': {
				'width': '110px',
				height: '110px',
				padding: '20px',
				'@media (max-width: 700px)': {
					'width': '40px'
				}
			},
			'.video_buttons__secondaty__wrapp': {
				'width': '110px',
				height: '110px',
				padding: '20px',
				'@media (max-width: 700px)': {
					'width': '40px'
				}
			},
			td: {
				'height': '70px',
				'padding': '0',
				'vertical-align': 'middle',
				'@media (max-width: 700px)': {
					height: '40px'
				}
			}
		},
		'.video_timeline': {
			'width': '100%',
			'height': '70px',
			'background': 'rgba(68, 66, 62, 0.4)',
			'border-radius': '5px',
			overflow: 'hidden',
			position: 'relative',
			'.video_progress': {
				height: '100%'
			},
			'.video_progress__bar': {
				'background': 'rgba(68, 66, 62, 0.6)',
				position: 'relative',
				height: '100%',
				'.video_progress__bullet': {
					position: 'absolute',
					height: '100%',
					right: 0,
					top: 0,
					width: '2px',
					background: COLOR.white

				}
			},
			'.video_timeline__time': {
				'.video_timeline__time__current': {
					display: 'none'
				},
				'.video_timeline__time__duration': {
					display: 'none'
				},
				'.video_timeline__time__left': {
					position: 'absolute',
					right: '16px',
					top: '8px',
					opacity: 0.5,
					font: '300 48px Roboto',
					color: COLOR.white,
					'.timeleft__spot__1': {
						display: 'inline-block'
					},
					'.timeleft__spot__2': {
						display: 'inline-block'
					}
				}
			}
		},
		'.video_video': {
			'background-position': '50% 0%',
			'background-size': 'cover',
			'background-color': '#fff',
			'background-repeat': 'no-repeat',
			'position': 'relative'
		},
		// '&.video_initial.video_ready': {
		// 	'.video_container__play': {
		// 		'display': 'block',
		// 	},
		// 	'video': {
		// 		'opacity': '0',
		// 	}
		// },
		'&.video_playing': {
			'.video_inner': {
				background: 'transparent'
			},
			'.video_controls': {
				opacity: 1
			},
			video: {
				opacity: 1
			},
			'.video_controls': {
				'.video-pause-path': {
					opacity: 1
				},
				'.video-play-path': {
					opacity: 0
				}
			}
		},
		'&.video_paused': {
			'.video_inner': {
				background: 'transparent'
			},
			'.video_controls': {
				opacity: 1
			},
			'.video_controls': {
				'.video-pause-path': {
					opacity: 0
				},
				'.video-play-play': {
					opacity: 1
				}
			}
		}
	};

	const defaultPlayBtn = `
		<svg data-name="video-play-pause-btn" width="70px" height="70px" viewBox="0 0 70 70" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
				<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
						<rect fill="#FE6A57" x="0" y="0" width="70" height="70" rx="6"></rect>
						<path class="video-play-path" d="M26.0384615,21.043538 L26.0384615,49.2641543 L49.2196821,35.1538462 L26.0384615,21.043538 Z" stroke="#FFFFFF"></path>
						<g class="video-pause-path" transform="translate(29.000000, 21.00000)" stroke="#FFFFFF" stroke-width="1" fill="none" fill-rule="evenodd">
								<path d="M0,0 L0,28 L0,0 Z"></path>
								<path d="M13,0 L13,28 L13,0 Z"></path>
						</g>
				</g>
		</svg>
	`;

	const circleBtn = `
	<svg version="1.1" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-992 738 62 62" enable-background="new -992 738 62 62" xml:space="preserve">
		<circle id="Oval-184" fill="none" stroke="#FE6A57" cx="-961" cy="769" r="30" stroke-width="2px"></circle>
		<path id="Path-373" fill="none" stroke="#FE6A57" stroke-linejoin="bevel" d="M-971,769v16l28-16l-28-16V769z" stroke-width="2px"></path>
	</svg>
	`;

	// export const defaultCloseBtn = `
	// <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
	// 	<path id="9c00a128-fdb3-44fd-b359-495afa8e22b1" class="video-close-path" d="M0,40H40V0H0V40ZM27.07,11.51l1.41,1.41L21.41,20l7.07,7.07-1.41,1.41L20,21.41l-7.07,7.07-1.41-1.41L18.59,20l-7.07-7.07,1.41-1.41L20,18.59Z" fill="#FE6A57"/>
	// </svg>`

	const defaultCloseBtn = `
	<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="70px" height="70px" version="1.1" viewBox="0 0 70 70">
			<g fill="none" fill-rule="evenodd" stroke="none" stroke-width="1">
					<g transform="translate(-1350.000000, -20.000000)">
							<g transform="translate(1350.000000, 20.000000)">
									<g>
											<g>
													<rect width="70" height="70" x="0" y="0" fill="#FE6A57" rx="6"/>
													<g transform="translate(30.500000, 30.500000) rotate(45.000000) translate(-30.500000, -30.500000) translate(15.000000, 15.000000)"/>
											</g>
											<g stroke="#FFFFFF" stroke-linecap="round" transform="translate(20.000000, 20.000000)">
													<path d="M0,0 L29.5140222,29.5140222"/>
													<path d="M0,0 L29.5140222,29.5140222" transform="translate(14.757011, 14.757011) scale(-1, 1) translate(-14.757011, -14.757011) "/>
											</g>
									</g>
							</g>
					</g>
			</g>
	</svg>`;

	const fullScreenBtn = `
		<svg width="70px" height="70px" viewBox="0 0 70 70" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
			<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
				<rect fill="#FE6A57" x="0" y="0" width="70" height="70" rx="6"></rect>
				<g transform="translate(30.500000, 30.500000) rotate(45.000000) translate(-30.500000, -30.500000) translate(15.000000, 15.000000)"></g>
				<g transform="translate(20.000000, 20.000000)" stroke="#FFFFFF">
						<polyline points="19.5 29.5 29.5 29.5 29.5 19.5"></polyline>
						<polyline transform="translate(24.500000, 5.500000) rotate(-90.000000) translate(-24.500000, -5.500000) " points="19.5 10.5 29.5 10.5 29.5 0.5"></polyline>
						<polyline transform="translate(5.500000, 24.500000) rotate(-270.000000) translate(-5.500000, -24.500000) " points="0.5 29.5 10.5 29.5 10.5 19.5"></polyline>
						<polyline transform="translate(5.500000, 5.500000) rotate(-180.000000) translate(-5.500000, -5.500000) " points="0.5 10.5 10.5 10.5 10.5 0.5"></polyline>
				</g>
			</g>
		</svg>
	`;

	const controlsTemplate = options => {
			return `<div class="video_controls">
			<button class="btn-reset video_container__play">${options.playBtn}</button>
			<table leftmargin="0" marginwidth="0" topmargin="0" marginheight="0" offset="0" width="100%" border-collapse="collapse">
				<tr>
					<td class="video_buttons__wrapp">
						<div class="video_buttons">
							<button class="btn-reset video_controlls__play-pause">${options.playPauseBtn}</button>
						</div>
					</td>
					<td class="video_timeline__wrapp">
						<div class="video_timeline">
						<div class="video_progress">
						<div class="video_progress__buffer"></div>
						<div class="video_progress__bar">
						<div class="video_progress__bullet"></div>
					</div>
					</div>
						<div class="video_timeline__time">
						<div class="video_timeline__time__current"></div>
						<div class="video_timeline__time__duration"></div>
						<div class="video_timeline__time__left"></div>
					</div>
					</div>
					</td>
						<td class="video_buttons__secondaty__wrapp">
						<div class="video_buttons__secondary">
						<button class="btn-reset video_controlls__full-screen"></button>
					</div>
					</td>
				</tr>
			</table>
			</div>
		`;
	};

	class VideoPlayerControls {

		constructor(element) {
			this.container = element;
			this.init(element);
		}

		getDuration(millis) {
			let dur = {};
			let units = [{ label: "millis", mod: 1000 }, { label: "seconds", mod: 60 }, { label: "minutes", mod: 60 }, { label: "hours", mod: 24 }, { label: "days", mod: 31 }];
			units.forEach(function (u) {
				millis = (millis - (dur[u.label] = millis % u.mod)) / u.mod;
			});
			dur.toString = function () {
				return units.reverse().map(function (u) {
					return dur[u.label] + " " + (dur[u.label] == 1 ? u.label.slice(0, -1) : u.label);
				}).join(', ');
			};
			return dur;
		}

		launchFullscreen(element) {
			if (element.requestFullscreen) {
				element.requestFullscreen();
			} else if (element.mozRequestFullScreen) {
				element.mozRequestFullScreen();
			} else if (element.webkitRequestFullscreen) {
				element.webkitRequestFullscreen();
			} else if (element.msRequestFullscreen) {
				element.msRequestFullscreen();
			}
		}

		exitFullscreen() {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}

		toggleFullScreen(element) {
			if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
				this.exitFullscreen();
				element.classList.remove('fullscreen');
			} else {
				this.launchFullscreen(element);
				element.classList.add('fullscreen');
			}
		}

		init(element, options) {

			let _options = options || { video: {} };
			const extOptions = {
				video: {
					loop: _options.loop || false,
					autoPlay: _options.video.autoPlay || false,
					playBtn: _options.playBtn || circleBtn,
					playPauseBtn: _options.playPauseBtn || defaultPlayBtn,
					fullScreenBtn: _options.fullScreenBtn || fullScreenBtn,
					closeBtn: _options.closeBtn || defaultCloseBtn
				}
			};

			const genTimeMark = (num, twoDigits) => {
				if (num > 9) {
					let n = num.toString().split('');
					return '<span>' + n[0] + '</span><span>' + n[1] + '</span>';
				}
				return twoDigits ? '<span>0</span><span>' + num + '</span>' : '<span>' + num + '</span>';
			};

			const catchPlay = container => {
				container.classList.add('video_playing');
				container.classList.remove('video_paused');
				container.classList.remove('video_initial');
				container.querySelector('.video_controls').style.opacity = 0;
			};

			const catchPause = container => {
				container.classList.add('video_paused');
				container.classList.remove('video_playing');
				container.querySelector('.video_controls').style.opacity = 1;
			};

			const catchEnd = container => {
				container.classList.remove('video_playing');
				container.classList.add('video_paused');
				container.classList.add('video_initial');
			};

			const addListeners = (container, video) => {
				const timeDuration = container.querySelector('.video_timeline__time__duration');
				const timeCurrent = container.querySelector('.video_timeline__time__current');
				const timeLeft = container.querySelector('.video_timeline__time__left');
				const progressComplited = container.querySelector('.video_progress__bar');
				const progressBuffer = container.querySelector('.video_progress__buffer');
				let duration, durationSpot1, durationSpot2, currentSpot1, currentSpot2, timeLeftSpot1, timeLeftSpot2;

				const updateProgressBar = () => {
					let percentege = 100 * video.buffered.end(0) / video.duration;
					progressBuffer.style.width = percentege + '%';
					if (percentege < 100) {
						setTimeout(() => updateProgressBar(), 30);
					}
				};

				const canPlay = () => {
					let aspectRatio = video.videoWidth / video.videoHeight;
					container.classList.add(aspectRatio > 1 ? 'wide' : 'tall');
					duration = this.getDuration(video.duration * 1000);

					updateProgressBar();

					timeCurrent.innerHTML = '<i class="current__spot__1">0</i>:<i class="current__spot__2">00</i>';
					currentSpot1 = container.querySelector('.current__spot__1');
					currentSpot2 = container.querySelector('.current__spot__2');

					timeDuration.innerHTML = '<i class="duration__spot__1"></i>:<i class="duration__spot__2"></i>';
					durationSpot1 = container.querySelector('.duration__spot__1');
					durationSpot2 = container.querySelector('.duration__spot__2');

					timeLeft.innerHTML = '<i class="timeleft__spot__1"></i>:<i class="timeleft__spot__2"></i>';
					timeLeftSpot1 = container.querySelector('.timeleft__spot__1');
					timeLeftSpot2 = container.querySelector('.timeleft__spot__2');

					let m = genTimeMark(duration.minutes);
					let s = genTimeMark(duration.seconds, true);
					durationSpot1.innerHTML = m;
					durationSpot2.innerHTML = s;
					timeLeftSpot1.innerHTML = '-' + m;
					timeLeftSpot2.innerHTML = s;

					container.classList.add('video_ready');
					video.style.display = 'block';
					if (extOptions.video.autoPlay) {
						video.play();
					}
				};

				const updateTimeLine = () => {
					let currentTime = this.getDuration(video.currentTime * 1000),
							leftTime = this.getDuration((video.duration - video.currentTime) * 1000),
							percentage = (100 / video.duration * video.currentTime).toFixed(4);

					progressComplited.style.width = percentage + '%';

					if (currentSpot1) currentSpot1.innerHTML = genTimeMark(currentTime.minutes);
					if (timeLeftSpot1) timeLeftSpot1.innerHTML = '-' + genTimeMark(leftTime.minutes);
					if (currentSpot2) currentSpot2.innerHTML = genTimeMark(currentTime.seconds, true);
					if (timeLeftSpot2) timeLeftSpot2.innerHTML = genTimeMark(leftTime.seconds, true);
				};

				const events = {
					canplay: canPlay,
					play: catchPlay,
					pause: catchPause,
					timeupdate: updateTimeLine,
					ended: catchEnd
				};
				const addEvent = ev => {
					video.addEventListener(ev, () => {
						if (typeof events[ev] == 'function') events[ev](container);
					}, false);
				};

				for (let event in events) {
					addEvent(event);
				}
				video.load();
			};

			const initEvents = container => {
				let video = container.getElementsByTagName('video')[0],
						playBtn = container.querySelector('.video_container__play'),
						controlls = container.querySelector('.video_controls'),
						playPauseBtn = container.querySelector('.video_controlls__play-pause'),
						progressbar = container.querySelector('.video_progress'),
						progressbarBullet = container.querySelector('.video_progress__bullet'),
						fullScreenBtn$$1 = container.querySelector('.video_controlls__full-screen'),
						timeOutHideBar,
						drag;

				// video.preload = "metadata";
				video.preload = "auto";
				video.controls = false;

				const playVideo = () => {
					[].forEach.call(document.getElementsByTagName('video'), function (el) {
						el.pause();
					});
					video.play();
				};

				progressbar.addEventListener('click', function (e) {
					if (!drag) {
						let cursorX = e.clientX - (this.getBoundingClientRect().left + document.body.scrollLeft);
						video.currentTime = video.duration / 100 * (cursorX / this.offsetWidth * 100);
					}
				}, false);

				progressbarBullet.addEventListener('mousedown', () => drag = true, false);
				container.addEventListener('mouseup', () => drag = false, false);

				const hideControls = () => controlls.style.opacity = 0;
				const showControls = () => controlls.style.opacity = 1;

				container.querySelector('video').addEventListener('mousemove', () => {
					showControls();
					if (timeOutHideBar) clearTimeout(timeOutHideBar);
					if (!video.paused) timeOutHideBar = setTimeout(() => hideControls(), 2000);
				}, false);

				progressbar.addEventListener('mousemove', function (e) {
					controlls.style.opacity = '1';
					if (drag) {
						let yovideoProgressCompiled = document.querySelector('.video_progress__bar');
						let cursorX = e.clientX - (this.getBoundingClientRect().left + document.body.scrollLeft);
						video.currentTime = video.duration / 100 * (cursorX / this.offsetWidth * 100);
						yovideoProgressCompiled.style.width = cursorX + 'px';
						// progressbarBullet.style.background = '#E6B17E'
					} else {
							// progressbarBullet.style.background = '#EAC298'
						}
				});

				const pauseVideo = () => {
					video.pause();
				};

				const togglePlayVideo = () => {
					if (video.paused) {
						playVideo();
						timeOutHideBar = setTimeout(function () {
							hideControls();
						}, 2000);
					} else {
						clearTimeout(timeOutHideBar);
						pauseVideo();
						showControls();
					}
				};

				playBtn.addEventListener('click', () => togglePlayVideo(), false);
				playPauseBtn.addEventListener('click', () => togglePlayVideo(), false);
				video.addEventListener('click', () => togglePlayVideo());

				fullScreenBtn$$1.addEventListener('click', () => this.toggleFullScreen(container), false);

				addListeners(container, container.querySelector('video'));
			};

			const addControlsToVideo = container => {
				container.insertAdjacentHTML('beforeend', controlsTemplate(extOptions.video));
				initEvents(container);
			};

			addControlsToVideo(element);
		}

		destroy() {

			this.parentNode.removeChild(this);
		}

		pauseVideo() {
			if (!this.video.paused) this.video.play;
		}

		playVideo() {
			allVideos = document.getElementsByTagName('video');

			if (allVideos && allVideos.length > 0) {
				[...allVideos].forEach(video => video.paused ? false : video.pause());
			}
			this.video.play();
		}

	}

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$54 = instance.define({ name: 'jetsm-video', cssjs: cssjs$39 });

	/** Custom element for video container */
	class VideoPlayer extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static create({ src, poster }) {
			const player = document.createElement('video-player');
			document.body.insertAdjacentElement('beforeend', player);
			player.setAttribute('video-src', src);
			player.setAttribute('video-poster', poster);
			setTimeout(() => player.setAttribute('state', 'play'), 50);
			return player;
		}

		changeState(state) {
			switch (state) {
				case 'play':
					if (this.videoElement.paused) this.videoElement.play();
					if (isMobile()) this.controls.launchFullscreen(this.videoElement);
					document.body.classList.add('overflow-hidden');
					break;
				case 'pause':
					if (isMobile()) this.controls.exitFullscreen();
					if (!this.videoElement.paused) this.videoElement.pause();
					break;
				default:
					break;
			}
		}

		static get observedAttributes() {
			return ['video-src', 'video-poster', 'state'];
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (newValue !== oldValue) {
				switch (name) {
					case 'video-src':
						this.context.src = newValue;
						break;
					case 'video-poster':
						this.context.poster = newValue;
						break;
					case 'state':
						this.changeState(newValue);
						break;
				}		}
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.refClose);
		}

		onAttached() {

			this.classList.add('showed');
			bmpCssComponent$54.attachStyles(this);
			this.videoElement = this.querySelector('video');

			this.refClose = () => {
				document.body.classList.remove('overflow-hidden');
				this.parentNode.removeChild(this);
			};
			window.addEventListener('popstate', this.refClose);['exitFullScreen', 'webkitendfullscreen', 'webkitExitFullScreen'].forEach(fsevent => {
				this.videoElement.addEventListener(fsevent, _ => {
					this.refClose();
				});
			});
			this.controls = new VideoPlayerControls(this);
		}

		ready() {
			this.paused = true;
			this.context = this.observe({
				src: '',
				poster: '',
				showControls: isMobile(),
				showed: false
			});
			return Promise.resolve();
		}

		render() {
			return ME.container({
				mod: { className: 'video-player' },
				children: [BMPVD.createBMPVirtulaDOMElement('button', { 'class': 'btn btn-square btn-close', onclick: () => this.refClose(), safeHTML: defaultCloseBtn }), BMPVD.createBMPVirtulaDOMElement('video', {
					onexitFullScreen: () => this.refClose(),
					onwebkitendfullscreen: () => this.refClose(),
					onwebkitExitFullScreen: () => this.refClose(),
					onplay: () => this.paused = false,
					poster: this.context.poster,
					preload: 'metadata',
					autobuffer: true, src: this.context.src,
					controls: this.context.showControls })]
			});
		}

	}

	customElements.define('video-player', VideoPlayer);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$5 = () => ME.container({
		mod: { className: 'page-content page-about' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 64px`, 'The JetSmarter Backstory'), text(`color: ${COLOR.dark}; margin: 0 0 64px`, 'There was a time when we waited in long lines, removed our shoes, and shuffled through crowded security checkpoints. We settled for search engines, commoditization, and a plethora of apps. Meanwhile, thousands of private jets sat on runways and in hangars depreciating in value, and 40% of the private planes in the sky were flying empty. No one stopped to ask if there wasn’t a better way.'))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 70px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-img-1.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 10 }, text(`color: ${COLOR.dark};`, 'Through our innovative shared flight services, proprietary algorithms, and advanced mobile technology, private jet travel is now more accessible, convenient, and infinitely more efficient. Since our 2012 launch, JetSmarter has quickly become the world’s largest private aviation community, moving more annual passengers than anyone else in the industry.'))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 64px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex flex-reverse' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 10 }, text(`color: ${COLOR.dark}; margin-bottom: 20px;`, 'Our vision to create and optimize socially-powered air travel has been backed by numerous strategic and institutional investors, including Clearlake Capital, a $8B private equity fund, and Jefferies Financial Group, a leading financial institution with $40B in assets.'), text(`color: ${COLOR.dark}; margin-bottom: 20px;`, 'But it is our members – global leaders in business, sports, entertainment, and culture – who have helped define what JetSmarter is today. They can create shared and private flights on their own time, or find seats on flights created by fellow members. All through a simple mobile app.')), ME.layout.cell({ common: 1 })]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-img-2.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					)
				))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 10 }, h4(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 72px`, 'Together, we are building the future of private air travel so the world can experience aviation as it was meant to be.'))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Board Members'))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [...boardMembersModel.map(({ name, description, image, link }) => ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, ME.layout.inner(ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'board-member-item' },
						BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: `/about/${link}/` },
								BMPVD.createBMPVirtulaDOMElement('img', { src: image, alt: name })
							)
						),
						h4(`color: ${COLOR.dark}; font-weight: 400; padding: 0 0 5px`, name),
						h6(`color: ${COLOR.dark}; font-weight: 300;"`, description)
					)))))]
				}))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Meet the Team'))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'button',
					{
						onclick: () => VideoPlayer.create({
							src: 'https://jetsmarter.com/data/video/media-center/team/video.mp4',
							poster: 'https://jetsmarter.com/data/site-v4/images/main-video-poster.v2.jpg'
						}),
						className: 'about-video' },
					BMPVD.createBMPVirtulaDOMElement('img', { className: 'about-video-img', src: 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-img-3.jpg', alt: '' }),
					BMPVD.createBMPVirtulaDOMElement('img', { className: 'play-icon', src: 'https://jetsmarter.com/data/site-v5/assets/ui-icon/play-icon.svg', alt: '' })
				))]
			}))]
		})]
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const getBoardMember = slug => boardMembersModel.find(item => item.link == slug);

	const view$6 = boardMember => {
		const member = getBoardMember(boardMember);
		JetsmPage.lastElement = member;
		return ME.container({
			mod: { className: 'page-content page-about-detail' },
			children: [ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						null,
						window.hidenav ? '' : BMPVD.createBMPVirtulaDOMElement(
							'bmp-anchor',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '/about/', className: 'back-btn', style: `margin-bottom: 53px; color: ${COLOR.dark}` },
								BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
								'Back'
							)
						),
						h2(`color: ${COLOR.dark}; margin: 0;`, member.name),
						h4(`color: ${COLOR.dark}; font-weight: 500; margin: 0 0 10px;`, member.post)
					)), ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: member.image, alt: member.name, style: 'max-width: 300px; width: 100%; display: block; margin: 0 0 30px;' })), ME.layout.cell({ common: 8 }, ...member.detail.map(detailItem => {
						return BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							detailItem.content.map(el => h6(`color: ${COLOR.dark}; font-weight: 300; padding: 0 0 20px;`, el)),
							detailItem.social.length ? h4(`color: ${COLOR.dark}; font-weight: 500;`, 'To connect with ' + member.name.split(' ')[0]) : '',
							detailItem.social.map(el => BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: el.link, rel: 'noopener', target: '_blank', 'class': 'social-icon', style: `display: block; margin-top: 8px;color: ${COLOR.primary}` },
								BMPVD.createBMPVirtulaDOMElement('img', { src: el.icon, alt: el.hashtag, valign: 'middle', style: 'margin-right: 8px;vertical-align: middle;' }),
								el.hashtag
							))
						);
					}))]
				}))]
			})]
		});
	};

	const communitySlides = [{
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/slider/slider-img-1.jpg',
		title: 'Fort Lauderdale International Boat Show',
		description: 'Members enjoyed a weekend on the water in Fort Lauderdale, FL at a multi-million dollar mansion on the Intracoastal Waterway for the annual boat show in November.'
	}, {
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/slider/slider-img-2.jpg',
		title: 'Specialty Cognac Tasting',
		description: 'A refined cognac tasting experience at Dallas\'s Lounge 31 in the opulent Champagne Room.'
	}, {
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/slider/slider-img-3.jpg',
		title: 'Art of the Table',
		description: 'A Sophisticated-only affair at Christofle\'s pop - up venue in NYC with Perrier Jouët to celebrate a savoir-faire, or French dining experience.'
	}, {
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/slider/slider-img-4.jpg',
		title: 'Haute Living x Maluma Dinner',
		description: 'A star-studded intimate dinner with Haute Living at The Highlight Room in Los Angeles to honor MALUMA, one of the hottest names in Latin music.'
	}];

	const communityMemberBenefits = [{
		title: 'Pernod Ricard USA',
		image: 'https://jetsmarter.com/data/site-v4/images/community/pernod.png'
	}, {
		title: 'SBE',
		image: 'https://jetsmarter.com/data/site-v4/images/community/sbe.png'
	}, {
		title: 'STK',
		image: 'https://jetsmarter.com/data/site-v4/images/community/stk.png'
	}, {
		title: 'Bagatelle',
		image: 'https://jetsmarter.com/data/site-v4/images/community/bagatelle.png'
	}, {
		title: 'Viceroy',
		image: 'https://jetsmarter.com/data/site-v4/images/community/viceroy.png'
	}, {
		title: 'Hakkasan Group',
		image: 'https://jetsmarter.com/data/site-v4/images/community/hakkasan-group.png'
	}];

	const communityCurrentMembers = [{
		name: 'Ashley Benson',
		link: 'ashley-benson',
		video: 'https://watch.jetsmarter.com/ashley-benson/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-13.jpg',
		description: 'Actress, Model'
	}, {
		name: 'David Goldin',
		link: 'david-goldin',
		video: 'https://watch.jetsmarter.com/david-goldin/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		video: {
			poster: 'https://jetsmarter.com/data/video/testimonials/david-goldin/poster.jpg',
			src: 'https://jetsmarter.com/data/video/testimonials/david-goldin/video.mp4'
		},
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-1.jpg',
		description: 'Founder, President & CEO at Capify'
	}, {
		name: 'Christina Milian',
		link: 'christina-milian',
		video: 'https://watch.jetsmarter.com/christina-milian/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-8.jpg',
		description: 'Singer-Songwriter, Actress'
	}, {
		name: 'Andy Gitipityapon',
		link: 'andy-gitipityapon',
		video: {
			poster: 'https://jetsmarter.com/data/video/testimonials/andy-gitipityapon/poster.jpg',
			src: 'https://jetsmarter.com/data/video/testimonials/andy-gitipityapon/video.mp4'
		},
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-2.jpg',
		description: 'Financial Advisor'
	}, {
		name: 'Kathy Fable',
		link: 'kathy-fable',
		video: {
			poster: 'https://jetsmarter.com/data/video/testimonials/kathy-fable/poster.jpg',
			src: 'https://jetsmarter.com/data/video/testimonials/kathy-fable/video.mp4'
		},
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-3.jpg',
		description: 'President & CEO of Quinn Fable Advertising'
	}, {
		name: 'Robert Doidge',
		link: 'robert-doidge',
		video: 'https://watch.jetsmarter.com/robert-doidge/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-4.jpg',
		description: 'Orthopaedic Surgeon & Founder of Englewood Sports Medicine Orthopaedic Surgery, P.C.'
	}, {
		name: 'Monique Doidge',
		link: 'monique-doidge',
		video: 'https://watch.jetsmarter.com/monique-doidge/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-5.jpg',
		description: 'Managing Partner of Englewood Sports Medicine Orthopaedic Surgery, P.C.'
	}, {
		name: 'Kamal Hotchandani',
		link: 'kamal-hotchandani',
		video: 'https://watch.jetsmarter.com/kamal-hotchandani/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-6.jpg',
		description: 'CEO & Publisher of Haute Living'
	}, {
		name: 'Stacey Engman',
		link: 'stacey-engman',
		video: 'https://watch.jetsmarter.com/stacey-engman/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-7.jpg',
		description: 'NYC Art Curator'
	}, {
		name: 'Jill Zarin',
		link: 'jill-zarin',
		video: 'https://watch.jetsmarter.com/jill-zarin/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-9.jpg',
		description: 'Television Actress'
	}, {
		name: 'Kevin Lee',
		link: 'kevin-lee',
		video: 'https://watch.jetsmarter.com/kevin-lee/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-10.jpg',
		description: 'Celebrity Wedding Planner'
	}, {
		name: 'Beau Vallis',
		link: 'beau-vallis',
		video: 'https://watch.jetsmarter.com/beau-vallis/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-11.jpg',
		description: 'Singer-Songwriter, Producer'
		// {
		// 	name: 'Oren Alexander',
		// 	link: 'oren-alexander',
		// 	video: 'https://watch.jetsmarter.com/oren-alexander/?box=full&amp;bg=white&amp;style=v4&amp;autoplay=false',
		// 	image: 'https://jetsmarter.com/data/site-v5/assets/pages/community/members/member-12.jpg',
		// 	description: 'Co-Founder of the Alexander Team',
		// },

	}];

	const communityEventSlider = () => {
		return BMPVD.createBMPVirtulaDOMElement(
			'swish-slider',
			null,
			BMPVD.createBMPVirtulaDOMElement(
				'bmp-slider',
				{ 'class': 'swish__ui', controls: 'true', slides: '2', 'infinity-loop': 'true' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'swish__slider' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'swish__slider_inner' },
						BMPVD.createBMPVirtulaDOMElement(
							'ul',
							{ 'class': 'swish__list' },
							communitySlides.map(el => BMPVD.createBMPVirtulaDOMElement(
								'li',
								{ 'class': 'swish__item' },
								BMPVD.createBMPVirtulaDOMElement('div', { style: `background: url("${el.image}") ${COLOR.light} no-repeat 50% 50% / cover; height: 300px;` }),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ 'class': 'swish__item_inner' },
									h5(`color: ${COLOR.dark}; font-weight: 400; padding: 10px 0 10px;`, el.title),
									textSmall(`color: ${COLOR.dark}; font-weight: 300;`, el.description)
								)
							))
						)
					)
				),
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__prev', safeHTML: svgIcon.sliderControl() }),
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__next', safeHTML: svgIcon.sliderControl() })
			)
		);
	};

	const communityEventSliderMobile = () => {
		return BMPVD.createBMPVirtulaDOMElement(
			'swish-slider',
			null,
			BMPVD.createBMPVirtulaDOMElement(
				'bmp-slider',
				{ 'class': 'swish__ui', controls: 'true', slides: '1', 'infinity-loop': 'true' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ 'class': 'swish__slider' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ 'class': 'swish__slider_inner' },
						BMPVD.createBMPVirtulaDOMElement(
							'ul',
							{ 'class': 'swish__list' },
							communitySlides.map(el => BMPVD.createBMPVirtulaDOMElement(
								'li',
								{ 'class': 'swish__item' },
								BMPVD.createBMPVirtulaDOMElement('div', { style: `background: url("${el.image}") ${COLOR.light} no-repeat 50% 50% / cover; height: 300px;` }),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ 'class': 'swish__item_inner' },
									h5(`color: ${COLOR.dark}; font-weight: 400; padding: 10px 0 10px;`, el.title),
									textSmall(`color: ${COLOR.dark}; font-weight: 300;`, el.description)
								)
							))
						)
					)
				),
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__prev', safeHTML: svgIcon.sliderControl() }),
				BMPVD.createBMPVirtulaDOMElement('div', { 'class': 'swish__next', safeHTML: svgIcon.sliderControl() })
			)
		);
	};

	const view$7 = () => {
		return ME.container({
			mod: { className: 'page-community' },
			children: [ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px`, 'Get more from your membership'), text(`color: ${COLOR.dark}; margin: 0 0 60px`, 'Beyond the extraordinary flight services, JetSmarter members enjoy luxury lifestyle benefits and exclusive, invitation-only events from the clouds to the ground. It’s more than a membership…it’s a lifestyle.'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'button',
							{
								onclick: () => VideoPlayer.create({
									src: 'https://jetsmarter.com/data/video/testimonials/see-why-our-members/video.mp4',
									poster: 'https://jetsmarter.com/data/video/testimonials/see-why-our-members/poster.jpg'
								}),
								className: 'community-video' },
							BMPVD.createBMPVirtulaDOMElement('img', { className: 'community-video-img', src: 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-img-3.jpg', alt: '' }),
							BMPVD.createBMPVirtulaDOMElement('div', { className: 'play-icon', safeHTML: svgIcon.playerPlay() })
						))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 60px 0 30px`, 'Events'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'We curate one-of-a-kind events throughout the year - from world-class dining at top restaurants to VIP access to the most sought-after events in sports, music, fashion, and the arts. Reserved exclusively for our members.'))]
					}), ME.layout.grid({
						mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
						children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'community-slider-desktop' },
								communityEventSlider()
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'community-slider-mobile' },
								communityEventSliderMobile()
							)
						))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Member Benefits'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'We partner with luxury brands to offer our members exclusive discounts to five-star resorts, priority reservations at world - renown restaurants, and much more.'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [...communityMemberBenefits.map(({ title, image }) => ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, ME.layout.inner(ME.layout.cell({ common: 10, phone: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'community-benefits-item' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									null,
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'community-item-img' },
										BMPVD.createBMPVirtulaDOMElement('img', { src: image, alt: title })
									)
								)
							)))))]
						}))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Hear from current members'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Get an insider view of the JetSmarter community as members share what prompted them to step aboard, what it’s like to experience our innovative flight and ground services, and why they’ve never looked back.'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'Our global network of members includes leaders in business, sports, entertainment, and culture. Once you’re in, the possibilities of who you will meet are, quite literally, sky high.'))]
					}), ME.layout.grid({
						children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [...communityCurrentMembers.map(({ name, description, image, link, video }) => ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, ME.layout.inner(ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'board-member-item' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'board-member-item-inner' },
									BMPVD.createBMPVirtulaDOMElement(
										'button',
										{
											onclick: () => VideoPlayer.create({
												src: `https://jetsmarter.com/data/video/testimonials/${link}/video.mp4`,
												poster: `https://jetsmarter.com/data/video/testimonials/${link}/poster.jpg`
											}),
											'class': 'btn-reset' },
										BMPVD.createBMPVirtulaDOMElement('img', { className: 'photo', src: image, alt: name }),
										BMPVD.createBMPVirtulaDOMElement('div', { className: 'play-icon', safeHTML: svgIcon.playerPlay() })
									)
								),
								h4(`color: ${COLOR.dark}; font-weight: 400; padding: 40px 0 5px`, name),
								h6(`color: ${COLOR.dark}; font-weight: 300;"`, description)
							)))))]
						}))]
					}))]
				})]
			})]
		});
	};

	const contactsModel = [{
		country: 'Headquarters USA',
		city: 'Fort Lauderdale',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/contacts/contacts-img-1.jpg',
		description: `JetSmarter Inc. 500 East Broward Blvd., Suite 1900 Fort Lauderdale, Florida 33394`,
		phone: [{
			formatted: '+1 (888) 9 VIP JET',
			origin: '18889VIPJET'
		}, {
			formatted: '+1 (888) 9-847-538',
			origin: '+18889VIPJET'
		}]
	}, {
		country: 'United Kingdom',
		city: 'London',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/contacts/contacts-img-2.jpg',
		description: 'JetSmarter United Kingdom Limited, Office 201 2nd Floor, 1-2 Broadgate, London, Greater London, EC2M 2QS, United Kingdom',
		phone: [{
			formatted: '+44 (20) 3905 2320',
			origin: '+442039052320'
		}]
	}, {
		country: 'Russia',
		city: 'Moscow',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/contacts/contacts-img-3.jpg',
		description: `JetSmarter Rus OOO Nizhny Susalny Lane, 5, B. 19, Suite 36 Moscow, Russia 105064`,
		phone: [{
			formatted: '+7 (499) 350-2022',
			origin: '+74993502022'
		}]
	}, {
		country: 'United Arab Emirates',
		city: 'Dubai',
		image: 'https://jetsmarter.com/data/site-v5/assets/pages/contacts/contacts-img-4.jpg',
		description: `JetSmarter FZCO Dubai Airport Freezone Building 5EA, Suite 710 P.O. Box 371135 Dubai, United Arab Emirates`,
		phone: [{
			formatted: '+971 4 230 8300',
			origin: '+97142308300'
		}]
	}];

	const view$8 = () => ME.container({
		mod: { className: 'page-content page-contacts' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 10, tablet: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 64px`, 'Contact us'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'From humble beginnings as a three-person team, we now have four global offices and more on the way!'), text(`color: ${COLOR.dark}; margin: 0 0 40px`, BMPVD.createBMPVirtulaDOMElement(
					'span',
					null,
					'We look forward to hearing from you. Please ',
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: 'mailto:support@jetsmarter.com', className: 'default-link', style: `color: ${COLOR.primary}; white-space: nowrap;` },
						'send us an email'
					),
					' or ',
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ className: 'default-link', href: 'https://calendly.com/jetsmarter-team/jetsmarter-introductory-call-web/', target: '_blank', style: `color: ${COLOR.primary}; white-space: nowrap;` },
						'schedule a call'
					),
					' with an\xA0Aviation Specialist and\xA0we\u2019ll be\xA0in\xA0touch\xA0soon.'
				)))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [...contactsModel.map(({ city, description, image, phone, country }) => ME.layout.cell({ common: 6, tablet: 12 }, ME.layout.inner(ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'contacts-item' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'contacts-item-img' },
								BMPVD.createBMPVirtulaDOMElement('img', { src: image, alt: city })
							)
						)
					), ME.layout.grid({
						mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
						children: [ME.layout.cell({ common: 8, tablet: 10 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'contacts-item-descr' },
							h6(`color: ${COLOR.dark}; font-family: Gotham; font-weight: 400; padding: 0 0 23px; color: ${COLOR.dark}`, country),
							h3(`color: ${COLOR.dark}; font-family: Gotham; font-weight: 400; padding: 0 0 0px`, city),
							h6(`color: ${COLOR.dark}; padding: 0 0 0px; font-weight: 300;`, description),
							phone.map(tel => h6('font-weight: 300;', BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ className: 'contacts-phone default-link', style: `color: ${COLOR.primary}; font-weight: 300; text-decoration: none;`, href: `tel:${tel.origin}` },
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ className: 'notranslate' },
									tel.formatted
								)
							)))
						))]
					})))))]
				}))]
			}))]
		})]
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$9 = () => ME.container({
		mod: { className: 'page-content page-experience' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 64px`, 'The JetSmarter Experience'), text(`color: ${COLOR.dark}; margin: 0 0 64px`, 'An end-to-end luxury travel experience has arrived. With premium flight options, five-star flight crews, and legroom for days, you’ll never want to go back to flying commercial or overpaying for private charters.'))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 70px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-1.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1, phone: 0 }), ME.layout.cell({ common: 10, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'01. '
								),
								' Pre-Flight'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Booking a flight in the JetSmarter app is easy! View starting prices right in the calendar and browse flight options by date. Fly on our high-frequency routes between major cities, or create your own flight ',
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: 'font-weight: 400;' },
									'to 170+ destinations across the globe.'
								)
							)))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 64px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex flex-reverse ' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 10 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'02. '
								),
								' On\xA0the Day\xA0Of'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Skip the long lines and airport crowds and arrive at the private jet terminal just 15 minutes before takeoff. Upon arrival, you\u2019ll be greeted by our Ground Representatives.'
							))), ME.layout.cell({ common: 1 })]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-2.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 70px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-3.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1, phone: 0 }), ME.layout.cell({ common: 10, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'03. '
								),
								' At the\xA0FBO'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Enjoy the convenience of flying out of JetSmarter\u2019s dedicated FBOs, without the nuisances of commercial terminals. After a personal welcome by the Grounds Team, relax at the private terminal while you enjoy complimentary champagne, Wi-Fi and the comfort and privacy of the lounge.'
							)))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 64px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex flex-reverse ' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 10 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'04. '
								),
								' Safety & Security'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Fly right past airport security. Passengers on\xA0shared flights undergo a\xA0digital background check, and\xA0our expert security team conducts ',
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: 'white-space: nowrap;' },
									'a non-intrusive'
								),
								' inspection of\xA0all bags so\xA0that you can\xA0board with\xA0peace of\xA0mind. If\xA0you purchase a\xA0private charter, skip this\xA0step\xA0entirely.'
							))), ME.layout.cell({ common: 1 })]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-4.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 70px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-5.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1, phone: 0 }), ME.layout.cell({ common: 10, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'05. '
								),
								' Boarding'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Our Ground Team will escort you aboard the flight and get you situated with anything you may need before takeoff.'
							)))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 64px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex flex-reverse ' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 10 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'06. '
								),
								' In-Flight'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Network with like-minded individuals, dine on catering and sip champagne while you sit back (all the way back) and enjoy the flight. All heavy jets include gourmet dining options, cocktails, an on-board flight attendant and have complimentary 4G high-speed Wi-Fi; so you can work, check e-mail or stream videos with no interruptions.'
							))), ME.layout.cell({ common: 1 })]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-6.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					)
				))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 70px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-img-7.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1, phone: 0 }), ME.layout.cell({ common: 10, phone: 12 }, h3(`color: ${COLOR.dark}; margin: 10px 0 30px`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: `color: ${COLOR.primary}` },
									'07. '
								),
								' Arrival'
							)), text(`color: ${COLOR.dark};`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Land at your destination in style. Need a ride? Order a black car through Concierge and we\u2019ll pick you up right on the tarmac as soon as you land to make sure you arrive at your final destination in comfort.'
							)))]
						})
					)
				))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h3(`color: ${COLOR.dark}; margin: 0 0 30px`, 'An unmatched experience in private air travel'), h4(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 30px`, 'Enjoy the peace of mind knowing you saved time and arrived revitalized and ready to make it to your meeting, enjoy some time-off — or both.'), h4(`color: ${COLOR.dark}; font-weight: 400; margin: 0 0 30px`, 'See you aboard the next flight!'))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, linkButtonPrimary$1('display: inline-block; width: 100%; max-width: 350px; margin-right: 30px; margin-bottom: 20px;', BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '/?focus=origin' },
						'Book a flight'
					)
				)), linkButtonSecondary('display: inline-block; width: 100%; max-width: 350px;', BMPVD.createBMPVirtulaDOMElement(
					'a',
					{ href: 'https://calendly.com/jetsmarter-team/jetsmarter-introductory-call-web', target: '_blank' },
					'Schedule a call'
				)))]
			}))]
		})]
	});

	const view$10 = () => ME.container({
		mod: { className: 'page-content page-owners' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px`, 'JetSmarter Owner Program'), h4(`color: ${COLOR.dark}; font-weight: 400; font-family: "Gotham" ; margin: 0 0 64px`, 'The industry’s first turn-key solution for aircraft ownership'), h5(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'The Owner Program is a simple solution for aircraft owners who want to defray the cost associated with owning an aircraft, or for new owners who are looking for tax benefits but don’t want the hassle and expense of ownership.'))]
			}), ME.layout.grid({
				mod: { desktop: { margin: '0 0 67px' } },
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/owners/owners-img-1.jpg', style: 'max-width: 100%; display: block;', alt: '' }))]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 1 }), ME.layout.cell({ common: 10 }, h5(`color: ${COLOR.dark}; margin: 0 0 20px;`, 'We take on expenses associated with maintaining and running the aircraft, and owners collect an hourly return. Owners enjoy all the benefits of owning an aircraft while eliminating its operating expenses in the JetSmarter program.'), h5(`color: ${COLOR.dark};`, 'As part of the program, owners also receive a unique JetSmarter Owner Membership, which comes with an owner app to track your aircraft, earnings, and receive exclusive discounts for flying with JetSmarter and additional special perks.'))]
						})
					)
				))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h4(`color: ${COLOR.dark}; font-weight: 400; font-family: "Gotham"; margin: 0 0 34px; text-align: center;`, 'Interested in joining the JetSmarter Owner Program?'), linkButtonPrimary$1('display: block; margin: auto;', BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '/owners/request-form/', target: '_blank', style: 'display: block; margin: auto;' },
						'Contact us'
					)
				)))]
			}))]
		})]
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const view$11 = () => ME.container({
		mod: { className: 'page-content page-safety' },
		children: [ME.layout.grid({
			children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 10 }, h2(`color: ${COLOR.dark}; margin: 0 0 65px`, 'Safety first. Always.'), text(`color: ${COLOR.dark}; margin-bottom: 20px;`, 'When you fly with JetSmarter, you enjoy complete peace of mind the moment you step aboard. That elusive, carefree state is synonymous with flying private, and it’s one of the many reasons why tens of thousands of people around the globe choose to fly with us. When you think about it, peace of mind always starts with safety.'))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'flex' },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 10 }, `



															`, h3(`color: ${COLOR.dark}; margin-bottom: 20px; font-weight: 400;`, BMPVD.createBMPVirtulaDOMElement(
								'span',
								null,
								'Our seamless ',
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ style: 'white-space: nowrap;' },
									'on-the-ground'
								),
								' security procedures'
							)), text(`color: ${COLOR.dark}; margin-bottom: 20px;`, 'The safety and security of our global community is our number-one focus. JetSmarter’s proprietary safety and security infrastructure on the ground, the only one of its kind in the private aviation sphere, was designed with guidance from Tom Ridge, the first Secretary of the U.S. Department of Homeland Security, who currently serves on JetSmarter’s Board of Directors.'), text(`color: ${COLOR.dark}; margin-bottom: 20px;`, 'In order to access our flight services, fliers undergo a digital background check before boarding, and during shared flights, expert safety teams ensure that luggage is safe for takeoff.')), ME.layout.cell({ common: 1 })]
						})
					),
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'flex-item flex-reverse' },
						ME.layout.grid({
							mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
							children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('img', { src: 'https://jetsmarter.com/data/site-v5/assets/pages/safety/visual-2.jpg', style: 'max-width: 100%; display: block;', alt: 'Tom Ridge' }))]
						})
					)
				))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [ME.layout.cell({ common: 10 }, h3(`color: ${COLOR.dark}; margin: 40px 0 20px ;font-weight: 400`, 'Our rigorous standards for operating partners'), text(`color: ${COLOR.dark}; margin: 0 0 30px`, 'All flights in the JetSmarter app are operated by air carriers who are licensed by the Federal Aviation Administration (FAA) and registered with the Department of Transportation (DOT). At JetSmarter, we take these requirements even further. Only the operators whose aircraft and pilots meet the private aviation industry’s highest safety and security standards make it into our preferred network, and we highly prioritize operators that carry ARGUS Platinum, Wyvern Wingman, and IS-BAO Stage 3 ratings.'))]
				}))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [...safetyCompany.map(({ title, image, description }) => ME.layout.cell({ common: 4, tablet: 4, phone: 12 }, ME.layout.inner(ME.layout.cell({ common: 10 }, BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'safety-company-item' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'safety-company-img' },
							BMPVD.createBMPVirtulaDOMElement('img', { src: image, alt: title })
						),
						textSmall(`color: ${COLOR.dark}; font-weight: 300;`, description)
					)))))]
				}))]
			}), ME.layout.grid({
				children: [ME.layout.cell({ common: 10 }, ME.layout.grid({
					mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
					children: [ME.layout.cell({ common: 12 }, text(`color: ${COLOR.dark}; margin: 0 0 20px`, 'Because JetSmarter partners with premium flight operators and pilots, the aircraft options are virtually limitless, and many of the operator aircraft fly exclusively with JetSmarter.'), text(`color: ${COLOR.dark};`, 'No matter which type of aircraft you’re flying on, the exact safety ratings and liability insurance coverage can be viewed for each plane in the app, whenever you like.'))]
				}))]
			}))]
		})]
	});

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	const getCompany = slug => safetyCompanyAll.find(item => item.link == slug);

	const view$12 = companySlug => {
		const company = getCompany(companySlug);
		JetsmPage.lastElement = company;
		return ME.container({
			mod: { className: 'page-content page-safety-detail' },
			children: [ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, ME.layout.grid({
						mod: { desktop: { margin: 0 }, tablet: { margin: 0 }, phone: { margin: 0 } },
						children: [ME.layout.cell({ common: 10 }, BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'bmp-anchor',
								null,
								BMPVD.createBMPVirtulaDOMElement(
									'a',
									{ href: '/safety-security/', className: 'back-btn', style: 'margin-bottom: 53px' },
									BMPVD.createBMPVirtulaDOMElement('span', { className: 'back-btn-arrow-icon', safeHTML: svgIcon.backArrow() }),
									'Back'
								)
							),
							h2(`color: ${COLOR.dark}; margin: 0px 0 64px ;font-weight: 400`, company.title),
							h6(`color: ${COLOR.dark}; margin: 0px 0 20px; font-weight: 300`, company.description)
						))]
					}))]
				}))]
			})]
		});
	};

	const Views = {
		'fleet': {
			getTemplate: () => view$4(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/fleet/fleet-top.jpg'
		},
		'about': {
			getTemplate: () => view$5(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-top.jpg'
		},
		'about-detail': {
			getTemplate: params => view$6(params.board_member),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/about/about-top.jpg'
		},
		'community': {
			// transparentHeader: true,
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/community/community-top.jpg',
			getTemplate: () => view$7()
		},
		'contacts': {
			getTemplate: () => view$8(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/contacts/contacts-top.jpg'
		},
		'experience': {
			getTemplate: () => view$9(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/experience/experience-top.jpg'
		},
		'owners': {
			getTemplate: () => view$10(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/owners/owners-top.jpg'
		},
		'safety': {
			getTemplate: () => view$11(),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/safety/safety-top.jpg'
		},
		'safety-detail': {
			getTemplate: params => view$12(params.company),
			getHeaderImage: () => 'https://jetsmarter.com/data/site-v5/assets/pages/safety/safety-top.jpg'
		}
	};

	const cssjs$40 = {
		display: 'block',
		'.page-fleet': {
			'.fleet-logos': {
				'margin': '0 0 70px'
			},
			'.fleet-list-item': {
				'padding': '0 0 20px'
			},
			'.fleet-plane-icon': {
				'margin': 'auto',
				'display': 'block',
				'max-width': '100%'
			},
			'.fleet-logo': {
				'background-color': COLOR.light,
				'display': 'flex',
				'height': '257px',
				'img': {
					'display': 'block',
					'margin': 'auto',
					'width': 'auto',
					'height': '60%'
				}
			}
		},
		'.social-icon': { display: 'block' },
		'.page-about': {
			'display': 'block',

			'.board-member-item': {
				'margin': '0 0 40px',
				'&:hover': {
					'img': {
						'transition-duration': FX.transSpeedFast,
						'box-shadow': FX.shadowHover,
						'transform': `scale(${FX.scale.hover})`
					}
				},
				'&:active:hover': {
					'img': {
						'transition-duration': FX.transSpeedFast,
						'box-shadow': FX.shadow.default,
						'transform': 'scale(1)'
					}
				},
				'a': {
					'display': 'block',
					'position': 'relative',
					'width': '100%',
					'margin': '0 0 37px'
				},
				'bmp-anchor': {
					'display': 'block',
					'a': {
						'text-decoration': 'none'
					}
				},
				'img': {
					'width': '100%',
					'height': 'auto',
					'display': 'block',
					'border-radius': '12px',
					'overflow': 'hidden',
					'box-shadow': FX.shadowDefault,
					'transition-duration': FX.transSpeedFast
				}
			},

			'.about-video': {
				'position': 'relative',
				'display': 'block',
				'padding': '0',
				'margin': '0',
				'-webkit-appearance': 'none',
				'-moz-appearance': 'none',
				'appearance': 'none',
				'-webkit-tap-highlight-color': 'transparent',
				'outline': 'none',
				'border': 'none',
				'text-align': 'center',
				'text-decoration': 'none',
				'display': 'block',
				'cursor': 'pointer',
				'.about-video-img': {
					'max-width': '1200px',
					'width': '100%',
					'height': 'auto'
				},
				'.play-icon': {
					'position': 'absolute',
					'top': '0',
					'left': '0',
					'bottom': '0',
					'right': '0',
					'margin': 'auto'
				}
			}
		},
		'.page-about-detail': {
			'.board-member-item': {
				'margin': '0 0 40px',

				'img': {
					'width': '100%',
					'height': 'auto',
					'display': 'block',
					'margin': '0 0 10px'
				}
			},
			'a': {
				color: COLOR.primary,
				'text-decoration': 'none',
				'font-family': 'Roboto',
				'font-size': '16px',
				'font-weight': '400'
			}
		},
		'.page-community': {

			'.community-slider-desktop': {
				'display': 'block'
			},
			'.community-slider-mobile': {
				'display': 'none'
			},

			'.community-video': {
				'position': 'relative',
				'display': 'block',
				'padding': '0',
				'margin': '0',
				'-webkit-appearance': 'none',
				'-moz-appearance': 'none',
				'appearance': 'none',
				'-webkit-tap-highlight-color': 'transparent',
				'outline': 'none',
				'border': 'none',
				'text-align': 'center',
				'text-decoration': 'none',
				'display': 'block',
				'cursor': 'pointer',

				'&:hover': {
					'.community-video-img': {
						'box-shadow': FX.shadow.hover,
						'transform': `scale(${FX.scale.hover})`,
						'transition-duration': FX.speed.fast
					}
				},

				'.community-video-img': {
					'max-width': '1200px',
					'width': '100%',
					'height': 'auto',
					'box-shadow': FX.shadow.default,
					'transition-duration': FX.speed.fast
				},

				'.play-icon': {
					'position': 'absolute',
					'top': '50%',
					'left': '50%',
					'transform': 'translate(-50%, -50%)',
					'margin': 'auto'
				}
			},

			'.swish__ui': {
				'.swish__item': {
					'padding': '10px'
				}
			},

			'.lazy__image_item': {
				'height': '300px',
				'background-size': 'cover',
				'background-position': '50% 50%',
				'background-repeat': 'no-repeat'
			},

			'.pagination': {
				'position': 'absolute',
				'bottom': '20%',
				'left': '0',
				'right': '0',
				'margin': 'auto'
			},

			'bmp-slider': {
				'-webkit-touch-callout': 'none',
				'-webkit-user-select': 'none',
				'-khtml-user-select': 'none',
				'-moz-user-select': 'none',
				'-ms-user-select': 'none',
				'user-select': 'none',
				'margin': '0 0 60px'
			},

			'.board-member-item': {
				'margin': '0 0 40px',
				'&:hover': {
					'.board-member-item-inner': {
						'box-shadow': FX.shadowHover,
						'transition-duration': FX.transSpeedFast
						// 'transform': `scale(${FX.scale.hover})`,
					}
				},
				'&:active:hover': {
					'.board-member-item-inner': {
						'box-shadow': FX.shadow.default,
						'transition-duration': FX.transSpeedFast
						// 'transform': 'scale(1)',
					}
				},

				'.board-member-item-inner': {
					'padding-bottom': '100%',
					'position': 'relative',
					'overflow': 'hidden',
					'border-radius': '12px',
					'box-shadow': FX.shadowDefault,
					'transition-duration': FX.transSpeedFast
				},

				'.btn-reset': {
					'position': 'static'
				},

				'a': {
					'display': 'block',
					'position': 'relative',
					'width': '100%',
					'margin': '0 0 37px'
				},
				'bmp-anchor': {
					'display': 'block',
					'a': {
						'text-decoration': 'none'
					}
				},
				'.photo': {
					'width': 'auto',
					'height': '101%',
					'display': 'block',
					'border-radius': '12px',
					'overflow': 'hidden',
					'position': 'absolute',
					'top': '50%',
					'left': '50%',
					'transform': 'translate(-50%, -50%)'
				},
				'.play-icon': {
					'position': 'absolute',
					'right': '20px',
					'bottom': '20px'
				}
			},

			'.community-benefits-item': {

				'margin': '0 0 80px',

				'.community-item-img': {
					'position': 'relative',
					'overflow': 'hidden',
					'height': '120px',

					'img': {
						'max-width': '90%',
						'max-height': '100px',
						'height': 'auto',
						'position': 'absolute',
						'top': '50%',
						'left': '50%',
						'transform': 'translate(-50%, -50%)'
					}
				}
			},

			'@media (max-width: 480px)': {
				'.community-benefits-item': {

					'margin': '0 0 50px',

					'.community-item-img': {
						'position': 'relative',
						'overflow': 'hidden',
						'height': '60px',

						'img': {
							'max-width': '50%',
							'max-height': '50px'
						}
					}
				}
			}
		},
		'.page-safety': {
			'.safety-company-item': {
				'margin': '0 0 40px',
				'.safety-company-img': {

					'position': 'relative',
					'overflow': 'hidden',
					'height': '160px',
					'margin': '0 0 20px',

					'img': {
						'max-width': '50%',
						'max-height': '100px',
						'height': 'auto',
						'position': 'absolute',
						'top': '50%',
						'left': '0',
						'transform': 'translate(0%, -50%)'
					}
				}
			}
		},
		'.page-contacts': {

			'.contacts-item-descr': {
				'margin': '0 0 64px'
			},

			'.contacts-item': {
				'margin': '0 0 40px',

				'.contacts-phone': {
					'font-weight': '500',
					'display': 'block',
					'color': `${COLOR.dark}`
				},

				'.contacts-item-img': {
					'position': 'relative',
					'overflow': 'hidden',
					// 'height': '350px',
					'margin': '0 0 37px',

					'img': {
						'display': 'block',
						'position': 'relative',
						'width': '100%',
						'height': 'auto'
						// 'top': '50%',
						// 'left': '50%',
						// 'transform': 'translate3d(-50%, -50%, 0)'
					}
				}
			}

		},

		'@media (max-width: 839px)': {
			'.page-fleet': {
				'.fleet-logo': {
					'img': {
						'height': '40%'
					}
				},
				'.fleet-plane-icon': {
					'margin': '0'
				}
			}
		},

		'@media (max-width: 768px)': {
			'.page-community': {
				'.community-slider-desktop': {
					'display': 'none'
				},
				'.community-slider-mobile': {
					'display': 'block'
				}
			}
		},

		'@media (max-width: 600px)': {
			'.page-fleet': {
				'.fleet-logo': {
					'img': {
						'height': '30%'
					}
				}
			}
		},

		'@media (max-width: 479px)': {
			'.page-fleet': {
				'.fleet-logo': {
					'img': {
						'height': '60%'
					}
				}
			}
		}
	};

	let bmpCssComponent$55 = instance.define({
		name: 'jetsm-page', cssjs: cssjs$40
	});
	let lastElement$3;

	class JetsmPage extends BMPVDWebComponent {

		constructor() {
			super();
		}

		static async getLastElement() {
			return this.lastElement;
		}

		static get lastElement() {
			return lastElement$3;
		}

		static set lastElement(element) {
			lastElement$3 = element;
		}

		static getUrlConf() {
			/** TODO: Make it dynamic */
			return [].concat(boardMembersModel.map(member => `/about/${member.link}/`), safetyCompanyFooter.map(item => item.link));
		}

		ready() {
			try {
				this.params = JSON.parse(this.getAttribute('view-params'));
			} catch (e) {
				this.params = {};
			}

			bmpCssComponent$55.attachStyles(this);
			const template = this.getAttribute('data-template');
			this.view = Views[template];
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					// mod: { className: 'visual-bg', style: this.view.transparentHeader ? '' : `background: url(${this.view.getHeaderImage()}) no-repeat 50% 50% / cover; height: 210px;` },
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: this.view.transparentHeader ? '' : `background: url(${this.view.getHeaderImage()}) no-repeat 50% 50% / cover;` }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: this.view.getTemplate(this.params),
				footer: this.view.hideFooter ? null : BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	customElements.define('jetsm-page', JetsmPage);

	const endpoints = {
			myTrips: 'gettrips',
			airports: 'https://jetsmarter.com/graph/v1/'
	};

	class TripsStore extends BmpStorage {

			constructor() {
					super();

					this.conf = {
							host: window.apiGateway,
							credentials: 'include'
					};
			}

			async getTrips() {
					let myTrips = null;

					try {
							const rawResponse = await this.getRequest(endpoints.myTrips);
							const data = JSON.parse(rawResponse);

							myTrips = data.status ? {
									upcoming: data.upcoming,
									past: data.past
							} : null;
					} catch (e) {}

					this.setToStorage('trips.myTrips', myTrips);

					return myTrips;
			}

			async getAirports(codes) {
					const isIcao = code => code.length === 4;

					const gqlQuery = codes.map(code => {
							const filter = isIcao(code) ? 'icaoCode_Iexact' : 'iataCode_Iexact';

							return `
										${code}: Airports2(${filter}: "${code}") {
											edges {
												node {
													name
													city
												}
											}
										}
									`;
					}).join(' ');

					let body = { query: `{ ${gqlQuery} }` };

					return fetch(endpoints.airports, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(body)
					}).then(res => res.json()).then(res => {
							const airports = {};
							Object.keys(res.data).forEach(icao => {
									if (res.data[icao].edges.length) {
											airports[icao] = res.data[icao].edges[0].node;
									} else {
											airports[icao] = { city: '', name: icao };
									}
							});
							this.setToStorage('trips.airports', airports);

							return airports;
					});
			}

	}

	const trips = new TripsStore();

	const cssjs$41 = {
		'display': 'flex',
		'height': '100%',

		'bmp-anchor': {
			'display': 'block',
			'height': '100%'
		},
		'.trips-card__detail-link': {
			'display': 'block',
			'text-decoration': 'none',
			'height': '100%'
		},

		'.trips-card': {
			'width': '100%',
			'background-color': `${COLOR.light}`,
			'border-radius': '6px',
			'position': 'relative',
			'height': '100%',
			'transition-duration': `${FX.transSpeedFast}`,
			'box-shadow': `${FX.shadowDefault}`,

			'&:hover': {
				'transition-duration': `${FX.transSpeedFast}`,
				'box-shadow': `${FX.shadowHover}`
			},

			'h4': {
				'color': `${COLOR.dark}`
			},
			'h5': {
				'color': `${COLOR.dark}`
			},
			'p': {
				'color': `${COLOR.dark}`
			},
			'.trips-card__status': {
				'padding': '0 0 20px'
			},

			'.trips-card__inner': {
				'height': '100%',
				'padding': '18px 20px 20px',
				'display': 'flex',
				'min-height': '230px',
				'flex-direction': 'column',
				'justify-content': 'space-between'
			},

			'.trips-card__top': {
				// 'padding': '0 0 20px'
			},

			'.trips-card__share': {
				'p': {
					'color': `${COLOR.primary}`
				}
			},

			'.trips-card__crowdfunded': {
				'display': 'flex',
				'align-items': 'center',
				'width': '100%'

			},
			'.trips-card__crowdfunded-item': {
				'width': '50%',
				'&:first-child': {
					'display': 'flex'
				}
			},
			'.trips-card__crowdfunded-icon': {
				'margin-right': '7px',
				'svg': {
					'display': 'block'
				}
			},
			'.crowdfunded-seats': {
				'display': 'flex',
				'flex-wrap': 'wrap',
				'border': `1px solid ${COLOR.lightBorder}`,
				'padding': '1px 1px 0px 1px',
				'border-radius': '4px',
				'float': 'right'
			},
			'.crowdfunded-seats-item': {
				'width': '17px',
				'height': '8px',
				'background': COLOR.neutral,
				'border-radius': '2px',
				'margin': '0 1px 1px 0',
				'&:last-child': {
					'margin-right': '0'
				},
				'&.filled': {
					'background': COLOR.primary
				},
				'&.medium': {
					'width': '12px'
				},
				'&.small': {
					'width': '10px'
				}
			},

			'.trips-card__depart-arrive': {
				'width': '100%',
				'display': 'flex',
				'justify-content': 'space-between',
				'.p-style': {
					'font-weight': '300'
				}

			},
			'.trips-card__depart': {
				'width': '40%'
			},
			'.trips-card__arrive': {
				'width': '40%',
				'text-align': 'right'
			},
			'.trips-card__flight-time': {
				'width': '20%',
				'display': 'flex',
				'text-align': 'center',
				'justify-content': 'center',
				'align-items': 'flex-end'
			},

			'.trips-card__date-time': {
				'display': 'flex',
				'justify-content': 'space-between'
			},

			'.trips-card__date': {
				'width': 'calc(100% - 94px)',
				'padding-right': '10px'
			},

			'.trips-card__time': {
				'width': '94px',
				'text-align': 'right'
			},

			'.trips-card__flights-item': {
				'position': 'relative',
				'display': 'flex',
				'justify-content': 'space-between',

				'.flight-item__from': {
					'width': 'calc(50% - 16px)',
					'text-align': 'left'
				},

				'.flight-item__to': {
					'width': 'calc(50% - 16px)',
					'text-align': 'right'
				},

				'.flights-item__plane-icon': {
					'padding': '0 5px',
					'position': 'absolute',
					'left': '50%',
					'margin': 'auto',
					'transform': 'translate(-50%,0)',
					'background': COLOR.light,
					'z-index': '1',

					'svg': {
						'height': '21px'
					}
				},

				'&:nth-child(3)': {

					'height': '21px',

					'&:after': {
						'content': '""',
						'display': 'block',
						'position': 'absolute',
						'background': COLOR.primary,
						'height': '1px',
						'width': '100%',
						'top': '0',
						'bottom': '0',
						'margin': 'auto'
					}
				}

			},

			'.trips-card__center': {
				'padding': '0 0 10px'
			},

			'.trips-card__footer': {
				'display': 'flex',
				'align-items': 'flex-start',
				'min-height': '21px',

				'.trips-card__footer-item': {
					'&:first-child': {
						'width': '60px'
					},
					'&:last-child': {
						'width': 'calc(100% - 60px)',
						'display': 'flex',
						'align-items': 'flex-start',
						'justify-content': 'flex-end',
						'flex-wrap': 'wrap'
					},
					'position': 'relative'
				}
			},

			'&.trips-cancelled': {
				'.trips-card__date-time': {
					'h5': {
						'text-decoration': 'line-through'
					}
				},
				'.trips-card__depart-arrive': {
					'color': COLOR.darkMedium,
					'text-decoration': 'line-through'
				}
			},

			'&.trips-notify': {
				'&:after': {
					'content': '""',
					'position': 'absolute',
					'top': '6px',
					'right': '6px',
					'width': '14px',
					'height': '14px',
					'background-color': COLOR.primary,
					'display': 'block',
					'border-radius': '12px'
				}
			},

			'&.trips-past': {

				'background-color': '#E7E7E7',
				'.trips-card__flights-item': {

					'.flights-item__plane-icon': {
						'background': '#E7E7E7',
						'svg': {
							'path': {
								'fill': COLOR.darkMedium
							}
						}
					},
					'&:nth-child(3)': {
						'&:after': {
							'background': COLOR.darkMedium
						}
					}
				},

				'.trips-card__status': {
					'.expires': {
						'display': 'none'
					}
				},

				'.trips-card__center': {
					'margin': '0'
				},

				'.trips-card__footer': {
					'.trips-card__footer-item': {
						'display': 'none'
					}
				},

				'h4': {
					'color': COLOR.darkMedium
				},
				'h5': {
					'color': COLOR.darkMedium
				},
				'p': {
					'color': COLOR.darkMedium
				}

			}
		},

		'.trips-card__share-btn': {
			'cursor': 'pointer',
			'display': 'inline-block',
			'p': {
				'cursor': 'pointer',
				'color': COLOR.primary
			}
		},

		'.seat-icon': {
			'svg': {
				'display': 'block',

				'polyline': {
					'opacity': '0'
				}
			},
			'&.confirm': {
				'polyline': {
					'opacity': '1'
				}
			},

			'&.primary': {
				'svg': {
					'rect': {
						'fill': COLOR.primary
					}
				}
			}
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$56 = instance.define({
		name: 'shared-modal-layer',
		cssjs: {
			display: 'block',

			// 'z-index': '1000',
			// 'position': 'fixed',
			// 'top': '0',
			// 'bottom': '0',
			// 'left': '0',
			// 'right': '0',
			// 'overflow-y': 'scroll',

			'.shared-layer-overlay': {
				'position': 'fixed',
				'top': '0',
				'left': '0',
				'width': '100%',
				'height': '100%',
				'z-index': '2'
				// 'background': 'rgba(0,0,0,0.5)'
			}
		}
	});

	let currentModal$2;

	class SharedModalLayer extends BMPVDWebComponent {

		constructor() {
			super();
			window.addEventListener('popstate', this.close.bind(this));
		}

		static show(modal) {
			currentModal$2 = modal;
			document.body.insertAdjacentHTML('beforeend', '<shared-modal-layer />');
		}

		close() {

			this.parentNode.removeChild(this);
			currentModal$2 = null;
		}

		ready() {
			bmpCssComponent$56.attachStyles(this);
			return Promise.resolve();
		}

		disconnectedCallback() {
			window.removeEventListener('popstate', this.close.bind(this));
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				BMPVD.createBMPVirtulaDOMElement('div', { className: 'shared-layer-overlay', onClick: e => this.close() }),
				currentModal$2
			);
		}

	}

	customElements.define('shared-modal-layer', SharedModalLayer);

	const cssjs$42 = {
		'display': 'block',
		'animation-name': 'translateYOpacity',
		'animation-duration': '0.3s',
		'animation-fill-mode': 'forwards',
		'z-index': '2',
		'position': 'absolute',

		'.share-dialog__inner': {
			'background': `${COLOR.white}`,
			'padding': '20px 25px',
			'border-radius': '6px',
			'box-shadow': `${FX.shadowHover}`,

			'&:before': {
				'content': '',
				'width': '0',
				'height': '0',
				'border-left': '6px solid transparent',
				'border-right': '6px solid transparent',
				'border-bottom': `6px solid ${COLOR.white}`,
				'position': 'absolute',
				'top': '0',
				'left': '12px',
				'transform': 'translate(0, -100%)'
			}
		},

		'.share-dialog__social': {
			'display': 'flex',
			'margin': '0 0 20px',
			'align-items': 'flex-end',
			'justify-content': 'space-around'
		},

		'.share-dialog__social-item': {
			'display': 'block',
			'transition-duration': `${FX.transSpeedFast}`,

			'&:hover': {
				'transition-duration': `${FX.transSpeedFast}`,
				'svg': {
					'path': {
						'fill': `${COLOR.primary}`
					}
				}
			},

			'&:last-child': {
				'margin-right': '0'
			}
		},

		'.trips-card__copy-link': {
			'font-size': '11px',
			'background-color': `${COLOR.primary}`,
			'height': '28px',
			'line-height': '28px',
			'font-family': 'Roboto',
			'color': `${COLOR.white}`,
			'border-radius': '6px',
			'border': 'none',
			'outline': 'none',
			'padding': '0',
			'margin': '0',
			'cursor': 'pointer',
			'width': '136px'
		},

		'.share__popup-input': {
			'position': 'absolute',
			'z-index': '-2',
			'left': '-99999px'
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	// TODO: css | move styles of .share-dialog to share-dialog

	let bmpCssComponent$57 = instance.define({
		name: 'shared-dialog',
		cssjs: cssjs$42
	});

	class ShareDialog extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$57.attachStyles(this);
			this.sharedUrl = this.getAttribute('url-to-share');
		}

		get socialShareUrl() {
			return {
				fb: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.sharedUrl)}`,
				tw: `https://twitter.com/share?url=${encodeURIComponent(this.sharedUrl)}`,
				in: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(this.sharedUrl)}`
			};
		}

		handleClickOnSMIcon(smName) {
			const shareWindowWidth = 550;
			const shareWindowHeight = 450;
			const top = Math.round(window.outerHeight / 2 - shareWindowHeight / 2) + window.screenTop;
			const left = Math.round(window.innerWidth / 2 - shareWindowWidth / 2) + window.screenLeft;

			window.open(this.socialShareUrl[smName], 'SocialShare', `height=${shareWindowHeight},
					width=${shareWindowWidth},
					top=${top},
					left=${left},
					toolbar=no, location=no, menubar=no, directories=no, scrollbars=no`);
		}

		copyClipboard(e) {
			let shareLink = this.querySelector('.share__popup-input');
			shareLink.focus();
			shareLink.setSelectionRange(0, shareLink.value.length);
			this.querySelector('.trips-card__txt').innerText = 'Link copied';
			try {
				document.execCommand('copy');
			} catch (err) {
				throw new Error(error);
			}
			window.getSelection().removeAllRanges();
		}

		render() {
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'share-dialog__inner' },
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'share-dialog__social' },
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '', onClick: e => {
								e.preventDefault();this.handleClickOnSMIcon('fb');
							}, className: 'share-dialog__social-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.facebook() })
					),
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '', onClick: e => {
								e.preventDefault();this.handleClickOnSMIcon('tw');
							}, className: 'share-dialog__social-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.twitter() })
					),
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ href: '', onClick: e => {
								e.preventDefault();this.handleClickOnSMIcon('in');
							}, className: 'share-dialog__social-item' },
						BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.linkedin() })
					)
				),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'button',
						{ onClick: this.copyClipboard, className: 'trips-card__copy-link', 'data-shared-url': this.sharedUrl },
						BMPVD.createBMPVirtulaDOMElement(
							'span',
							{ className: 'trips-card__txt' },
							'Copy link'
						),
						BMPVD.createBMPVirtulaDOMElement('input', { type: 'text', readonly: '', 'class': 'share__popup-input', value: this.sharedUrl })
					)
				)
			);
		}

	}

	customElements.define('share-dialog', ShareDialog);

	const shareDialog = ({ top, left, urlToShare }) => BMPVD.createBMPVirtulaDOMElement('share-dialog', { style: `top: ${top}px; left: ${left}px`, 'url-to-share': `${urlToShare}` });

	const cssjs$43 = {
		'display': 'block',
		'position': 'absolute',
		'color': `${COLOR.white}`,
		'background-color': `rgba(0,0,0,0.4)`,
		'padding': '14px 30px 14px 15px',
		'border-radius': '6px',
		'transform': 'translate3d(-100%,0,0)',
		'width': 'auto',
		'max-width': '200px',
		'font-family': 'Roboto, sans-serif',
		'font-size': '13px',
		// 'animation-name': 'translateYOpacity',
		// 'animation-duration': '0.3s',
		// 'animation-fill-mode': 'forwards',

		'&:before': {
			'content': '',
			'width': '0',
			'height': '0',
			'border-left': '6px solid transparent',
			'border-right': '6px solid transparent',
			'border-bottom': `6px solid rgba(0,0,0,0.4)`,
			'position': 'absolute',
			'top': '0',
			'right': '16px',
			'transform': 'translate(0, -100%)'
		}

	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$58 = instance.define({
		name: 'jetsm-tooltip',
		cssjs: cssjs$43
	});

	class JetsmTooltip extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$58.attachStyles(this);
		}

		handleClickOnSMIcon(smName) {}

		render() {
			return BMPVD.createBMPVirtulaDOMElement('div', null);
		}

	}

	customElements.define('jetsm-tooltip', JetsmTooltip);

	const jetsmTooltip = ({ top, left, text }) => BMPVD.createBMPVirtulaDOMElement(
		'jetsm-tooltip',
		{ style: `top: ${top}px; left: ${left}px` },
		text
	);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$59 = instance.define({
		name: 'jetsm-my-trips-card', cssjs: cssjs$41
	});

	class JetsmMyTripsCard extends BMPVDWebComponent {

		constructor() {
			super();
		}

		toggleShareDialog(e) {
			e.preventDefault();
			e.stopPropagation();

			const SHARED_MODAL_INDENT = 30;
			let targetClosest = this.querySelector('.trips-card__share-btn');
			let elClientRect = e.target === targetClosest ? e.target.getBoundingClientRect() : targetClosest.getBoundingClientRect();

			SharedModalLayer.show(shareDialog({
				top: elClientRect.top + window.pageYOffset + SHARED_MODAL_INDENT,
				left: elClientRect.left,
				urlToShare: this.tripData.shareURL
			}));
		}

		toggleTooltip(e) {
			e.preventDefault();
			e.stopPropagation();
			const SHARED_MODAL_INDENT = 35;

			let targetClosest = this.closest('.seat-icon');
			let elClientRect = e.target === targetClosest ? e.target.getBoundingClientRect() : targetClosest.getBoundingClientRect();

			SharedModalLayer.show(jetsmTooltip({
				top: Math.round(elClientRect.top + window.pageYOffset + SHARED_MODAL_INDENT),
				left: Math.round(elClientRect.left + targetClosest.offsetWidth + 7),
				text: targetClosest.getAttribute('text')
			}));
		}

		toLocaleDateStringSupportsLocales() {
			try {
				new Date().toLocaleDateString('i');
			} catch (e) {
				return e.name === 'RangeError';
			}
			return false;
		}

		travelTime({ depart = null, arrive = null } = {}) {
			let departTime = new Date(depart);
			let arriveTime = new Date(arrive);
			let dateDifference = departTime.getTime() - arriveTime.getTime();
			let remainsDate = new Date(dateDifference);
			let remainsSec = parseInt(remainsDate / 1000);
			let remainsFullDays = parseInt(remainsSec / (24 * 60 * 60));
			let secInLastDay = remainsSec - remainsFullDays * 24 * 3600;
			let remainsFullHours = parseInt(secInLastDay / 3600);
			let secInLastHour = secInLastDay - remainsFullHours * 3600;
			let remainsMinutes = parseInt(secInLastHour / 60);
			// let lastSec = secInLastHour - remainsMinutes * 60;
			return textSmall(`color: ${COLOR.darkMedium}`, `${remainsFullHours != 0 ? Math.abs(remainsFullHours) + 'h' : ''} ${remainsMinutes != 0 ? Math.abs(remainsMinutes) + 'm' : ''}`);
		}

		formatDate(dateString) {
			let date = new Date(dateString);
			date = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
			// return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', weekday: 'long' })
			if (this.toLocaleDateStringSupportsLocales()) return BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				date.toLocaleDateString('en-US', { weekday: 'long' }),
				', ',
				date.toLocaleDateString('en-US', { month: 'short' }),
				'\xA0',
				date.toLocaleDateString('en-US', { day: 'numeric' }),
				', ',
				date.toLocaleDateString('en-US', { year: 'numeric' })
			);else return BMPVD.createBMPVirtulaDOMElement(
				'span',
				null,
				date.toLocaleDateString()
			);
			// return addMinutes(date, date.getTimezoneOffset())
		}

		formatTime(dateString) {
			let date = new Date(dateString);
			date = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

			return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
			// return addMinutes(date, date.getTimezoneOffset())
		}

		crowdfunded({ total = 0, filled = 0 } = {}) {
			let totalLength = Array.from(Array(total), () => 0);
			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: 'crowdfunded-seats' },
				totalLength.map((item, idx) => BMPVD.createBMPVirtulaDOMElement('div', { className: `crowdfunded-seats-item ${total > 8 && total < 12 ? 'medium' : total > 12 ? 'small' : ''} ${idx < filled ? 'filled' : ''}` }))
			);
		}

		ready() {
			bmpCssComponent$59.attachStyles(this);
			this.tripData;
			try {
				this.tripData = JSON.parse(this.getAttribute('trip-data'));
			} catch (error) {
				throw new Error(error);
			}
		}

		render() {

			let tripData = this.tripData;

			const classNameList = ['trips-card'];

			if (!tripData.upcoming || tripData.cancelledTrip) {
				classNameList.push('trips-past');
			}
			if (tripData.haveUnreadTripMessages) {
				classNameList.push('trips-notify');
			}
			if (tripData.cancelledTrip) {
				classNameList.push('trips-cancelled');
			}

			return BMPVD.createBMPVirtulaDOMElement(
				'div',
				{ className: classNameList.join(' ') },
				BMPVD.createBMPVirtulaDOMElement(
					'bmp-anchor',
					null,
					BMPVD.createBMPVirtulaDOMElement(
						'a',
						{ className: 'trips-card__detail-link', href: `/my-trips/${tripData.trip_id}/` },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'trips-card__inner' },
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'trips-card__top' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__status' },
									!tripData.upcoming || tripData.cancelledTrip || !tripData.crowdfund ? null : BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'trips-card__crowdfunded' },
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'trips-card__crowdfunded-item' },
											BMPVD.createBMPVirtulaDOMElement('div', {
												className: 'trips-card__crowdfunded-icon',
												safeHTML: tripData.displaySubType === 'CONFIRMED' ? svgIcon.planeTakeoffIconTrips() : svgIcon.planeLandingIconTrips()
											}),
											BMPVD.createBMPVirtulaDOMElement(
												'div',
												{ className: 'crowdfunded-status' },
												tripData.displaySubType === 'CONFIRMED' ? textSmall('color: #4CA82B;', 'Guaranteed') : textSmall(`color: ${COLOR.dark}; text-transform: capitalize;`, tripData.displayType ? tripData.displayType.toLowerCase() : null)
											)
										),
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'trips-card__crowdfunded-item' },
											tripData.displaySubType === 'CONFIRMED' ? null : this.crowdfunded({ total: tripData.crowdfund.seatsTotal, filled: tripData.crowdfund.seatsFilled })
										)
									),
									textSmall(`text-transform: capitalize; color: ${COLOR.primary}`, tripData.cancelledTrip ? 'Cancelled' : '')
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'trips-card__center' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__flights-item' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'trips-card__depart-arrive' },
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'trips-card__depart' },
											tripData.overrideDepartLocal ? textSmall('', this.formatDate(tripData.overrideDepartLocal)) : textSmall('', this.formatDate(tripData.departLocal)),
											tripData.overrideDepartLocal ? h5('', this.formatTime(tripData.overrideDepartLocal)) : null,
											h5(tripData.overrideDepartLocal ? 'text-decoration: line-through' : '', this.formatTime(tripData.departLocal))
										),
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'trips-card__flight-time' },
											this.travelTime({ depart: tripData.departLocal, arrive: tripData.arriveLocal })
										),
										BMPVD.createBMPVirtulaDOMElement(
											'div',
											{ className: 'trips-card__arrive' },
											textSmall('', this.formatDate(tripData.arriveLocal)),
											h5('', this.formatTime(tripData.arriveLocal))
										)
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__flights-item' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flight-item__from' },
										h4('', tripData.from)
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flight-item__to' },
										h4('', tripData.to)
									)
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__flights-item' },
									BMPVD.createBMPVirtulaDOMElement('div', { className: 'flights-item__plane-icon', safeHTML: svgIcon.plane() })
								),
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__flights-item' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flight-item__from' },
										tripData.fromAirport ? textSmall(`font-weight: 300; line-height: 15px;`, `${tripData.fromAirport.name} ${tripData.fromAirport.city}`) : null
									),
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'flight-item__to' },
										tripData.toAirport ? textSmall(`font-weight: 300; line-height: 15px;`, `${tripData.toAirport.name} ${tripData.toAirport.city}`) : null
									)
								)
							),
							BMPVD.createBMPVirtulaDOMElement(
								'div',
								{ className: 'trips-card__footer' },
								BMPVD.createBMPVirtulaDOMElement(
									'div',
									{ className: 'trips-card__footer-item' },
									BMPVD.createBMPVirtulaDOMElement(
										'div',
										{ className: 'trips-card__share-btn', onClick: e => this.toggleShareDialog(e) },
										textSmall('', 'Share')
									)
								),
								BMPVD.createBMPVirtulaDOMElement('div', { className: 'trips-card__footer-item' })
							)
						)
					)
				)
			);
		}

	}

	if (!customElements.get('jetsm-my-trips-card')) customElements.define('jetsm-my-trips-card', JetsmMyTripsCard);

	var _extends$22 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	const tripsApi = new TripsStore();

	let bmpCssComponent$60 = instance.define({
		name: 'jetsm-my-trips-list',
		cssjs: {
			'display': 'block',
			'min-height': '230px',

			'@media (max-width: 1100px)': {
				'.mdc-layout-grid__cell--span-4, .mdc-layout-grid__cell--span-4-desktop': {
					'grid-column-end': 'span 6'
				}
			},

			'@media (max-width: 839px)': {
				'.mdc-layout-grid__cell--span-4, .mdc-layout-grid__cell--span-4-desktop': {
					'grid-column-end': 'span 4'
				}
			},

			'@media (max-width: 600px)': {
				'.mdc-layout-grid__cell--span-4, .mdc-layout-grid__cell--span-4-tablet': {
					'grid-column-end': 'span 8'
				}
			}
		}

	});

	class JetsmMyTripsList extends BMPVDWebComponent {

		constructor() {
			super();
		}

		async fetchTrips() {
			const data = await tripsApi.getTrips();

			if (!data) {
				return null;
			}

			let allTrips = [...data.upcoming, ...data.past];

			if (!allTrips.length) return null;

			// All Uniq Airport Codes From Trips
			let codes = allTrips.reduce((tripsout, trip) => {
				if (!tripsout.includes(trip.from)) tripsout.push(trip.from);
				if (!tripsout.includes(trip.to)) tripsout.push(trip.to);
				return tripsout;
			}, []);

			this.context.airports = await tripsApi.getAirports(codes);

			this.context.upcoming = data.upcoming.sort((a, b) => new Date(a.overrideDepartLocal ? a.overrideDepartLocal : a.departure) - new Date(b.overrideDepartLocal ? b.overrideDepartLocal : b.departure));
			this.context.past = data.past.sort((a, b) => new Date(b.overrideDepartLocal ? b.overrideDepartLocal : b.departure) - new Date(a.overrideDepartLocal ? a.overrideDepartLocal : a.departure));

			return data;
		}

		ready() {

			bmpCssComponent$60.attachStyles(this);

			this.context = this.observe({
				upcoming: [],
				past: [],
				airports: [],
				shareModal: null,
				pendingTrips: true,
				tooltip: {
					show: false,
					top: null,
					left: null
				}
			});

			this.fetchTrips().then(data => {
				this.context.pendingTrips = false;
			}).catch(err => {
				this.context.pendingTrips = false;
			});
			return Promise.resolve();
		}

		copyClipboard(e) {
			let shareLink = this.querySelector('.share__popup-input');
			shareLink.focus();
			shareLink.setSelectionRange(0, shareLink.value.length);
			this.querySelector('.trips-card__txt').innerText = 'Link copied';
			try {
				document.execCommand('copy');
				// console.log('Copy);
			} catch (err) {
				// console.log('Unable to copy');
			}
			window.getSelection().removeAllRanges();
		}

		shareModal() {

			return this.context.shareModal ? BMPVD.createBMPVirtulaDOMElement(
				'div',
				null,
				BMPVD.createBMPVirtulaDOMElement('span', { className: 'share-overlay', onclick: () => {
						this.context.shareModal = false;
					} }),
				BMPVD.createBMPVirtulaDOMElement(
					'div',
					{ className: 'share-dialog', style: `top: ${this.context.shareModal.top}px; left: ${this.context.shareModal.left}px; position: absolute;` },
					BMPVD.createBMPVirtulaDOMElement(
						'div',
						{ className: 'share-dialog__inner' },
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							{ className: 'share-dialog__social' },
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '', className: 'share-dialog__social-item' },
								BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.facebook() })
							),
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '', className: 'share-dialog__social-item' },
								BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.twitter() })
							),
							BMPVD.createBMPVirtulaDOMElement(
								'a',
								{ href: '', className: 'share-dialog__social-item' },
								BMPVD.createBMPVirtulaDOMElement('div', { safeHTML: svgIcon.linkedin() })
							)
						),
						BMPVD.createBMPVirtulaDOMElement(
							'div',
							null,
							BMPVD.createBMPVirtulaDOMElement(
								'button',
								{ onClick: this.copyClipboard, className: 'trips-card__copy-link', 'data-shared-url': this.context.shareModal.sharedUrl },
								BMPVD.createBMPVirtulaDOMElement(
									'span',
									{ className: 'trips-card__txt' },
									'Copy link'
								),
								BMPVD.createBMPVirtulaDOMElement('input', { type: 'text', readonly: '', 'class': 'share__popup-input', value: this.context.shareModal.sharedUrl })
							)
						)
					)
				)
			) : null;
		}

		showShareModal(e, sharedUrl) {
			const SHARED_MODAL_INDENT = 30;
			let targetClosest = e.target.closest('.trips-card__share-btn');
			let elClientRect = e.target === targetClosest ? e.target.getBoundingClientRect() : targetClosest.getBoundingClientRect();

			this.context.shareModal = {
				top: elClientRect.top + window.pageYOffset + SHARED_MODAL_INDENT,
				left: elClientRect.left,
				sharedUrl: sharedUrl
			};
		}

		tooltip() {
			return this.context.tooltip.show ? BMPVD.createBMPVirtulaDOMElement(
				'span',
				{ style: `top: ${this.context.tooltip.top}px; left: ${this.context.tooltip.left}px; position: absolute; z-index: 2;`, className: 'seat-icon-tooltip' },
				text(``, 'Seat explaining text tooltip')
			) : null;
		}

		showTooltip(e) {
			let tooltipTopIndent = 36;
			let maxWidthTooltip = 200;
			let arrowIndent = 10;
			let { top, left } = e.target.getBoundingClientRect();
			this.context.tooltip.top = Math.round(top + tooltipTopIndent + window.pageYOffset);
			this.context.tooltip.left = Math.round(left - maxWidthTooltip + arrowIndent + e.target.offsetWidth);
			this.context.tooltip.show = true;
		}

		hideTooltip(e) {
			this.context.tooltip.show = false;
		}

		render() {

			return ME.container({
				children: [ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, BMPVD.createBMPVirtulaDOMElement('div', { 'class': `inline preloader ${this.context.pendingTrips ? '' : 'hidden'}`, safeHTML: svgIcon.preloader() }), this.context.upcoming.length <= 0 && !this.context.pendingTrips ? text(`color: ${COLOR.dark}`, 'You have no upcoming trips') : null)]
				}), ME.layout.grid({
					children: this.context.upcoming.map(trip => ME.layout.cell({ common: 4, desktop: 4, tablet: 4 }, BMPVD.createBMPVirtulaDOMElement('jetsm-my-trips-card', { 'trip-data': JSON.stringify(_extends$22({}, trip, {
							fromAirport: this.context.airports[trip.from],
							toAirport: this.context.airports[trip.to]
						})) })))
				}), this.context.past.length ? ME.layout.grid({
					children: [ME.layout.cell({ common: 12 }, h4(`color: ${COLOR.dark}; margin: 67px 0 14px; font-weight: 400`, 'Past trips'))]
				}) : null, this.context.past.length ? ME.layout.grid({
					children: this.context.past.map(trip => ME.layout.cell({ common: 4 }, BMPVD.createBMPVirtulaDOMElement('jetsm-my-trips-card', { 'trip-data': JSON.stringify(_extends$22({}, trip, {
							fromAirport: this.context.airports[trip.from],
							toAirport: this.context.airports[trip.to]
						})) })))
				}) : null]
			});
		}

	}

	if (!customElements.get('my-trips-list')) customElements.define('my-trips-list', JetsmMyTripsList);

	const jetsmMyTripsList = () => BMPVD.createBMPVirtulaDOMElement('my-trips-list', null);

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$61 = instance.define({
		name: 'jetsm-my-trips',
		cssjs: {
			'display': 'block'
		}
	});

	class JetsmMyTrips extends BMPVDWebComponent {

		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$61.attachStyles(this);

			this.subID = instance$1.subscribe('user', user => {
				this.context.user = user;
			});

			this.context = this.observe({
				user: instance$1.getFromStorage('user'),
				pending: false
			});

			return Promise.resolve();
		}

		async loadUser() {
			let user = await instance$1.getFromStorage('user');
			return user;
		}

		viewContent(context) {

			return ME.layout.cell({ common: 12 }, ME.layout.grid({
				children: [ME.layout.cell({ common: 12 }, h2(`color: ${COLOR.dark}; margin: 0 0 34px;`, 'My Trips'))]
			}), context.user && context.user.isAuthorized ? jetsmMyTripsList() : ME.layout.grid({ children: [ME.layout.cell({ common: 12 }, text(`color: ${COLOR.dark}`, 'Please log in or create an account.'))] }) // TODO: Show text and login/create buttons on the page if user not logged in

			);
		}

		createBody(context) {
			return ME.container({
				mod: { className: 'page-content' },
				children: [ME.layout.grid({
					children: [this.viewContent(context)]
				})]
			});
		}

		render() {
			return ME.scafold({
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/my-trips/my-trips-top.jpg) no-repeat 50% 50% / cover;' }), BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: this.createBody(this.context),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

		disconnectedCallback() {
			instance$1.unsubscribe('user', this.subID);
		}

	}

	if (!customElements.get('jetsm-my-trips')) customElements.define('jetsm-my-trips', JetsmMyTrips);

	const cssjs$44 = {
		'display': 'block'
	};

	/** @jsx BMPVD.createBMPVirtulaDOMElement */

	let bmpCssComponent$62 = instance.define({
		name: 'jetsm-my-trips-detail', cssjs: cssjs$44
	});

	class JetsmMyTripsDetail extends BMPVDWebComponent {
		constructor() {
			super();
		}

		ready() {
			bmpCssComponent$62.attachStyles(this);
			const uriData = JSON.parse(this.getAttribute('view-params'));
			this.context = this.observe({});
			return Promise.resolve();
		}

		onAttached() {
			let tripId;
			const router = document.querySelector('bmp-router');
			this.reactEl = this.querySelector('#react-trip-details');
			try {
				tripId = JSON.parse(this.getAttribute('view-params')).slug;
			} catch (e) {}
			ReactCaller$1.run('tripDetails', this.reactEl, router.go.bind(router), tripId);
		}

		disconnectedCallback() {
			ReactCaller$1.run('disconnect', this.reactEl);
		}

		async loadData(slug) {
			const { data } = await resourceStorageInstance.getRN(`RN(name='blog', type='detail').filter( published='True', slug='${slug}' ).only( 'content', 'title', 'updated_at', 'image' )`);
			this.context.element = data;
			this.context.pending = false;
		}

		getBody() {
			return ME.container({
				children: [BMPVD.createBMPVirtulaDOMElement('div', { id: 'react-trip-details' })]
			});
		}

		render() {
			return ME.scafold({
				// appBar: ME.container({
				// 	mod: { className: 'visual-bg', style: 'background: url(./assets/img/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover; height: 210px;' },
				// 	children: [
				// 		<jet-header class="relative" />,
				// 	]
				// }),
				appBar: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement('jet-header', null)]
				}),
				body: ME.container({
					children: [BMPVD.createBMPVirtulaDOMElement(
						'div',
						null,
						BMPVD.createBMPVirtulaDOMElement('jetsm-heading', { style: 'background: url(https://jetsmarter.com/data/site-v5/assets/pages/legal/legal-top.jpg) no-repeat 50% 50% / cover;' }),
						this.getBody()
					)]
				}),
				footer: BMPVD.createBMPVirtulaDOMElement('jet-footer', null)
			});
		}

	}

	if (!customElements.get('jetsm-my-trips-detail')) customElements.define('jetsm-my-trips-detail', JetsmMyTripsDetail);

	var _extends$23 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	// create App instance
	// let bmpApp = new BmpApp()

	// initiate JS in Css interface

	let bmpCssComponent$63 = instance.define({
		name: 'app',
		cssjs: {
			'-webkit-transition': 'none',
			transition: 'none',

			display: 'block',
			overflow: 'hidden',
			// 'a': {
			// 	'text-decoration': 'none',
			// 	color: COLOR.primary,
			// 	'&:hover': {
			// 		'text-decoration': 'underline'
			// 	}
			// },
			'&.mw-is-open': {
				'position': 'fixed',
				'left': '0',
				'right': '0'
			},
			'::selection': {
				background: '#FE6A57', //TODO move to theme
				color: '#FFF'
			},
			'::-moz-selection': {
				background: '#FE6A57', //TODO move to theme
				color: '#FFF'
			},
			'.hide': {
				display: 'none'
			},
			'@media(max-width: 1200px)': {
				'.hide-desktop': {
					display: 'none'
				}
			},
			'@media(max-width: 840px)': {
				'.hide-tablet': {
					display: 'none'
				}
			},
			'.preloader': {
				'&.hidden': {
					display: 'none'
				},
				'&.inline': {
					height: '200px',
					position: 'relative',
					svg: {
						'-webki-ttransform': 'scale(0.3)',
						transform: 'scale(0.3)'
					}
				}
			},
			'.text-center': {
				'text-align': 'center'
				// 'padding-top': '3em'
			},
			'p, input': {
				'font-family': `'Roboto', sans-serif`
			},
			'.mw1200': { //TODO move to theme
				'max-width': '1200px',
				margin: 'auto'
			},
			'.big-text': {
				'font-size': '3em',
				color: '#000'
			},
			'bmp-view': {

				display: 'block',
				color: '#fff',
				left: '0',
				top: '0',
				opacity: 0,
				position: 'relative',
				width: '100%',
				'min-height': ' 100vh',
				'-webkit-transition': 'opacity .3s',
				transition: 'opacity .3s',
				'&[ssr]': {
					opacity: 1
				},
				'&[state="anim-in"]': {
					opacity: 1
				},
				'&[state="anim-out"]': {
					opacity: 0
				}
			},
			'.mdc-layout-grid': {
				'max-width': '1200px'
			},
			'nav .mdc-layout-grid': {
				'max-width': '100%'
			},
			'.stretch': {
				'> .mdc-layout-grid': {
					'max-width': '100%'
				}
			},
			'.btn-reset': {
				'position': 'relative',
				'display': 'block',
				'padding': '0',
				background: 'transparent',
				'margin': '0',
				'-webkit-appearance': 'none',
				'-moz-appearance': 'none',
				'appearance': 'none',
				'-webkit-tap-highlight-color': 'transparent',
				'outline': 'none',
				'border': 'none',
				'text-align': 'center',
				'text-decoration': 'none',
				'display': 'block',
				cursor: 'pointer'
			},

			'.btn': {
				'padding': '0',
				'margin': '0',
				'-webkit-appearance': 'none',
				'-moz-appearance': 'none',
				'appearance': 'none',
				'-webkit-tap-highlight-color': 'transparent',
				'outline': 'none',
				'border': 'none',
				'width': '100%',
				'max-width': '300px',
				'cursor': 'pointer',
				'height': '45px',
				'border-radius': '45px',
				'font-weight': '400',
				'text-align': 'center',
				'text-decoration': 'none',
				'display': 'block',
				'border-radius': '5px',
				'span': {
					'font-family': 'Roboto',
					'font-weight': 200,
					'font-size': '16px',
					'text-transform': 'uppercase',
					'transition-duration': '$transitionSpeed',
					'transition-timing-function': 'ease-in-out  '
				},
				'&.btn-primary': {
					background: COLOR.primary,
					color: COLOR.white
				}
				// '&.btn-big': {
				// 	width: '390px',
				// 	'max-width': '100%',
				// 	height: '50px',

				// },
			},
			'.centred': {
				'margin': '0 auto'
			},
			'.flex': {
				'display': 'flex',
				'flex-wrap': 'wrap'
			},
			'.flex-item': {
				'width': '50%'
			},
			'.flex-ai-center': {
				'align-items': 'center'
			},
			'.visual-bg': {
				// height: '210px',
				'&.hidenav': {
					'margin-top': '0'
				}
			},

			'.page-content': {
				'padding': '63px 0 60px'

			},
			'@media (max-width: 479px)': {
				'.page-content': {
					padding: '20px 0'
				},
				'.hide-phone': {
					display: 'none'
				},
				'.visual-bg': {
					'position': 'relative'
					// 'margin-top':  '57px',
				}
			},

			'.default-link': {
				'text-decoration': 'none',
				'border-bottom': `1px solid transparent`,
				'transition-duration': '.25s',
				'&:hover': {
					'transition-duration': '.25s',
					'border-bottom': `1px solid ${COLOR.primary}`
				}
			},

			'.relative': {
				position: 'relative'
			},
			'.back-btn': {
				'font-weight': '300',
				'font-size': '20px',
				'letter-spacing': '-0.5px',
				'display': 'inline-block',
				'position': 'relative',
				'z-index': '1',
				'border': '1px solid #44423e !important',
				'border-radius': '6px',
				'padding': '0 25px',
				'width': '100px',
				'height': '50px',
				'line-height': '49px',
				'margin': '0',
				'text-align': 'left',
				'outline': 'none',
				'cursor': 'pointer',
				'transition-duration': '.25s',
				'color': `${COLOR.dark} !important`,
				'text-align': 'right',
				'text-decoration': 'none',
				'font-family': 'Roboto',
				'box-shadow': `${FX.shadowDefault}`,
				'transition-duration': `${FX.transSpeedFast}`,

				'&:hover': {
					'color': `${COLOR.dark}`,
					'border': `1px solid ${COLOR.dark}`,
					'box-shadow': `${FX.shadowHover}`,
					'transition-duration': `${FX.transSpeedFast}`
				},
				'&:active:hover': {
					'box-shadow': `${FX.shadow.default}`,
					'transition-duration': `${FX.transSpeedFast}`
				},

				'.back-btn-arrow-icon': {
					'position': 'absolute',
					'left': '10px'
				}
			},
			'@media (max-width: 839px)': {
				'.flex-item': {
					'width': '100%'
				},
				'.flex-reverse': {
					'flex-direction': 'column-reverse'
				}
			},
			'.main-divider': {
				'z-index': '2',
				'position': 'relative',
				'min-height': '100%',
				'background': '50% 50%/cover no-repeat transparent'
			},
			'.scroll-to-top': {
				'display': 'block',
				'width': '40px',
				'height': '40px',
				'position': 'fixed',
				'right': '10px',
				'bottom': '10px',
				'border-radius': '6px',
				'opacity': '0',
				'transition-duration': '0.3s',
				'transform': 'rotate(180deg)',
				'cursor': 'pointer',

				'&.visible': {
					'opacity': '1',
					'transition-duration': '0.3s'
				},

				'span': {
					'position': 'relative',
					'display': 'block',
					'background': '#EEECE7',
					'width': '40px',
					'height': '40px',
					'border-radius': '6px',

					'&:before': {
						'content': "''",
						'margin-top': '8px',
						'border-bottom': 'solid 1px #44423E',
						'border-left': 'solid 1px #44423E',
						'color': '#44423E',
						'position': 'absolute',
						'width': '15px',
						'height': '15px',
						'transform': 'rotate(-45deg) translate(50%, 50%)'
					}
				}

			},

			'.route-calendar__price::before': {
				'height': '2px'
			}

		}
	});

	class App extends BMPVDWebComponent {
		constructor() {
			super();
		}

		static get is() {
			return 'jetsmarter-app';
		}

		static get config() {
			return appConfig;
		}

		/** Use ready to tell BMP when you initial data is ready */
		/** warning: observe uses Proxy object and if there's no native support for Proxy it will use google-chrome team polyfill (which comes with some limitations)
		*  https://github.com/GoogleChrome/proxy-polyfill
	 */
		/** TODO deps ex.: ready( fetch ) app core code should provide window.fetch for browsers that supports fetch natively and polyfill if not */
		ready() {

			// bmpApp.attach(this)
			// bmpApp.registerAsyncComponents({
			// 'bmp-router': {
			// 	'js': ['https://cdn.boomfunc.io/bmp-router/0.0.11/index.js']
			// 	// 'js': ['http://jetsmarterv5.lo:9200/index.js']
			// },
			// 'bmp-slider': {
			// 'js': ['https://cdn.boomfunc.io/bmp-slider/1.1.1/scripts/bmp-slider.js'],
			// 'js': ['http://localhost:9000/bmp-slider/dist/scripts/bmp-slider.js'],
			// 'css': ['https://cdn.boomfunc.io/bmp-slider/1.1.1/styles/styles.css']
			// }
			// })
			bmpCssComponent$63.attachStyles(this);

			// Setup router config
			BmpRouter.config(_extends$23({}, appConfig, {
				seoblocks$$1,
				seoDefaults$$1
			}));
		}

		/** Use render to tell BMP what's your component will look like with JSX syntax */
		render() {
			return BMPVD.createBMPVirtulaDOMElement('bmp-router', null);
		}

		statusCode(requestURI) {
			// if ( /^\/(profile|login|signup)/.test(requestURI) )
			// 	return 401
			return BmpRouter.statusCode(requestURI, routes);
		}

		metatags(requestURI) {
			return BmpRouter.getMetatags(requestURI, routes);
		}

		static generateDocument(params) {
			return Shell.generate(params);
		}

	}

	customElements.define(App.is, App);
	if (window.IS_SSR) {
		const getSSRInstance = () => ({
			Application: customElements.get(App.is),
			CssJS: instance,
			Router: BmpRouter,
			env: ENV$1
		});
		getSSRInstance();
	}

});
