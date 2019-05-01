package channel

// Interface is the direct communication between nodes
// transport layer used for providing Challenge .Ask() part
type Interface interface {
	Send([]byte) error
}
