'use strict';

var LRU = require('lru-cache');


module.exports = exports = function memoizePromise (fn, options) {


	const { argumentsStringifier, context, ...lruOptions } = options || {};
	const UNDEFINED_RESULT = '\x1dUNDEFINED\x1d';

	const stringify = argumentsStringifier
		? (args) => 'function\x1d' + String(argumentsStringifier(args))
		: (args) => 'function\x1d' + args.map(String).join('\x1d')
	;

	const cache = new LRU(lruOptions);

	const wrapper = function (...args) {

		const key = stringify(args);
		var p = cache.get(key);

		if (p === UNDEFINED_RESULT) {
			return Promise.resolve();
		}

		if (typeof p !== 'undefined') {
			return p;
		}

		try {
			p = fn.apply(typeof context !== 'undefined' ? context : this, args);
		} catch (e) {
			return Promise.reject(e);
		}

		if (typeof p === 'undefined') {
			cache.set(key, UNDEFINED_RESULT);
			return Promise.resolve();
		}

		if (!p || typeof p.then !== 'function') {
			p = Promise.resolve(p);
		} else {
			p.then(null, () => cache.del(key));
		}

		cache.set(key, p);
		return p;
	};

	wrapper.purge = (...args) => cache.del(stringify(args));
	wrapper.purgeAll = () => cache.reset();
	wrapper.prune = () => cache.prune();
	wrapper._cache = cache;
	return wrapper;
};
