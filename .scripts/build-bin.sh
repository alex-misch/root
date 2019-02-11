#!/bin/sh

<< ////

TODO:
use cross-compiling
$go get github.com/mitchellh/gox
$gox \
	-verbose \
	-osarch="linux/amd64 darwin/amd64" \
	-ldflags="-X main.VERSION=$CIRCLE_TAG -X main.TIMESTAMP=`date +%s`" \
	-output="/go/bin/{{.Dir}}-{{.OS}}-{{.Arch}}"

////

set -eux

# if first arg is node in monorepo graph - apply commands to this node (package),
# otherwise - to root (all repo nodes)
NODE=${1:-.}

go get -d ./${NODE}/...

# calculate base variables
BASE=`basename "${NODE}"`
TIMESTAMP=`date +%s`
VERSION="${CIRCLE_TAG:=LOCAL}"

# calculate build/compile specific variables
ldflags="-X 'main.NODE=${BASE}' -X 'main.VERSION=${VERSION}' -X 'main.TIMESTAMP=${TIMESTAMP}'"
### COMPILE

# linux 64 bit (alpine, ubuntu)
# NOTE: working
CGO_ENABLED=1 \
CC='gcc' \
GOOS=linux GOARCH=amd64 go build \
	`# -a # force rebuilding of packages that are already up-to-date` \
	`# -tags netgo # make sure we use built-in net package and not the system’s one` \
	-v \
	-ldflags '-w' `# disables debug letting the file be smaller` \
	-ldflags '-linkmode external' \
	-ldflags '-extldflags "-static"' \
	-ldflags "${ldflags}" \
	-o /go/bin/${BASE}-Linux-x86_64 \
	./${NODE} # otherwise -> go build: cannot use -o with multiple packages

# - macos
# CGO_ENABLED=1 \
# CC='o64-clang++' \
GOOS=darwin GOARCH=amd64 go build \
	`# -a # force rebuilding of packages that are already up-to-date` \
	`# -tags netgo # make sure we use built-in net package and not the system’s one` \
	-v \
	-ldflags '-w' `# disables debug letting the file be smaller` \
	-ldflags '-linkmode external' \
	-ldflags '-extldflags "-static"' \
	-ldflags "${ldflags}" \
	-o /go/bin/${BASE}-Darwin-x86_64 \
	./${NODE} # otherwise -> go build: cannot use -o with multiple packages

# - raspberry pi
# CC='arm-linux-musleabihf-gcc' \
# CGO_ENABLED=1 \
# CC='musl-gcc' \
GOOS=linux GOARCH=arm GOARM=7 go build \
	`# -a # force rebuilding of packages that are already up-to-date` \
	`# -tags netgo # make sure we use built-in net package and not the system’s one` \
	-v \
	-ldflags '-w' `# disables debug letting the file be smaller` \
	-ldflags '-linkmode external' \
	-ldflags '-extldflags "-static"' \
	-ldflags "${ldflags}" \
	-o /go/bin/${BASE}-Linux-arm \
	./${NODE} # otherwise -> go build: cannot use -o with multiple packages

# chmod binaries to executable
chmod +x /go/bin/${BASE}-Linux-x86_64
chmod +x /go/bin/${BASE}-Linux-arm
chmod +x /go/bin/${BASE}-Darwin-x86_64
