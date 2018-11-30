#!/bin/sh
set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
# NODE=${1:-.}
NODE='ci'

# install external dependencies on docker image
# apt-get update
# apt-get install -y jq
# apk add --update --no-cache \
# 	jq \
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
.scripts/build.sh 'base'

# build microservice related src
# this is cli that will be invoked by `base` (for example)
.scripts/fmt.sh ${NODE}
.scripts/build.sh ${NODE}

# copy necessary bins from /go/bin to our dir (conf needs it here because related path to node root)
cp /go/bin/${NODE}-$(uname -s)-$(uname -m) ./${NODE}

# TODO move to special config in future named boomfunc.yaml
# TODO https://github.com/urfave/cli#values-from-alternate-input-sources-yaml-toml-and-others
# export BMP_DEBUG_MODE=true
# export BMP_CONFIG='./ci/router.yml'
# export BMP_CONFIG='https://bitbucket.org/!api/2.0/snippets/letsnetdevinternal/eazARA/files/example.yml'
# export BMP_APPLICATION_LAYER='http'
# export BMP_WORKER_NUM=8

# run base with microservice cli onboard
# set application variables for run base
BMP_DEBUG_MODE=true \
BMP_CONFIG='./ci/router.yml' \
BMP_APPLICATION_LAYER='http' \
	/go/bin/base-$(uname -s)-$(uname -m) run tcp
