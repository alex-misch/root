package trust

import (
	"crypto/aes"
	"errors"
	"fmt"
	"reflect"
	"testing"
)

func TestCreatePassphrase(t *testing.T) {
	tableTests := []struct {
		fingerprint []byte
		passphrase  []byte
	}{
		{nil, []byte("d41d8cd98f00b204e9800998ecf8427e")},
		{[]byte{}, []byte("d41d8cd98f00b204e9800998ecf8427e")},
		{[]byte("fingerprint"), []byte("52609e00b7ee307e79eb100099b9a8bf")},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			if passphrase := createPassphrase(tt.fingerprint); !reflect.DeepEqual(passphrase, tt.passphrase) {
				t.Fatalf("Expected %q, got %q", tt.passphrase, passphrase)
			}
		})
	}
}

func TestEncrypt(t *testing.T) {
	tableTests := []struct {
		// input
		data []byte
		key  []byte
		// output
		// raw      []byte
		err error
	}{
		{nil, nil, aes.KeySizeError(0)},
		{nil, []byte("a"), aes.KeySizeError(1)},
		{nil, []byte("d41d8cd98f00b204e9800998ecf8427e"), nil},
		{[]byte("data"), nil, aes.KeySizeError(0)},
		{[]byte("data"), []byte("d41d8cd98f00b204e9800998ecf8427e"), nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			_, err := encrypt(tt.data, tt.key)
			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
		})
	}
}

func TestDecrypt(t *testing.T) {
	key := []byte("d41d8cd98f00b204e9800998ecf8427e")
	data, err := encrypt([]byte("raw"), key)
	if err != nil {
		t.Fatal(err)
	}

	tableTests := []struct {
		// input
		data []byte
		key  []byte
		// output
		raw []byte
		err error
	}{
		{nil, nil, nil, aes.KeySizeError(0)},
		{nil, []byte("d41d8cd98f00b204e9800998ecf8427e"), nil, ErrWrongMarker},
		{[]byte("DKDKD"), []byte("d41d8cd98f00b204e9800998ecf8427e"), nil, ErrWrongMarker},
		{data, []byte("52609e00b7ee307e79eb100099b9a8bf"), nil, errors.New("cipher: message authentication failed")},
		{data, key, []byte("raw"), nil},
	}

	for i, tt := range tableTests {
		t.Run(fmt.Sprintf("%d", i), func(t *testing.T) {
			raw, err := decrypt(tt.data, tt.key)
			if !reflect.DeepEqual(err, tt.err) {
				t.Fatalf("Expected %q, got %q", tt.err, err)
			}
			if !reflect.DeepEqual(raw, tt.raw) {
				t.Fatalf("Expected %q, got %q", tt.raw, raw)
			}
		})
	}
}
