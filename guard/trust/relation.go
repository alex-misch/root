package trust

// import (
// 	"crypto/sha256"
//
// 	"golang.org/x/crypto/pbkdf2"
// )
//
// // some secret for creating relation
// type Artifact []byte
//
// // Hash derives artifact based on owner's fingerprint
// func (artifact Artifact) Hash(node Node) []byte {
// 	return pbkdf2.Key(artifact, node.Fingerprint(), 100000, 32, sha256.New)
// }
//
// // marker is the handled artifact (verified throw some hook)
// type Marker []byte
//
// // Relation describes the relationship between two nodes in `from -> to ` direction
// type Relation struct {
// 	from Node
// 	to Node
// 	profit ArtifactHook
// }
//
// // ArtifactKey generates a key under which the artifact will be stored
// func (r Relation) ArtifactKey() []byte {
//
//
// 	from.Fingerprint()[:], to.Fingerprint()[:]...
//
// 	// TODO
// 	// hashing
// 	// based on `from` and `to` only
// }
//
// // Marker returns encrypted relation
// func (r Relation) Marker() Marker {
// 	// from(to) encrypted
// }
//
//
// // How many challenges must be destroyed if some fails (for different marker - different crashers)
// type Crasher int
//
//
// //
// // // main idea - we cannot decrypt to abstract something
// //
//
// // Now: from( to )
// //
// // maybe:
// //
// // 	from( profit( to ) )
// // 	from( to( profit ) )
