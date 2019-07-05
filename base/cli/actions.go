package cli

import (
	"fmt"
	"net"
	"net/http"
	"strings"

	"github.com/boomfunc/root/base/server"
	"github.com/boomfunc/root/base/server/mux"
	"github.com/boomfunc/root/base/tools"
	"github.com/boomfunc/root/base/tools/poller"
	tcli "github.com/boomfunc/root/tools/cli"
	"github.com/boomfunc/root/tools/log"
	"github.com/boomfunc/root/tools/router"
	"github.com/urfave/cli"
)

var (
	// Actions
	runCommandUsage     = "Run creates concrete type of server and listen for incoming requests. Choose subcommand"
	runUDPCommandUsage  = "Run UDP application server"
	runTCPCommandUsage  = "Run TCP application server"
	runHTTPCommandUsage = "Run HTTP application server"
	// Flags
	debugFlagUsage  = "Debugging mode"
	portFlagUsage   = "Port on which the listener will be"
	configFlagUsage = "Path to config file"
	appFlagUsage    = "Variant of server application layer"
)

func runCommandAction(c *cli.Context) {
	log.SetDebug(c.GlobalBool("debug"))

	// TODO: via c.App.Name
	// https://github.com/urfave/cli/issues/783
	tcli.StartupLog("base", c.App.Version, c.App.Compiled)

	// Exctract params
	transport := c.Command.Name
	application := c.GlobalString("app")
	ip := net.ParseIP("0.0.0.0")
	port := c.GlobalInt("port")
	workers := c.GlobalInt("workers")
	config := c.GlobalString("config")

	// Create server
	srv, err := server.New(transport, application, workers, ip, port, config)
	if err != nil {
		tools.FatalLog(err)
	}

	// Run
	server.StartupLog(strings.ToUpper(transport), strings.ToUpper(application), fmt.Sprintf("%s:%d", ip, port), config, srv)
	// blocking mode
	srv.Serve()
}

func runGolangCommandAction(c *cli.Context) {
	log.SetDebug(c.GlobalBool("debug"))

	// Phase 1. Create application layer (parse config)
	m, err := mux.FromFile(c.GlobalString("config"))
	if err != nil {
		// cannot load server config
		tools.FatalLog(err)
	}

	// Phase 2. Create transport layer. Create underlying listener and wrap it to poller listener.
	addr, err := net.ResolveTCPAddr("tcp", fmt.Sprintf("%s:%d", net.ParseIP("0.0.0.0"), c.GlobalInt("port")))
	if err != nil {
		tools.FatalLog(err)
	}
	tcpl, err := net.ListenTCP("tcp", addr)
	if err != nil {
		tools.FatalLog(err)
	}
	l, err := poller.Listener(tcpl)
	if err != nil {
		tools.FatalLog(err)
	}

	// Phase 3. Run golang server
	http.Serve(l, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		step := router.Mux(m).MatchLax(r.URL)
		h, _ := mux.StepHandler(step)
		h.ServeHTTP(w, r)
	}))
}
