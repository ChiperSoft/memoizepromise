'use strict';

var memoize = require('memoizesync');

module.exports = exports = function memoizePromise (fn, options) {
	var memoizedFn = memoize(fn, options);
	var wrapper = function (...args) {
		var p = memoizedFn.apply(this, args);

		if (!p || typeof p.then !== 'function') {
			return p;
		}

		p.then(null, memoizedFn.purge(...args));

		return p;
	};

	wrapper.purge = memoizedFn.purge.bind(memoizedFn);
	wrapper.purgeAll = memoizedFn.purgeAll.bind(memoizedFn);
	wrapper.prune = memoizedFn.cache.prune.bind(memoizedFn.cache);
	return wrapper;
};
