package geo

import (
	"github.com/graphql-go/graphql"
)

// RecordType is graphql part, describes how we will map Record to graphql schema.
var RecordType = graphql.NewObject(
	graphql.ObjectConfig{
		Name: "Record",
		Fields: graphql.Fields{
			"IP":                &graphql.Field{Type: graphql.String},
			"City":              &graphql.Field{Type: graphql.String},
			"Continent":         &graphql.Field{Type: graphql.String},
			"Country":           &graphql.Field{Type: graphql.String},
			"ISO":               &graphql.Field{Type: graphql.String},
			"IsInEuropeanUnion": &graphql.Field{Type: graphql.Boolean},
			"Latitude":          &graphql.Field{Type: graphql.Float},
			"Longitude":         &graphql.Field{Type: graphql.Float},
			"PostalCode":        &graphql.Field{Type: graphql.String},
			"TimeZone":          &graphql.Field{Type: graphql.String},
		},
	},
)

// RecordResolveFn is the function used to fetch geo.RecordType in graphql.
var RecordResolveFn graphql.FieldResolveFn = func(p graphql.ResolveParams) (interface{}, error) {
	// Fetch row from db.
	return RecordFromDB(
		p.Args["ip"].(string),
		p.Args["lang"].(string),
	)
}
