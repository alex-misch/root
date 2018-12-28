FROM node:10-alpine

ADD ./bundler /bundler

RUN apk upgrade && \
	apk add --update --no-cache --virtual ~/.build-deps python2 make && \
	npm config set unsafe-perm true && \
	cd /bundler && \
	npm install node-sass && \
	apk del ~/.build-deps && \
  	rm -rf /tmp/* /var/cache/apk/*

CMD node --experimental-modules /bundler/serve.mjs
