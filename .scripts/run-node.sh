#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}

# install external dependencies on docker image
curl -sL https://deb.nodesource.com/setup_10.x | bash -
apt-get update
apt-get install -y nodejs
npm install --prefix=${NODE}
# apk add --update --no-cache \
	# jq \
	# git \
	# imagemagick \
	# python \
	# curl \
	# py-pip
	# py-lxml
	# chromium \

# build base
# fix, lint and build source code of base app
.scripts/fmt.sh 'base'
.scripts/build-bin.sh 'base'

# build microservice related src
# this is cli that will be invoked by `base` (for example)
.scripts/fmt.sh ${NODE}
.scripts/build.sh ${NODE}

# copy necessary (bins, libs, etc) from /go/bin to our dir (conf needs it here because related path to node root)
# TODO: resolve: cp /go/bin/${NODE}-$(uname -s)-$(uname -m) ./${NODE}

# run base with microservice cli onboard
# set application variables for run base
# TODO move to special config in future named boomfunc.yaml
# TODO https://github.com/urfave/cli#values-from-alternate-input-sources-yaml-toml-and-others
BMP_BASE_DEBUG_MODE=true \
BMP_BASE_CONFIG="./${NODE}/router.yml" \
BMP_BASE_APP_LAYER='http' \
BMP_BASE_WORKER_NUM=2 \
	/go/bin/base-$(uname -s)-$(uname -m) run tcp
