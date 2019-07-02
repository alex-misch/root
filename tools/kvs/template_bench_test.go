package kvs

// import (
// 	"testing"
//
// 	srvctx "github.com/boomfunc/root/base/server/context"
// )
//
// func BenchmarkStringsFromCtx(b *testing.B) {
//
// 	ctx := srvctx.New()
// 	srvctx.SetMeta(ctx, "ip", "1.1.1.1")
// 	srvctx.SetMeta(ctx, "ua", "foo 'bar' baz")
// 	srvctx.SetMeta(ctx, "url", "blog/love-chartered-flight's/")
//
// 	for i := 0; i < b.N; i++ {
// 		StringsFromCtx(ctx, []string{
// 			"node",
// 			"--url=/{{meta \"url\"}}",
// 			"--ip={{meta \"ip\"}}",
// 			"--user-agent='{{meta \"ua\"}}'",
// 		})
// 	}
// }

// import (
// 	"testing"
//
// 	srvctx "github.com/boomfunc/root/base/server/context"
// )
//
// func BenchmarkCmdSplitRender(b *testing.B) {
// 	ctx := srvctx.New()
// 	srvctx.SetMeta(ctx, "ip", "1.1.1.1")
// 	srvctx.SetMeta(ctx, "ua", "foo 'bar' baz")
// 	srvctx.SetMeta(ctx, "url", "blog/love-chartered-flight's/")
//
// 	for i := 0; i < b.N; i++ {
// 		CmdSplitRender(ctx, "node --url=/{{meta \"url\"}} --ip={{meta \"ip\"}} --user-agent='{{meta \"ua\"}}'")
// 	}
// }
