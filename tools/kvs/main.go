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

// Storage is a set of separate namespaces which is key-value storage
type Storage map[string]*Namespace

// New initialize and returns new key-value database
// if namespaces empty - `default` namespace will be created
func New(namespaces ...string) Storage {
	s := make(map[string]*Namespace)

	switch {
	// namespaces not provided
	case namespaces == nil:
		namespaces = []string{"default"}

	// namespaces empty
	case len(namespaces) == 0:
		namespaces = append(namespaces, "default")
	}

	// create namespaces
	for _, namespace := range namespaces {
		s[namespace] = NewNamespace()
	}

	return s
}

func (s Storage) namespace(key string) *Namespace {
	if key == "" {
		key = "default"
	}

	return s[key]
}

func (s Storage) AddNamespace(namespace string) {
	s[namespace] = NewNamespace()
}

func (s Storage) Wait(namespace, key string) {
	if ns := s.namespace(namespace); ns != nil {
		ns.Wait(key)
	}

	return
}

func (s Storage) Get(namespace, key string) interface{} {
	if ns := s.namespace(namespace); ns != nil {
		return ns.Get(key)
	}

	return nil
}

func (s Storage) Set(namespace, key string, value interface{}) {
	if ns := s.namespace(namespace); ns != nil {
		ns.Set(key, value)
	}

	return
}
