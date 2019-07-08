#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}
BASE=`basename $(realpath "${NODE}")`

### PHASE 1. Preparing
# install external dependencies on docker image
curl -sL https://deb.nodesource.com/setup_10.x | bash -
apt-get update
apt-get install -y nodejs
npm ci --production --prefix=${NODE}

### PHASE 2. Building and compiling
# build base for runnning as binary
# fix, lint and build source code of base app
.scripts/fmt.sh 'base'
.scripts/build-bin.sh 'base'

# build microservice related src
# this is cli that will be invoked by `base` (for example)
.scripts/fmt.sh ${NODE}
.scripts/build.sh ${NODE}

# move necessary (bins, libs, etc) from /go/bin to our dir (conf needs it here because related path to node root)
mv /go/bin/${BASE}-*-* ./${NODE}

### PHASE 3. Running
# NOTE: run under ${NODE} directory as root
cd ${NODE}

# run base with microservice cli onboard
# set application variables for run base
# TODO move to special config in future named boomfunc.yaml
# TODO https://github.com/urfave/cli#values-from-alternate-input-sources-yaml-toml-and-others
BMP_BASE_DEBUG_MODE=true \
BMP_BASE_CONFIG='./router.yml' \
BMP_BASE_APP_LAYER='http' \
	/go/bin/base-$(uname -s)-$(uname -m) run tcp

# move back to monorepo root
cd -
