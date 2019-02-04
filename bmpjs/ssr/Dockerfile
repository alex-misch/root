# Final container, copy from builders
# Get pre-compiled base
FROM boomfunc/base:latest as base

# compile plugin
go build \
	-v \
	-buildmode=plugin \
	-o /boomfunc/base/ssr.so \
	./

# Prepare app code (some compiling and other)
FROM node:10.9-alpine

COPY --from=base /boomfunc/base /boomfunc/base

ADD . /boomfunc/app

WORKDIR /boomfunc/app

RUN set -ex \
	&& apk add --no-cache git \
	&& mkdir -p /lib64 \
	&& ln -s /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2 \
	&& npm install


ENTRYPOINT ["/boomfunc/base"]
CMD ["run", "tcp"]
