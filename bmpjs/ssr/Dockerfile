# Final container, copy from builders
# Get pre-compiled base
FROM boomfunc/base:latest as base

# compile plugin
FROM golang as plugin

ADD . /go/src/github.com/boomfunc/root/bmpjs/ssr

WORKDIR /go/src/github.com/boomfunc/root/bmpjs/ssr

RUN mkdir -p /boomfunc/app \
	\
	&& go build \
	-v \
	-buildmode=plugin \
	-o /boomfunc/app/ssr.so \
	./

# Prepare app code (some compiling and other)
FROM node:10.9-alpine

COPY --from=base /boomfunc/base /boomfunc/base
COPY --from=plugin /boomfunc/app /boomfunc/app

ADD . /boomfunc/app

WORKDIR /boomfunc/app

RUN set -ex \
	&& apk add --no-cache git \
	&& mkdir -p /lib64 \
	&& ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2 \
	&& npm install


ENTRYPOINT ["/boomfunc/base"]
CMD ["run", "tcp"]
