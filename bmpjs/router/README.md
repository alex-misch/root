# Bmp-router v0.0.1

This is a client-side router web-component.

## Getting Started

* Add web-components ^v1.0.0 to your project
* Add js bundle script tag to DOM and insert <bmp-router> tag into body. 
* Set data-config attribute to your config.js location

### Prerequisites

```
<!-- if your browser not support web-components -->
<script src="web-components.js"></script>
<nav>
    <bmp-anchor><a href="/">Home</a></bmp-anchor>
    <bmp-anchor><a href="/good-url">Url that defined in config.js</a></bmp-anchor>
    <bmp-anchor><a href="/bad-url">Url that not defined in config.js</a></bmp-anchor>
</nav>
<bmp-router data-config="config.js">
</bmp-router>
<script>
    var router = document.querySelector( 'bmp-router' )
    router.go( '/good-url' ) // -> will take content of view from config
    router.go( '/bad-url' ) // -> will put 404 error into view
</script>
```

## Browser support

* With __web-components.js__ polyfill
    * ✓   Edge    
    * ✓   IE 11+*    
    * ✓   Chrome*
    * ✓   Firefox*
    * ✓   Safari 9+*
    * ✓   Chrome Android*
    * ✓   Mobile Safari*

* Without polyfill
    * ×   Edge    
    * ×   IE      
    * ✓   Chrome 54+* 
    * ×   Firefox
    * ✓   Safari 10.1+*
    * ✓   Chrome Android 54+*
    * ✓   Mobile Safari 10.1*


### Installing

A project is based on npm package manager so you can install all dependencies via npm
```
npm install
```

If you want to generate docs feel free to run
```
npm run docs
```

When you end your developing run tests to watch your bugs/incompatibles
```
npm test
```

## Running the tests

All tests is inside __tests__ folder
You can easily run
```
npm install
npm test
```
and tests will be run

## Deployment

To deploy you must start your docker-machine and enter enviroment then up the container
```
docker-compose up -d 
docker-compose exec bmp-router sh
node bundler/build.js
```

## Built With

* [CustomElements](https://w3c.github.io/webcomponents/spec/custom/) - custom elements library used to initialize in old browsers
* [Babel](https://babeljs.io/) - a JavaScript compiler
* [Rollup](https://github.com/rollup/rollup) - Javascript module bundler
* [Jest](https://facebook.github.io/jest/) - Test framework
* [JSDoc](http://usejsdoc.org/) - Documentation framework

## Contributing

Bmp team

## Versioning

Actual version is hosted in Amazon AWS cloud

## Authors

in developing...

## License

in developing...

## Acknowledgments

in developing...
