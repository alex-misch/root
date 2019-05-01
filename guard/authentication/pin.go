package authentication

// PinChallenge returns challenge based on random pin code generation
// By pin code we mean a nonnegative N-length integer.
func PinChallenge(length int) Challenge {
	return &generator{
		length:  length,
		allowed: []byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'},
	}
}
