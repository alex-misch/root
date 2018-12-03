package step

import (
	"context"

	"github.com/boomfunc/root/tools/flow"
)

// CtxFromCtx is special tool
// returns context for provided step only if parent context have collection of child contexts
// and also if there is key of provided step exists in collection
func CtxFromCtx(parent context.Context, step flow.Step) context.Context {
	// try to fetch collection of inner contexts
	ctxs, ok := parent.Value("ctxs").(map[flow.Step]context.Context)
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
