1. cd into bmp-core dir
2. run "$docker-compose up -d" to start a docker container
3. "$docker-compose exec bmpcore sh" to fall into created container container
At the time there's no watch task at the system, run $node utility/build.js

What is in the package?
Module to use with components that uses jsx syntax,
use
at your component start with comments /** @jsx BMPVD.createBMPVirtulaDOMElement */
