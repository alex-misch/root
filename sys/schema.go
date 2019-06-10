package main

// Here can be imported only graphql related packages and golang build-in packages.
import (
	"github.com/boomfunc/root/sys/geo"
	"github.com/graphql-go/graphql"
)

// schema returns current project graphql schema.
func schema() graphql.Schema {

	// Describe `query` (read part) of graphql schema.
	query := graphql.ObjectConfig{
		Name: "Query",
		Fields: graphql.Fields{
			"GeoRecord": &graphql.Field{
				Name: "GeoRecord",
				Type: geo.RecordType,
				// as Args we need only IP address and language
				Args: graphql.FieldConfigArgument{
					"ip": &graphql.ArgumentConfig{
						Type: graphql.NewNonNull(graphql.String),
					},
					"lang": &graphql.ArgumentConfig{
						Type:         graphql.String,
						DefaultValue: "en",
					},
				},
				Resolve: geo.RecordResolveFn,
			},
		},
	}

	// Generate schema.
	schema, err := graphql.NewSchema(
		graphql.SchemaConfig{
			Query: graphql.NewObject(query),
		},
	)

	// Something configured wrong - panic. Plugin will panic too.
	if err != nil {
		panic(err)
	}

	return schema
}
