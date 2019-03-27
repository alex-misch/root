FROM scratch

# Copy our static executable
COPY /go/bin/base-Linux-x86_64 /boomfunc/base

# Trigger for check app can be execute on this OS
RUN /boomfunc/base --version

WORKDIR /boomfunc/app

ENTRYPOINT ["/boomfunc/base"]
CMD ["run", "tcp"]
