package types

// Flow describes layer from which we can get Step to perform
// Step can be group or parallel group so it is flow
type Flow interface {
	Steps(...string) Step
}
