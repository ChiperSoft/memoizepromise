memoizepromise
==============

A promise aware wrapper around [memoizesync](http://npm.im/memoizesync).
Supports all of the options memoizesync supports, but ensure that no rejections are cached.

## Installation

```
npm install --save memoizepromise
```

## Usage

```js
const memoize = require('memoizepromise');
const lookupUser = memoize(
	(username) => fetch('/api/user/' + username),
	{ maxAge: 60000 } // Cache it for 60 seconds
);

lookupUser('bob').then() // this call performs the fetch

lookupUser('bob').then() // this call gets the promise from above

lookupUser('linda').then() // this call triggers another fetch

lookupUser.purge('bob'); // removes the cached promise for bob
lookupUser('bob').then() // this call performs the fetch again

lookupUser.purgeAll(); // removes all cached promises;
```

By default the arguments are stringified and concatenated to serve as the caching key. Pass a function as the `argumentsStringifier` option to change the key calculation method.

```js
const getOrder = memoize(
	(order) => fetch('/api/order/' + order.id),
	{
		argumentsStringifier: (o) => o.id,
		maxAge: 1000 // Cache it for 1 second
	}
);
```
