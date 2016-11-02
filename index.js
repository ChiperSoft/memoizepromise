'use strict';

var memoize = require('memoizesync');

module.exports = exports = function memoizePromise (fn, options) {
	var memoizedFn = memoize(fn, options);
	var wrapper = function () {
		var args = Array.from(arguments);
		var p = memoizedFn.apply(this, args);

		if (!p || typeof p.then !== 'function') {
			return p;
		}

		p.then(null, () => memoizedFn.purge.apply(memoizedFn, args));

		return p;
	};

	wrapper.purge = memoizedFn.purge.bind(memoizedFn);
	return wrapper;
};
