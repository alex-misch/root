package guard

// import (
// 	"crypto"
// 	_ "crypto/sha256"
//
// 	"golang.org/x/crypto/pbkdf2"
// )
//
// var (
// 	// TODO: HASH and ENCRYPT variable set here
// )
//
// // Artifact describes some message (maybe sensitive information)
// type Artifact []byte
//
// // HashBy is the action where node acts as the owner and hashes the artifact by fingerprint used as `salt`.
// // One-way compression output returns.
// // Used in case store sensitive data.
// func (a Artifact) HashBy(node Node) []byte {
// 	// define has function for this operation
// 	hash := crypto.SHA256
//
// 	return pbkdf2.Key(
// 		a, // message
// 		node.Fingerprint(), // salt
// 		100000, // iterations count
// 		hash.Size(), // fixed length. NOTE: must be at least hash.Hash security level (look below)
// 		hash.New,
// 	)
// }
//
// // EncryptBy is the action where node acts as the owner and encrypts the artifact by fingerprint used as `key`.
// // Used for store data that can be decrypted by the same node
// func (a Artifact) EncryptBy(node Node) []byte {
// 	return nil
// }
//
// // DecryptBy is the reverse action described in EncryptBy
// func (a Artifact) DecryptBy(node Node) []byte {
// 	return nil
// }
