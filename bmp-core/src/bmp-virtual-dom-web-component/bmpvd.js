class BMPVD {

  constructor() {}

  static isEventProp ( propertyKey ) {
    return /^on/.test( propertyKey )
  }

  static isCustomProp ( propertyKey ) {
    return BMPVD.isEventProp(propertyKey) || propertyKey === 'forceUpdate'
  }

  static extractEventName ( propertyKey ) {
    return propertyKey.slice(2).toLowerCase();
  }

  static addEventListeners ( realDOMElement, props ) {
    Object.keys( props ).forEach( eventKey => {
      if ( BMPVD.isEventProp( eventKey ) ) {
        realDOMElement.addEventListener(
          BMPVD.extractEventName( eventKey ),
          props[ eventKey ]
        )
      }
    })
  }

  /** Sets element property
   *  @param { HTMLElement } realDOMElement
   *  @param { string } propertyKey
   *  @param { string } value
   */
  static setProp ( realDOMElement, propertyKey, value ) {
    if ( BMPVD.isCustomProp( propertyKey ) )
      return

    if ( typeof value === 'boolean' )
      BMPVD.setBooleanProp( realDOMElement, propertyKey, value )

		else if ( propertyKey === 'className' || propertyKey === 'value' )
			realDOMElement[propertyKey] = value

		else if ( propertyKey === 'safeHTML' ) // passed string, safe html of element
			realDOMElement.innerHTML = value

    else if (propertyKey == 'ref' && typeof value == 'function') // reference function
      value(realDOMElement)

    else if ( typeof value != 'object' && typeof value != 'function' ) // cannot set function and object to attribute
      realDOMElement.setAttribute( propertyKey, value )
  }

  /** Iterate throught given properties and sets each on HTMLElement
   *  @param { HTMLElement } realDOMElement
   *  @param { Object } props
   */
  static setProps ( realDOMElement, props ) {
    Object.keys( props ).forEach( propertyKey => {
      BMPVD.setProp( realDOMElement, propertyKey, props[ propertyKey ] )
    })
  }

  static setBooleanProp ( realDOMElement, propertyKey, value ) {
    if ( value ) {
      realDOMElement.setAttribute( propertyKey, value )
      realDOMElement[ propertyKey ] = true
    } else {
      realDOMElement.removeAttribute( propertyKey )
      realDOMElement[ propertyKey ] = false
    }
  }


  static removeBooleanProp ( realDOMElement, propertyKey ) {
    realDOMElement.removeAttribute( propertyKey )
    realDOMElement[ propertyKey ] = false
  }

  static removeProp ( realDOMElement, propertyKey, value ) {
    if ( BMPVD.isCustomProp( propertyKey ) )
      return

    else if ( propertyKey === 'className' )
      realDOMElement.removeAttribute( 'class' )

    else if ( typeof value === 'boolean' )
      BMPVD.removeBooleanProp( realDOMElement, propertyKey )

    else
      realDOMElement.removeAttribute( propertyKey )
  }

  static updateProp ( realDOMElement, propertyKey, newVal, oldVal ) {
    /** TODO show some love to this checker */

    if ( propertyKey === 'value' ) {
      realDOMElement.setAttribute('value', newVal)
      realDOMElement.value = newVal // value must always have a "value" attr. It fixes re-render change bug
    } else if ( typeof newVal !== 'boolean' && !newVal ) {
      BMPVD.removeProp( realDOMElement, propertyKey, oldVal )
    } else if ( JSON.stringify(newVal) !== JSON.stringify(oldVal) ) {
      BMPVD.setProp( realDOMElement, propertyKey, newVal )
    }
  }

  static updateProps ( realDOMElement, newProps, oldProps = {} ) {
    let mergedProps = Object.assign({}, newProps, oldProps)

    Object.keys(mergedProps).forEach( propertyKey => {
      BMPVD.updateProp( realDOMElement, propertyKey, newProps[propertyKey], oldProps[propertyKey] )
    })
  }

  /** Create real DOM element and goes deeper for childrens
   *  @param { Object } node
   *  @returns { HTMLElement } real DOM Element
   */
  static createDOMElement ( node = '' ) {

    if ( ['string','number','boolean', undefined].includes( typeof node ) )
      return document.createTextNode( `${node}` )

    const _realDOMElement = document.createElement( node.type )
    if ( _realDOMElement.tagName === 'INPUT' )
      _realDOMElement.value = node.props.value || ''// value must always have a "value" attr. It fixes re-render change bug

    BMPVD.setProps( _realDOMElement, node.props )
    BMPVD.addEventListeners( _realDOMElement, node.props )
    node.children.map( BMPVD.createDOMElement ).forEach( _realDOMElement.appendChild.bind( _realDOMElement ) )

    return _realDOMElement
  }

  /** Compares two virtual DOM elements
   * @param { Object } node1
   * @param { Object } node2
   * @returns { boolean } is changed
   */
  changed ( node1, node2 ) {
    return ( typeof node1 !== typeof node2 ) ||
          (( ['string', 'number'].indexOf(typeof node1) >= 0 || !node1.type ) && node1 !== node2 ) ||
          ( node1.type !== node2.type ) ||
          ( node1.props && node1.props.forceUpdate )
  }

  /** Runs through given "changes" array and update DOM according to it
   * @param { Array } changes
   * @returns { Promise }
   */
  runChanges () {

    const active = document.activeElement
    this.changes.forEach( change => {
      switch ( change.type ) {
        case ( 'create' ):
          /**Expects { Object } chages: { type: create, realDOMParent : { HTMLElement }, vdnode: { VirtualDomNodeObject } } */
          change.realDOMParent.appendChild( BMPVD.createDOMElement( change.vdnode ) )
          break
        case ( 'remove' ):
          /**Expects { Object } chages: { type: remove, realDOMParent : { HTMLElement }, oldNode: { HTMLElement } } */
          change.realDOMParent.removeChild( change.oldNode )
          break
        case ( 'replace' ):
          /**Expects { Object } chages: { type: replace, realDOMParent : { HTMLElement }, oldNode: { HTMLElement }, vdnode: { VirtualDomNodeObject } } */
          change.realDOMParent.replaceChild( BMPVD.createDOMElement( change.vdnode ), change.oldNode )
          break
        case ( 'updateProps' ):
          BMPVD.updateProps( change.realDomNode, change.newProps, change.oldProps )
      }
    })
		if ( active && document.activeElement != active && typeof active.focus == 'function' )
			active.focus() // focus element that was in focus before dom update
    return Promise.resolve()
  }

  registerChange ( changes ) {
    this.changes.push( changes )
  }

  updateContainer ( realDOMParent, newNode, oldNode, index = 0 ) {
    this.changes = []
		this._updateContainer( realDOMParent, newNode, oldNode, index )
    this.runChanges()
  }

  /** Updates real DOM Elements if it needs to
   * @param { HTMLElement } realDOMParent
   * @param { Object } newNode
   * @param { Object } oldNode
   * @param { number } index
   */
  _updateContainer ( realDOMParent, newNode, oldNode, index = 0 ) {

    if ( !oldNode )
      this.registerChange({
        type: 'create',
        realDOMParent: realDOMParent,
        vdnode: newNode
      })

    else if ( !newNode )
      this.registerChange({
        type: 'remove',
        realDOMParent: realDOMParent,
        oldNode: realDOMParent.childNodes[ index ]
      })

    else if ( this.changed( newNode, oldNode ) )
      this.registerChange({
        type: 'replace',
        realDOMParent: realDOMParent,
        oldNode: realDOMParent.childNodes[ index ],
        vdnode: newNode
      })

    else if ( newNode.type ) {
      this.registerChange({
        type: 'updateProps',
        realDomNode: realDOMParent.childNodes[index],
        newProps: newNode.props,
        oldProps: oldNode.props
      })
      const _newLength = newNode.children.length
      const _oldLength = oldNode.children.length
      for ( let i = 0; i < _newLength || i < _oldLength; i++ ) {
        this._updateContainer(
          realDOMParent.childNodes[ index ],
          newNode.children[i],
          oldNode.children[i],
          i
        )
      }
    }
  }

  /** Generates virtualDOMElement
   *  @returns { Object } virtual DOM element
   */
  static createBMPVirtulaDOMElement ( type, props, ...children ) {
    let _children = children.reduce(( output, iter ) => {
      if ( Array.isArray( iter ))
        return [ ...output, ...iter ]
      else
        return [ ...output, iter ]
      }, []).filter( child => child !== null )
    return { type, props: props || {}, children: _children }
  }

  setVirtualDOM ( VDInstance = {} ) {
    this.currentVDInstance = VDInstance
    return this.currentVDInstance
  }
}

export { BMPVD }
