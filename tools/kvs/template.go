package kvs

// set of tools for integrating with template system
// for rendering template's variable from storage

import (
	"bytes"
	"context"
	"errors"
	"fmt"
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

// RenderFromCtx returns rendered string
// fill values from kvs templatefuncs
// Example:
// {{<namespace> <key>}}
func RenderFromCtx(ctx context.Context, s string) (string, error) {
	// add shortcuts to template rendering
	// TODO: maybe in future this map will generate from params dynamically
	funcMap := template.FuncMap{
		"meta": TemplateFunc(ctx, "meta"),
		"q":    TemplateFunc(ctx, "q"),
		"url":  TemplateFunc(ctx, "url"),
	}
	tpl, err := template.New("").Funcs(funcMap).Parse(s)
	if err != nil {
		return "", err
	}

	// TODO look for better solution
	var b bytes.Buffer

	if err := tpl.Execute(&b, nil); err != nil {
		return "", err
	}

	return b.String(), nil
}
