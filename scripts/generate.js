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

/**
 * Returns the full HTML for a banner signature template.
 * The output is a self-contained <table> fragment (no <html>/<body> tags)
 * that index.html injects directly into the preview div.
 */
function generateBannerTemplate(bannerFile, displayName) {
  return `<table cellpadding="0" cellspacing="0" width="440" border="0" style="font-family: Verdana, sans-serif; font-size: 12px; line-height: 1.5; color: #878799;">
  <tr>
    <td style="vertical-align: top; width: 160px;">
      <img src="../assets/logo-email.gif" alt="Company Logo" width="130" />
    </td>
    <td style="vertical-align: top; padding-bottom: 16px; padding-top: 8px;">
      <strong style="color: #3A3B4C;">{{name}}</strong><br />
      <span style="color: #555555; display: inline-block;">{{title}}</span><br />
      <span id="phoneContainer">
        Tel: <a href="tel:{{phone}}" style="color: #0000EE; text-decoration: underline; display: inline-block; margin-right: 8px;">{{phone}}</a><br />
      </span>
      <span id="meetingLinkContainer">
        <a href="{{meeting}}" style="color: #0000EE; text-decoration: underline; display: inline-block;">Schedule a Meeting</a><br />
      </span>
      <span style="display: block; margin-top: 8px;"><a href="http://www.bondhome.io" style="color: #0000EE; text-decoration: underline;">www.bondhome.io</a></span>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="../assets/${bannerFile}" alt="${displayName}" width="440" />
    </td>
  </tr>
  <tr>
    <td colspan="2" style="color: #999999; font-size: 8px; padding-top: 8px; border-top: 1px solid #bcbec0;">
      This e-mail and any files transmitted with it are, unless otherwise marked, the property of Olibra LLC. This email is confidential and intended solely for the use of the individual(s) or entity to whom it is addressed. Any other use, retention, dissemination, forwarding, printing, or copying of this e-mail and any files transmitted with it without the written permission of Olibra LLC is strictly prohibited.
    </td>
  </tr>
</table>`;
}

module.exports = { parseSlug, slugToDisplayName, generateBannerTemplate };
