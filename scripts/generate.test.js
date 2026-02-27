const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseSlug, slugToDisplayName } = require('./generate.js');

test('parseSlug: strips banner- prefix and extension', () => {
  assert.equal(parseSlug('banner-ise-2026.gif'), 'ise-2026');
  assert.equal(parseSlug('banner-cedia-2025.gif'), 'cedia-2025');
  assert.equal(parseSlug('banner-hpbexpo-2026.png'), 'hpbexpo-2026');
  assert.equal(parseSlug('banner-ces-2027.jpg'), 'ces-2027');
});

test('slugToDisplayName: uppercases alphabetic parts, preserves numbers', () => {
  assert.equal(slugToDisplayName('ise-2026'), 'ISE 2026');
  assert.equal(slugToDisplayName('cedia-2025'), 'CEDIA 2025');
  assert.equal(slugToDisplayName('hpbexpo-2026'), 'HPBEXPO 2026');
  assert.equal(slugToDisplayName('ces-2027'), 'CES 2027');
});
