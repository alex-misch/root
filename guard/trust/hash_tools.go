package trust

// // set or the tools for one-way hashing
// // we using PBKDF2 standart as base
//
// import (
// 	"golang.org/x/crypto/pbkdf2"
// )
//
//
//
// func (ch pbkdf2ch) key(password []byte) []byte {
// 	// NOTE: as salt we use challenge's fingerprint
// 	src := pbkdf2.Key(password, ch.Fingerprint(), ch.iter, ch.length, sha256.New)
// 	dst := make([]byte, hex.EncodedLen(len(src)))
// 	hex.Encode(dst, src)
// 	return dst
// }
