#!/bin/sh
set -eux

# PROJECT=${1:?'No `project_name` provided'}
PROJECT='ci'

apt-get update
apt-get install -y jq
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
# .scripts/fmt.sh
# .scripts/build.sh

# build microservice related src
# go to micriservice src root
# cd ${PROJECT}

# fix, lint and build source code of microservice
# pip install --no-cache-dir -r requirements.txt
# pip freeze > requirements.txt
# ../.ci/scripts/fmt.sh
# ../.ci/scripts/build.sh
# # copy bin from /go/bin to our dir (conf needs it here)
# cp /go/bin/${PROJECT}-$(uname -s)-$(uname -m) ./${PROJECT}

# set application variables for run base
# TODO move to special config in future named boomfunc.yaml
# TODO https://github.com/urfave/cli#values-from-alternate-input-sources-yaml-toml-and-others
export BMP_DEBUG_MODE=true
export BMP_CONFIG='./ci/router.yml'
# export BMP_CONFIG='https://bitbucket.org/!api/2.0/snippets/letsnetdevinternal/eazARA/files/example.yml'
export BMP_APPLICATION_LAYER='http'
export BMP_DEBUG_MODE=true
# export BMP_WORKER_NUM=8

# run base
go get -d ./base/...

# calculate base variables
TIMESTAMP=`date +%s`
VERSION="${CIRCLE_TAG:=LOCAL}"

# calculate build/compile specific variables
ldflags="-X 'main.VERSION=${VERSION}' -X 'main.TIMESTAMP=${TIMESTAMP}'"

# download via go
go build \
	-v \
	-ldflags "${ldflags}" \
	-o /boomfunc/base \
	./base

# download via curl
# curl https://github.com/boomfunc/base/releases/download/3.0.0-rc4/base-$(uname -s)-$(uname -m) \
# 	--create-dirs \
# 	--location \
# 	--output /boomfunc/base
# chmod +x /boomfunc/base


# /go/bin/base-Linux-x86_64 run tick
# /go/bin/base-Linux-x86_64 run tcp
/boomfunc/base run tcp
