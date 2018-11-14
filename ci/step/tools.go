package step

import (
	"context"
)

// CtxFromCtx is special tool
// returns context for step if in parent context exists collection of inner contexts
func CtxFromCtx(parent context.Context, step Interface) context.Context {
	// try to fetch collection of inner contexts
	ctxs, ok := parent.Value("ctxs").(map[Interface]context.Context)
	if !ok {
		// no collection - pass parent
		return parent
	}

	// get child context from collection or return parent
	child, ok := ctxs[step]
	if !ok {
		return parent
	}

	// got it!
	return child
}
