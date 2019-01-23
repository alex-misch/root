// Packge kvs is simple inmemory key - value storage
// TODO features:
// 1. separate namespaces
// 2. cli for bin using
// 3. shortcuts for .so using
// 4. saving to file with special syntax
// 5. load from io.Reader
// 6. thread safety (TODO: look at syscall.Flock)
// 7. ttl
// 8. max db size
package kvs

import (
	"sync"
)

type DB struct {
	mutex   sync.Mutex                  // this mutex guards variables below
	pending map[string]chan interface{} // pending is keys that somebody is waiting for
	items   map[string]interface{}      // inner store
}

// New initialize and returns new key-value database
func New() *DB {
	return &DB{
		pending: make(map[string]chan interface{}, 0),
		items:   make(map[string]interface{}, 0),
	}
}

func (db *DB) Set(key string, value interface{}) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	// set value for db
	db.items[key] = value
	// also check for pending
	if ch, ok := db.pending[key]; ok {
		select {
		case ch <- value:
		default: // for non blocking - nobody waits - no need
		}
		delete(db.pending, key)
	}
}

func (db *DB) Get(key string) interface{} {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	return db.items[key]
}

// TODO: good feature!
func (db *DB) Wait(key string) chan interface{} {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	if _, ok := db.items[key]; ok {
		// value exists, no need to wait
		return nil
	} else {
		// add to pending and create channel
		ch := make(chan interface{})
		db.pending[key] = ch
		return ch
	}
}

func (db *DB) Delete(key string) {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	delete(db.items, key)
}

func (db *DB) Flush() {
	db.mutex.Lock()
	defer db.mutex.Unlock()

	for key := range db.items {
		delete(db.items, key)
	}
}
