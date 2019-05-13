![Logo](nello.png)
# nello.io
nello one connects your intercom with your smartphone and Wi-Fi. This adapter connects your nello one to ioBroker using the official API (https://nellopublicapi.docs.apiary.io/).

This is a Node.js implementation of the nello.io API.

[![NPM version](http://img.shields.io/npm/v/nello.svg)](https://www.npmjs.com/package/nello)
[![Travis CI](https://travis-ci.org/Zefau/nello.io.svg?branch=master)](https://travis-ci.org/Zefau/nello.io)
[![Downloads](https://img.shields.io/npm/dm/nello.svg)](https://www.npmjs.com/package/nello)
[![Greenkeeper badge](https://badges.greenkeeper.io/Zefau/nello.io.svg)](https://greenkeeper.io/)

[![NPM](https://nodei.co/npm/nello.png?downloads=true)](https://nodei.co/npm/nello/)


## API documentation
The documentation for this Node.js implementation of the nello.io API can be found at https://zefau.github.io/nello.io/Nello.html.


## Usage
To use the API, add nello to the dependencies of your project in package.json or install it using npm
```npm install nello```.

### Generate token (only if you do not have a token)
Get Client ID and Client Secret from https://auth.nello.io/admin and generate a token at https://nelloauth.docs.apiary.io/#reference/0/token/create-a-new-token-client-credentials.

Get an empty instance of the constructor and call getToken() with the required credentials:

```js
const Nello = require('nello');

let nello = new Nello.auth(clientId, clientSecret);

nello.retrieveToken().then(function(token)
{
    // use token ...
    log(JSON.stringify(token));
})
.catch(function(e)
{
    // error fetching token
    log(JSON.stringify(e.message));
});
```

### Use nello API to get locations or open door
```js
const Nello = require('nello');

let nello = new Nello.device(token);

/*
 * Get locations
 */
nello.getLocations().then(function(locations)
{
    // use locations ...
    log(JSON.stringify(locations));
});

// open door of a location with locationId
nello.getLocation(locationId).then(function(location)
{
    // open door
    location.action.openDoor();
});
```


## Example
You may find a full implemented example at [https://github.com/Zefau/ioBroker.nello](https://github.com/Zefau/ioBroker.nello).


## Changelog

### 2.0.1 (2019-05-10)
- (zefau) Updated dependencies

### 2.0.0 (2019-01-29)
- (zefau) Changed API implementation to use promises (via [request-promise](https://www.npmjs.com/package/request-promise))

### 1.x.x
The previous API implementation (using callbacks instead of promises) [can be found in the Github branch v1](https://github.com/Zefau/nello.io/tree/v1-callback).


## API Documentation (using JSDoc)
You may update the API documentation using JSDoc (https://github.com/jsdoc3/jsdoc#installation-and-usage):
```
jsdoc lib -d docs --template ../minami
```


## License
The MIT License (MIT)

Copyright (c) 2019 Zefau <zefau@mailbox.org>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
