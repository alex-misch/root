# README #

Server side rendering for bmp components

*Optional*: add bundle.js of your project to bmp.application section of package.json

* up containers in your enviroment
```
docker-compose up -d
```

* get shell of container ssrbmp
```
docker-compose exec ssrbmp sh
```

* install dependencies
```
npm install
```

* RUN render script:
```
node --experimental-modules --no-warnings --experimental-vm-modules render.mjs --url=/
```
**OR**
```
npm start
```
