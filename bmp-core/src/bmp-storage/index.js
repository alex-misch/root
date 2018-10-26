import { observe } from '../shared/proxy-observe.js'
import { setTo, extractFrom } from "../shared/object-utils.js";
import { HTTPRequest } from '../shared/http-request.js';

const getSubscribersPath = path => (path + '.__local_subscribers').split('.')

class BmpStorage extends HTTPRequest {

	constructor() {
		super()

		this.storage = {}
		this.subscribers = {}

	}

	throttleNotify(target) {
		clearTimeout( this.duringNotifier )
		this.duringNotifier = setTimeout( () => {
			this.notifySubscribers(target)
		})
	}


	get dataStore() {
		return this.storage
	}

	getFromStorage( path ) {
		return extractFrom( path.split('.'), this.storage )
	}

	setToStorage( path, data ) {
		setTo( this.storage, path.split('.'), data )
		this.throttleNotify( path )
	}

	notifySubscribers(target) {
		const allSubscribers = {}
		target.split( '.' ).reduce( ( tree, segment ) => {
			tree += `${ tree ? '.' : '' }${ segment }`
			const subs = this._getSubscribers( tree )
			if ( subs ) allSubscribers[ tree ] = subs
			return tree
		}, '' )

		const arSubs = Object.keys( allSubscribers )
		if ( arSubs.length ) {
			arSubs.forEach( subscriberPath  => {
				const subs = allSubscribers[ subscriberPath ]
				Object.keys( subs ).forEach(
					key => subs[ key ]( this.getFromStorage( subscriberPath ), target )
				)
			})
		}
	}

	subscribe( path, fn ) {
		const subID = parseInt( Math.random()*10000, 10 )
		setTo( this.subscribers, [...getSubscribersPath( path ), subID], fn )
		// console.log( 'sub', getSubscribersPath( path )+'.'+subscribers.length )
		return subID
	}

	unsubscribe( path, id ) {
		const subs = this._getSubscribers( path )
		// console.log( 'unsub', `${path}.${id}`, subs )
		if ( subs && subs[id] ) {
			delete subs[id]
		}
	}

	_getSubscribers(path) {
		const subscribersPath = getSubscribersPath( path )
		return extractFrom( subscribersPath, this.subscribers )
	}

}

const instance = new BmpStorage();
export { instance, BmpStorage }
