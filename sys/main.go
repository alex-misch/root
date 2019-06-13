package main

// Here describes all exported variables for using as plugin Symbols.

import (
	"github.com/boomfunc/root/base/server/mux"
)

var (
	GraphQL  = mux.GraphQL(schema())  // GraphQL entrypoint (just use base application tool).
	GraphiQL = mux.GraphiQL(schema()) // GraphQL playground page (just use base application tool).
)
