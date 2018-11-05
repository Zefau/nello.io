![Logo](nello.png)
# nello.io
nello one connects your intercom with your smartphone and Wi-Fi. This adapter connects your nello one to ioBroker using the official API (https://nellopublicapi.docs.apiary.io/).

This is a Node.js / javascript implementation of the nello.io API.

[![NPM version](http://img.shields.io/npm/v/nello.svg)](https://www.npmjs.com/package/nello)
[![Downloads](https://img.shields.io/npm/dm/nello.svg)](https://www.npmjs.com/package/nello)

[![NPM](https://nodei.co/npm/nello.png?downloads=true)](https://nodei.co/npm/nello/)


## API documentation
The documentation for this javascript implementation of the nello.io API can be found at https://zefau.github.io/nello.io/Nello.html.


## Usage
To use the API, add nello to the dependencies of your project in package.json or install it using npm
```npm install nello```.

Get Client ID and Client Secret from https://auth.nello.io/admin and generate a token at https://nelloauth.docs.apiary.io/#reference/0/token/create-a-new-token-client-credentials.

Provide the credentials to the Nello class / constructor:

```js
const Nello = require('nello');

var nello = nello = new Nello({'clientId': '...', 'clientSecret': '...', 'tokenType': '...', 'tokenAccess': '...');

// get locations
nello.getLocations(function(res) { ... });

// open door of a location with locationId
nello.openDoor(locationId);
```


## Example
You may find a full implemented example at https://github.com/Zefau/ioBroker.nello (respectively https://github.com/Zefau/ioBroker.nello/blob/master/main.js).


## Changelog

### 0.4.5 (2018-11-04)
- (zefau) added HTTPs support for webhooks (which however does not seem to be supported by the Nello API)

### 0.4.3 / 0.4.4 (2018-11-03)
- (zefau) fixed invalid module exports

### 0.4.0 (2018-11-03)
- (zefau) initial release


## License
The MIT License (MIT)

Copyright (c) 2018 Zefau <zefau@mailbox.org>

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
