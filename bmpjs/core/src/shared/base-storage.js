

class BaseStorage {

	constructor(preset = false) {
		this.storage = preset || {}
	}

	set(key, value) {
		return this.storage[key] = value
	}

	get(key) {
		return this.storage[key] || null
	}

	delete(key) {
		delete this.storage[key]
	}

	clear() {
		this.storage = {}
	}
}

export { BaseStorage }
