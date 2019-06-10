package main

// Here describes all exported variables for using as plugin Symbols.

import (
	"github.com/boomfunc/root/base/server/mux"
)

var (
	// GraphQL entrypoint (just use base application tool).
	GraphQL = mux.GraphQL(schema())
)
