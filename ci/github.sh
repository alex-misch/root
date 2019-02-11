#!/bin/sh
set -eux

# JSON=`cat /dev/stdin`
# REF=$(echo $JSON | jq '.ref')
# URL=$(echo $JSON | jq '.repository.clone_url')
#
# echo ${REF}
# echo ${URL}

# ./ci-Linux-x86_64 --debug session --ref=${REF} --origin=${URL} run
./ci-Linux-x86_64 --debug session --ref='refs/heads/ci' --origin='https://github.com/agurinov/root' run
# ./ci-Linux-x86_64 --debug session --ref='97a76830214d62b24db687e483dcc29d7448d0ce' --origin='https://github.com/boomfunc/root' run
