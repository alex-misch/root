import { DataStore } from "../../shared/data-store";


class Resource extends DataStore {

	constructor(conf) {
		super()
		this.conf = conf
	}

	useCache(isUseCache) {
		this.conf.useCache = isUseCache
	}

	getCacheKey(request) {
		return `${request.method}.${request.uri}.${JSON.stringify( request.data || null )}`
	}

	/**
	 *
	 * @param {Request} request
	 */
	async request(request) {
		const cachedRequest = this.conf.useCache && this.getCachedRequest(request)
		if ( cachedRequest )
			return await cachedRequest

		const response = fetch(request)
		if (this.conf.useCache)
			this.cache( this.getCacheKey(request), response)

		return await response
	}

}

export { Resource }
