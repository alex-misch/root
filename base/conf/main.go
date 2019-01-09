// Package conf is a layer between `tools.Router` and based on specific node (project, service)
// methods of parsing and fetching router. For example: from config files, remote location, etc.
// Also describes concrete type of `flow.Step` used in `tools.Router`
// in `base` case - pipeline
package conf

// import (
// 	"fmt"
// 	"github.com/boomfunc/root/base/pipeline"
// 	"github.com/boomfunc/root/tools/router"
// 	"github.com/boomfunc/root/tools/router/ql"
// )
//
// // router is alias type for adding unmarshall method
// type innerRouter router.Router
// //
// func (r *innerRouter) UnmarshalYAML(unmarshal func(interface{}) error) error {
// 	// inner type of route
// 	// here we can redeclare keys and some other logic per project
// 	// here can be more fields to calculate final router.Route
// 	var inner struct {
// 		Collection []innerRoute
// 	}
//
// 	if err := unmarshal(&inner); err != nil {
// 		return err
// 	}
//
// 	// yaml valid, transform it to final router.Router struct
// 	r = innerRouter([])
//
//
//
// 	inner.Collection.()
//
// 	return nil
// }
//
// type innerRoute router.Route // use alias type for adding unmarshall method
//
// func (r *innerRoute) UnmarshalYAML(unmarshal func(interface{}) error) error {
// 	// inner type of route
// 	// here we can redeclare keys and some other logic per project
// 	// here can be more fields to calculate final router.Route
// 	var inner struct {
// 		Pattern  string
// 		Pipeline pipeline.Pipeline
// 	}
//
// 	if err := unmarshal(&inner); err != nil {
// 		return err
// 	}
//
// 	// yaml valid, transform it to final router.Route struct
// 	r.Pattern = ql.Regexp(inner.Pattern)
// 	r.Step = inner.Pipeline
//
// 	return nil
// }
