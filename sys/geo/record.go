package geo

import (
	"errors"
	"net"

	"github.com/oschwald/geoip2-golang"
)

var (
	ErrInvalidIP = errors.New("sys/geo: Invalid IP address.")
)

// Record describes a ground point associated with an IP address.
type Record struct {
	IP                string  `json:",omitempty"`
	City              string  `json:",omitempty"`
	Continent         string  `json:",omitempty"`
	Country           string  `json:",omitempty"`
	ISO               string  `json:",omitempty"`
	IsInEuropeanUnion bool    `json:""`
	Latitude          float64 `json:",omitempty"`
	Longitude         float64 `json:",omitempty"`
	PostalCode        string  `json:",omitempty"`
	TimeZone          string  `json:",omitempty"`
}

// RecordFromDB returns record by a provided ip address from db.
func RecordFromDB(ipStr, lang string) (*Record, error) {
	// Validate IP address.
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return nil, ErrInvalidIP
	}

	// Use db to fetch row.
	db, err := geoip2.Open("GeoLite2-City.mmdb")
	if err != nil {
		return nil, err
	}
	defer db.Close()

	raw, err := db.City(ip)
	if err != nil {
		return nil, err
	}

	// Transform to struct.
	r := &Record{
		IP:                ip.String(),
		City:              raw.City.Names[lang],
		Continent:         raw.Continent.Names[lang],
		Country:           raw.Country.Names[lang],
		ISO:               raw.Country.IsoCode,
		IsInEuropeanUnion: raw.Country.IsInEuropeanUnion,
		Latitude:          raw.Location.Latitude,
		Longitude:         raw.Location.Longitude,
		PostalCode:        raw.Postal.Code,
		TimeZone:          raw.Location.TimeZone,
	}

	return r, nil
}
