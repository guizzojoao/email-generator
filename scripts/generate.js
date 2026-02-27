const fs = require('node:fs');
const path = require('node:path');

/**
 * 'banner-ise-2026.gif' → 'ise-2026'
 */
function parseSlug(filename) {
  return filename.replace(/^banner-/, '').replace(/\.[^.]+$/, '');
}

/**
 * 'ise-2026' → 'ISE 2026'
 * Alphabetic parts are uppercased; numeric parts are kept as-is.
 */
function slugToDisplayName(slug) {
  return slug
    .split('-')
    .map(part => (isNaN(part) ? part.toUpperCase() : part))
    .join(' ');
}

module.exports = { parseSlug, slugToDisplayName };
