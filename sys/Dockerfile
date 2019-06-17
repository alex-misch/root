# Prepare app code (some compiling and other)
FROM golang:alpine as app

ADD . /boomfunc/app

# Build as plugin for base
RUN set -eux \
	&& apk add --update --no-cache --virtual .build-deps \
		git curl \
	\
	&& cd /boomfunc/app \
	\
	&& go get -v -d \
	&& go -buildmode=plugin \
		build main.go \
		-o sys-Linux-x86_64.so \
	\
	&& curl \
		--create-dirs \
		--location \
		https://geolite.maxmind.com/download/geoip/database/GeoLite2-City.tar.gz \
	| tar -zxf - --strip=1 \
	\
	&& rm \
		COPYRIGHT.txt \
		LICENSE.txt \
		README.txt \
	\
	&& stat GeoLite2-City.mmdb \
	\
	&& rm -rf /var/cache/apk/* \
	&& apk del .build-deps

# Final container, copy from builders
# Get pre-compiled base.
FROM boomfunc/base:latest as base

COPY --from=app /boomfunc/app /boomfunc/app
