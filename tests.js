
var test = require('tap').test;
var memoize = require('./');

var value = 0;

function resolves () {
	value++;
	return Promise.resolve(value);
}

function rejects () {
	value++;
	return Promise.reject(value);
}

test('caches resolved promises', async (t) => {
	t.plan(3);
	value = 0;
	var fn = memoize(resolves);

	t.equal(await fn(), 1, 'first call incremented');
	t.equal(await fn(), 1, 'second call not incremented');
	fn.purge();
	t.equal(await fn(), 2, 'third call incrementd');
});

test('does not cache rejections', async (t) => {
	t.plan(5);
	value = 0;
	var fn = memoize(() => (value ? resolves() : rejects()));

	await fn().then(
		() => t.fail('First call should have rejected'),
		() => {
			t.pass('First call rejected');
			t.equal(value, 1, 'First call incremented');
		}
	);

	t.equal(await fn(), 2, 'second call incremented again');
	t.equal(await fn(), 2, 'third call did not increment');
	fn.purge();
	t.equal(await fn(), 3, 'fourth call did increment');
});

test('relays arguments correctly', async (t) => {
	t.plan(7);
	value = 0;
	var fn = memoize((arg1) => Promise.resolve(arg1 + (++value)));

	t.equal(await fn('A'), 'A1', 'First call w/A incremented');
	t.equal(await fn('B'), 'B2', 'Second call w/B incremented');
	t.equal(await fn('B'), 'B2', 'Second call w/B incremented');
	t.equal(await fn('A'), 'A1', 'Third call w/A did not increment');
	t.equal(await fn('B'), 'B2', 'Fourth call w/B did not increment');
	fn.purge('A');
	t.equal(await fn('A'), 'A3', 'Fifth call w/A after purging A did increment');
	t.equal(await fn('B'), 'B2', 'Sixth call w/B remains unpurged');
});

test('caches non-promises as promises', async (t) => {
	value = 0;
	var fn = memoize((arg1) => arg1 + (++value));

	var result = fn('A');
	t.equal(typeof result.then, 'function', 'Result is a promise');

	t.equal(await result, 'A1', 'First Call');
	t.equal(await fn('A'), 'A1', 'Second Call');
	t.equal(await fn('B'), 'B2', 'Third Call');
});


test('prunes stale values', async (t) => {
	value = 0;
	var fn = memoize((arg1) => arg1 + (++value), { maxAge: -1 });

	t.equal(fn._cache.length, 0, 'Cache is empty');

	t.equal(await fn('A'), 'A1', 'First Call');
	t.equal(await fn('A'), 'A2', 'Second Call');

	t.equal(fn._cache.length, 1, 'Cache contains one item');

	fn.prune();

	t.equal(fn._cache.length, 0, 'Cache is empty');

});

test('resolves an undefined return', async (t) => {
	value = 0;
	var fn = memoize(() => {
		if (value++) return value;
	});

	var result = fn();

	t.notEqual(typeof result, 'undefined', 'Did not get back an undefined value');
	t.equal(typeof result.then, 'function', 'Did get back a promise');
	t.equal(typeof (await result), 'undefined', 'Promise resolved with undefined');
	t.equal(typeof (await fn()), 'undefined', 'Second invocation still returned undefined');
});

test('catches a thrown exception', async (t) => {
	t.plan(1);
	value = 0;
	var fn = memoize(() => {
		throw new Error('BAH!');
	});

	await fn().then(
		() => t.fail(),
		(e) => {
			t.equal(e.message, 'BAH!');
		}
	);
});

