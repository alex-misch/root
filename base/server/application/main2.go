package application

// import (
// 	"context"
// )
//
// // Unpacker describes how we will parse data from the reader (socket, file, etc)
// // NOTE: this can be implemented to `flow.Step` by simple wrapper as
// // flow.Func(unpacker.Unpack)
// type Unpacker interface {
// 	Unpack(context.Context) error
// }
//
// // Packer describes how we will wrap raw answer for communication need
// // NOTE: this can be implemented to `flow.Step` by simple wrapper as
// // flow.Func(packer.Pack)
// type Packer interface {
// 	Pack(context.Context) error
// }
