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

const { generateBannerTemplate } = require('./generate.js');

test('generateBannerTemplate: includes banner image with correct src and alt', () => {
  const html = generateBannerTemplate('banner-ise-2026.gif', 'ISE 2026');
  assert.ok(html.includes('../assets/banner-ise-2026.gif'), 'should include relative asset path');
  assert.ok(html.includes('alt="ISE 2026"'), 'should include display name as alt text');
});

test('generateBannerTemplate: includes all user placeholders', () => {
  const html = generateBannerTemplate('banner-ise-2026.gif', 'ISE 2026');
  assert.ok(html.includes('{{name}}'));
  assert.ok(html.includes('{{title}}'));
  assert.ok(html.includes('{{phone}}'));
  assert.ok(html.includes('{{meeting}}'));
});

test('generateBannerTemplate: banner image is full width (440px)', () => {
  const html = generateBannerTemplate('banner-ise-2026.gif', 'ISE 2026');
  assert.ok(html.includes('width="440"'));
});

test('generateBannerTemplate: includes legal disclaimer', () => {
  const html = generateBannerTemplate('banner-ise-2026.gif', 'ISE 2026');
  assert.ok(html.includes('Olibra LLC'));
});
