package trust

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"io"
	"bytes"
)

// Abstract represents raw fingerprint as interface
// represents unverified node from marker (just access to fingerprint through interface)
type Abstract []byte

// Fingerprint implements Node interface
func (raw Abstract) Fingerprint() []byte {
	return raw
}

// SameNodes compare nodes fingerprints
func SameNodes(a, b Node) error {
	// compare nodes means check fingerprint identity
	if !bytes.Equal(a.Fingerprint(), b.Fingerprint()) {
		return ErrWrongMarker
	}

	return nil
}

// createPassphrase create and returns 32 byte passphrase
// based on provided fingerprint
func createPassphrase(fingerprint []byte) []byte {
	hasher := md5.New()
	hasher.Write(fingerprint)

	src := hasher.Sum(nil)
	dst := make([]byte, hex.EncodedLen(len(src)))
	hex.Encode(dst, src)

	return dst
}

// encrypt encrept provided data with key
func encrypt(data, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, data, nil)

	return ciphertext, nil
}

// decrypt tries to decrypt data with provided key
func decrypt(data, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	// also we need check does out data appropriate to block size
	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return nil, ErrWrongMarker
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}
