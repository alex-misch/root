package tools

// DEPRECATED!

import (
	"context"
	"strings"
	"text/template"

	srvctx "github.com/boomfunc/root/base/server/context"
)

// BenchmarkStringsFromCtx-2   	   50000	     28248 ns/op	    6879 B/op	     109 allocs/op
func StringsFromCtx(ctx context.Context, ss []string) []string {
	q := func(key string) (string, error) { return srvctx.GetQ(ctx, key) }
	url := func(key string) (string, error) { return srvctx.GetUrl(ctx, key) }
	meta := func(key string) (interface{}, error) { return srvctx.GetMeta(ctx, key) }

	// add shortcuts to template rendering
	funcMap := template.FuncMap{
		"meta": meta,
		"q":    q,
		"url":  url,
	}

	// create parent template and string builder
	tpl := template.New("").Funcs(funcMap)
	var b strings.Builder
	nss := make([]string, len(ss))

	for i := 0; i < len(ss); i++ {
		inner, err := tpl.Parse(ss[i])
		if err != nil {
			continue
		}

		if err := inner.Execute(&b, nil); err != nil {
			b.Reset()
			continue
		}

		nss[i] = b.String()
		b.Reset()
	}

	return nss
}
