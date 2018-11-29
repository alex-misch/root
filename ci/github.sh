#!/bin/sh
set -eux

JSON=`cat /dev/stdin`
REF=$(echo $JSON | jq '.ref')
URL=$(echo $JSON | jq '.repository.url')

echo ${REF}
echo ${URL}

# ./root-Linux-x86_64 --debug session --ref=${REF} --origin=${URL} run

echo 'FINAL'
