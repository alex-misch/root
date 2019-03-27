FROM scratch

# Copy our static executable
COPY base-Linux-x86_64 /boomfunc/base

WORKDIR /boomfunc/app

ENTRYPOINT ["/boomfunc/base"]
CMD ["run", "tcp"]
