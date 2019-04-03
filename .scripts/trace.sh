#!/bin/sh
set -eux

strace \
	-e open,accept4,openat,write,close,read,epoll_ctl,epoll_pwait,epoll_wait,socket \
	-tt -o 'strace.out' \
	-E BMP_BASE_DEBUG_MODE=true \
	-E BMP_BASE_CONFIG='./router.yml' \
	-f \
	/go/bin/base-$(uname -s)-$(uname -m) run tcp



strace \
	-tt -o 'strace.out' \
	-E BMP_BASE_DEBUG_MODE=true \
	-E BMP_BASE_CONFIG='./router.yml' \
	-f \
	/go/bin/base-$(uname -s)-$(uname -m) run tcp
