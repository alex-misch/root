package kvs

// set of tools for integrating with template system
// for rendering template's variable from storage

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"text/template"
)

var (
	ErrNoValue = errors.New("tools/kvs: No value found.")
)

// TemplateFunc returns function for template getting values from storage
func TemplateFunc(ctx context.Context, namespace string) func(string) (string, error) {
	return func(key string) (string, error) {
		if i, err := GetStrictWithContext(ctx, namespace, key); err != nil {
			return "", err
		} else if i == nil {
			return "", ErrNoValue
		} else {
			return fmt.Sprintf("%s", i), nil
		}
	}
}

// RenderFromCtx returns rendered incoming strings
// fill values from kvs templatefuncs
// Example:
// {{<namespace> <key>}}
func RenderFromCtx(ctx context.Context, ss []string) []string {
	// add shortcuts to template rendering
	// TODO: maybe in future this map will generate from params dynamically
	funcMap := template.FuncMap{
		"meta": TemplateFunc(ctx, "meta"),
		"q":    TemplateFunc(ctx, "q"),
		"url":  TemplateFunc(ctx, "url"),
	}

	// Create parent template chain and string builder.
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
