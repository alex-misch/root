#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}

PROFILING_DIR="./${NODE}/.profiling"
rm -rf ${PROFILING_DIR}
mkdir -p ${PROFILING_DIR}

# run benchmarks with profiling and collect all data under
# ${NODE}/.profiling direcctory which must be in gitignore
go get -d -t ./${NODE}/...
go clean -testcache || true
GOGC=off go test -run=^$$ -bench=. -benchmem \
	-benchtime=2s \
	-o ${PROFILING_DIR}/bin.test \
	-cpuprofile ${PROFILING_DIR}/cpu.pprof \
	-memprofile ${PROFILING_DIR}/mem.pprof \
	-memprofilerate=1 \
	./${NODE}

# install dependencies for generating graph
apt-get update
apt-get install -y graphviz gv # for svg generation

# generate graph and binary output
# cpu data visualization
go tool pprof -svg ${PROFILING_DIR}/bin.test ${PROFILING_DIR}/cpu.pprof > ${PROFILING_DIR}/cpu.svg
go tool pprof -top ${PROFILING_DIR}/bin.test ${PROFILING_DIR}/cpu.pprof > ${PROFILING_DIR}/cpu.top

# memory data visualization
# NOTE:
# -inuse_space      Display in-use memory size
# -inuse_objects    Display in-use object counts
# -alloc_space      Display allocated memory size
# -alloc_objects    Display allocated object counts
for TYPE in 'alloc_objects' 'alloc_space' 'inuse_objects' 'inuse_space'; do
	go tool pprof -${TYPE} -svg ${PROFILING_DIR}/bin.test ${PROFILING_DIR}/mem.pprof > ${PROFILING_DIR}/mem_${TYPE}.svg
	go tool pprof -${TYPE} -top ${PROFILING_DIR}/bin.test ${PROFILING_DIR}/mem.pprof > ${PROFILING_DIR}/mem_${TYPE}.top
done

# TODO: goroutine data visualization

# NOTE: for profiling runnning apps:
# p := profile.Start(profile.CPUProfile, profile.ProfilePath("/go/src/github.com/boomfunc/root/base"), profile.NoShutdownHook)
#
# 	go func() {
# 		sigchan := make(chan os.Signal, 10)
#
# 		signal.Notify(sigchan, os.Interrupt)
# 		signal.Notify(sigchan, syscall.SIGTERM)
# 		signal.Notify(sigchan, syscall.SIGINT)
# 		signal.Notify(sigchan, syscall.SIGKILL)
#
# 		<-sigchan
# 		p.Stop()
# 		os.Exit(0)
# 	}()
