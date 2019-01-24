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
// 9. Protect namespace from r/w
package kvs

// DB is a set of separate namespaces which is key-value storage
type DB map[string]*Namespace

// New initialize and returns new key-value database
// if namespaces empty - `default` namespace will be created
func New(namespaces ...string) DB {
	db := make(map[string]*Namespace)

	if namespaces == nil { // check namespace slice is nil
		namespaces = make([]string, 1)
		namespaces[0] = "default"
	} else if len(namespaces) == 0 { // check empty namespaces
		namespaces = append(namespaces, "default")
	}

	// create namespaces
	for _, namespace := range namespaces {
		db[namespace] = NewNamespace()
	}

	return db
}
