
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

test('caches resolved promises', (t) => {
	t.plan(3);
	value = 0;
	var fn = memoize(resolves);

	return fn()
		.then((v) => {
			t.equal(v, 1, 'First call incremented');
			return fn();
		})
		.then((v) => {
			t.equal(v, 1, 'Second call did not increment');
			fn.purge();
			return fn();
		})
		.then((v) => t.equal(v, 2, 'Third call incremented'));
});

test('does not cache rejections', (t) => {
	t.plan(5);
	value = 0;
	var fn = memoize(() => (value ? resolves() : rejects()));

	return fn()
		.then(
			() => t.fail('First call should have rejected'),
			() => {
				t.pass('First call rejected');
				t.equal(value, 1, 'First call incremented');
				return fn();
			}
		)
		.then((v) => {
			t.equal(v, 2, 'second call incremented again');
			return fn();
		})
		.then((v) => {
			t.equal(v, 2, 'third call did not increment');
			fn.purge();
			return fn();
		})
		.then((v) => t.equal(v, 3, 'Fourth call did increment after purging'));
});

test('relays arguments correctly', (t) => {
	t.plan(6);
	value = 0;
	var fn = memoize((arg1) => Promise.resolve(arg1 + (++value)));

	return fn('A')
		.then((v) => {
			t.equal(v, 'A1', 'First call w/A incremented');
			return fn('B');
		})
		.then((v) => {
			t.equal(v, 'B2', 'Second call w/B incremented');
			return fn('A');
		})
		.then((v) => {
			t.equal(v, 'A1', 'Third call w/A did not increment');
			return fn('B');
		})
		.then((v) => {
			t.equal(v, 'B2', 'Fourth call w/B did not increment');
			fn.purge('A');
			return fn('A');
		})
		.then((v) => {
			t.equal(v, 'A3', 'Fifth call w/A after purging A did increment');
			return fn('B');
		})
		.then((v) => {
			t.equal(v, 'B2', 'Sixth call w/B remains unpurged');
		});
});

test('caches non-promises as normal', (t) => {
	value = 0;
	var fn = memoize((arg1) => arg1 + (++value));

	t.equal(fn('A'), 'A1', 'First Call');
	t.equal(fn('A'), 'A1', 'Second Call');
	t.equal(fn('B'), 'B2', 'Third Call');

	t.end();
});
