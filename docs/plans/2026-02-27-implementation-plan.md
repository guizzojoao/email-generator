# Email Signature Generator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the email signature generator as a GitHub Pages site where dropping a banner image into `assets/` automatically creates a new signature template and updates the employee-facing dropdown.

**Architecture:** Static site on GitHub Pages. A Node.js script (`scripts/generate.js`) scans `assets/banner-*.{gif,png,jpg}` and writes template HTML files + `templates/manifest.json`. A GitHub Actions workflow runs this script on every push that changes a banner file and commits the result back. The generator (`index.html`) fetches the manifest on load instead of using a hardcoded array.

**Tech Stack:** Plain HTML/CSS/JS (no framework), Node.js 20 (built-in `node:test` for testing), GitHub Actions, GitHub Pages.

---

## Before you start

All work happens in `/Users/joao/repos/email-generator/`. Run all commands from that directory unless told otherwise.

This directory currently lives inside a larger monorepo. The plan assumes you will push it to a **new standalone GitHub repository** for GitHub Pages to work. Steps for that are at the end.

---

## Task 1: Initialize project structure

**Files:**
- Create: `package.json`
- Create: `assets/.gitkeep`
- Create: `templates/.gitkeep`
- Create: `scripts/.gitkeep`
- Create: `.gitignore`

**Step 1: Create `package.json`**

```json
{
  "name": "email-signature-generator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "generate": "node scripts/generate.js",
    "test": "node --test scripts/generate.test.js"
  }
}
```

**Step 2: Create `.gitignore`**

```
node_modules/
.DS_Store
```

**Step 3: Create the directories**

```bash
mkdir -p assets templates scripts
touch assets/.gitkeep templates/.gitkeep
```

**Step 4: Commit**

```bash
git add package.json .gitignore assets/.gitkeep templates/.gitkeep
git commit -m "chore: initialize project structure"
```

---

## Task 2: Write failing tests for slug utilities

**Files:**
- Create: `scripts/generate.test.js`

These are the pure utility functions inside `generate.js`. Write the tests before the implementation.

**Step 1: Create `scripts/generate.test.js`**

```javascript
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
```

**Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: `ReferenceError` or `Cannot find module './generate.js'`

---

## Task 3: Implement slug utilities

**Files:**
- Create: `scripts/generate.js`

**Step 1: Create `scripts/generate.js` with only the utility functions**

```javascript
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
```

**Step 2: Run tests — verify they pass**

```bash
npm test
```

Expected: `✔ parseSlug: strips banner- prefix and extension` and `✔ slugToDisplayName: uppercases alphabetic parts, preserves numbers`

**Step 3: Commit**

```bash
git add scripts/generate.js scripts/generate.test.js
git commit -m "feat: add slug utility functions with tests"
```

---

## Task 4: Write failing tests for template generation

**Files:**
- Modify: `scripts/generate.test.js`

**Step 1: Add these tests at the bottom of `generate.test.js`**

```javascript
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
```

**Step 2: Run tests — verify new ones fail**

```bash
npm test
```

Expected: the new tests fail with `TypeError: generateBannerTemplate is not a function`

---

## Task 5: Implement template generation

**Files:**
- Modify: `scripts/generate.js`

**Step 1: Add `generateBannerTemplate` to `generate.js`**

Add this function before the `module.exports` line:

```javascript
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
```

**Step 2: Update `module.exports`**

```javascript
module.exports = { parseSlug, slugToDisplayName, generateBannerTemplate };
```

**Step 3: Run tests — verify all pass**

```bash
npm test
```

Expected: all 6 tests pass

**Step 4: Commit**

```bash
git add scripts/generate.js scripts/generate.test.js
git commit -m "feat: add banner template generator with tests"
```

---

## Task 6: Write failing tests for manifest generation

**Files:**
- Modify: `scripts/generate.test.js`

**Step 1: Add these tests at the bottom of `generate.test.js`**

```javascript
const { buildManifest } = require('./generate.js');

test('buildManifest: default template is always first', () => {
  const manifest = buildManifest(['banner-ise-2026.gif', 'banner-cedia-2025.gif']);
  assert.equal(manifest[0].id, 'default');
});

test('buildManifest: creates entry for each banner file', () => {
  const manifest = buildManifest(['banner-ise-2026.gif', 'banner-cedia-2025.gif']);
  assert.equal(manifest.length, 3); // default + 2 banners
});

test('buildManifest: banner entries are sorted alphabetically by displayName', () => {
  const manifest = buildManifest(['banner-ise-2026.gif', 'banner-cedia-2025.gif']);
  assert.equal(manifest[1].displayName, 'CEDIA 2025');
  assert.equal(manifest[2].displayName, 'ISE 2026');
});

test('buildManifest: each entry has id, fileName, displayName', () => {
  const manifest = buildManifest(['banner-ise-2026.gif']);
  const entry = manifest.find(t => t.id === 'ise-2026');
  assert.ok(entry, 'entry should exist');
  assert.equal(entry.fileName, 'signature-ise-2026.html');
  assert.equal(entry.displayName, 'ISE 2026');
});
```

**Step 2: Run tests — verify new ones fail**

```bash
npm test
```

Expected: `TypeError: buildManifest is not a function`

---

## Task 7: Implement manifest builder and wire up `run()`

**Files:**
- Modify: `scripts/generate.js`

**Step 1: Add `buildManifest` to `generate.js`** (before `module.exports`)

```javascript
/**
 * Given a list of banner filenames, returns the full manifest array.
 * Default template is always first; banner templates sorted alphabetically.
 */
function buildManifest(bannerFiles) {
  const bannerEntries = bannerFiles.map(bannerFile => {
    const slug = parseSlug(bannerFile);
    return {
      id: slug,
      fileName: `signature-${slug}.html`,
      displayName: slugToDisplayName(slug),
    };
  });

  bannerEntries.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return [
    { id: 'default', fileName: 'signature-default.html', displayName: 'Default' },
    ...bannerEntries,
  ];
}
```

**Step 2: Add the `run()` function** (after `buildManifest`, before `module.exports`)

```javascript
const ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'assets');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

function run() {
  const bannerFiles = fs.readdirSync(ASSETS_DIR)
    .filter(f => /^banner-.+\.(gif|png|jpg|jpeg)$/i.test(f))
    .sort();

  const manifest = buildManifest(bannerFiles);

  for (const entry of manifest) {
    if (entry.id === 'default') continue;
    const bannerFile = bannerFiles.find(f => parseSlug(f) === entry.id);
    const html = generateBannerTemplate(bannerFile, entry.displayName);
    fs.writeFileSync(path.join(TEMPLATES_DIR, entry.fileName), html + '\n');
  }

  fs.writeFileSync(
    path.join(TEMPLATES_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );

  console.log(`Generated ${manifest.length - 1} banner template(s).`);
  console.log(`Manifest written with ${manifest.length} template(s).`);
}

if (require.main === module) {
  run();
}
```

**Step 3: Update `module.exports`**

```javascript
module.exports = { parseSlug, slugToDisplayName, generateBannerTemplate, buildManifest };
```

**Step 4: Run all tests**

```bash
npm test
```

Expected: all 10 tests pass

**Step 5: Commit**

```bash
git add scripts/generate.js scripts/generate.test.js
git commit -m "feat: add manifest builder and run() entrypoint with tests"
```

---

## Task 8: Migrate existing files

**Files:**
- Create: `templates/signature-default.html`
- Create: `assets/logo-email.gif` (downloaded from S3)
- Create: `assets/banner-cedia-2025.gif` (downloaded from S3)
- Delete: `test/signature-default.html`, `test/signature-cedia2025.html`, `test/main.html`, `test/` directory
- Delete: `g-default-v1.html`, `g-video.html`, `sigature-video.html`

**Step 1: Download the logo from S3 into `assets/`**

```bash
curl -o assets/logo-email.gif "https://bond-marketing-assets.s3.us-east-1.amazonaws.com/Email+Signature+Generator/logo-email.gif"
```

Verify it downloaded: `ls -lh assets/logo-email.gif` — should be a non-zero file.

**Step 2: Download the CEDIA 2025 banner**

```bash
curl -o assets/banner-cedia-2025.gif "https://bond-marketing-assets.s3.us-east-1.amazonaws.com/Email+Signature+Generator/CEDIA25.gif"
```

**Step 3: Create `templates/signature-default.html`**

This is the base template. Copy from `test/signature-default.html` with one change: the logo `src` becomes a relative path.

```html
<table cellpadding="0" cellspacing="0" width="440" border="0" style="font-family: Verdana, sans-serif; font-size: 12px; line-height: 1.5; color: #878799;">
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
    <td colspan="2" style="color: #999999; font-size: 8px; padding-top: 8px; border-top: 1px solid #bcbec0;">
      This e-mail and any files transmitted with it are, unless otherwise marked, the property of Olibra LLC. This email is confidential and intended solely for the use of the individual(s) or entity to whom it is addressed. Any other use, retention, dissemination, forwarding, printing, or copying of this e-mail and any files transmitted with it without the written permission of Olibra LLC is strictly prohibited.
    </td>
  </tr>
</table>
```

**Step 4: Run `generate.js` to produce initial templates**

```bash
npm run generate
```

Expected output:
```
Generated 1 banner template(s).
Manifest written with 2 template(s).
```

Verify files were created:
```bash
ls templates/
# Should show: manifest.json  signature-cedia-2025.html  signature-default.html
```

Open `templates/manifest.json` and verify it looks like:
```json
[
  { "id": "default", "fileName": "signature-default.html", "displayName": "Default" },
  { "id": "cedia-2025", "fileName": "signature-cedia-2025.html", "displayName": "CEDIA 2025" }
]
```

**Step 5: Remove the `.gitkeep` placeholder from templates/ (it now has real files)**

```bash
rm templates/.gitkeep
```

**Step 6: Remove retired files**

```bash
rm -rf test/
rm g-default-v1.html g-video.html sigature-video.html
```

**Step 7: Commit everything**

```bash
git add assets/ templates/ scripts/generate.js
git rm -r test/ g-default-v1.html g-video.html sigature-video.html
git commit -m "feat: migrate assets and generate initial templates"
```

---

## Task 9: Build `index.html`

**Files:**
- Create: `index.html`

This is `test/main.html` promoted to the root, with two changes:
1. Template paths updated to `templates/signature-*.html`
2. Hardcoded `signatureTemplates` array replaced with a manifest fetch

**Step 1: Create `index.html`**

Copy the content of `test/main.html` (already deleted, but its content is in the design doc — use the structure below) into `index.html`. The JavaScript section should be:

Replace the `<script>` block entirely with this:

```html
<script>
  let currentSignatureTemplateContent = '';

  function toggleDarkMode() {
    const body = document.body;
    const newTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    document.getElementById('darkModeToggle').checked = newTheme === 'dark';
    localStorage.setItem('darkMode', newTheme);
  }

  function populateTemplateSelector(templates) {
    const selector = document.getElementById('templateSelector');
    selector.innerHTML = '';
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.displayName;
      selector.appendChild(option);
    });
    const last = localStorage.getItem('selectedSignatureTemplateId');
    if (last && templates.some(t => t.id === last)) {
      selector.value = last;
    }
    loadSignatureTemplate(templates);
  }

  async function loadSignatureTemplate(templates) {
    const selector = document.getElementById('templateSelector');
    const selectedId = selector.value;
    const templateInfo = (templates || window._templates).find(t => t.id === selectedId);
    if (!templateInfo) return;
    localStorage.setItem('selectedSignatureTemplateId', selectedId);
    try {
      const response = await fetch('templates/' + templateInfo.fileName);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      currentSignatureTemplateContent = await response.text();
      updateSignature();
    } catch (err) {
      document.getElementById('signaturePreview').innerHTML =
        '<p style="color:red;">Could not load template. Are you running from a web server?</p>';
    }
  }

  function checkCopyButtonState() {
    const name = document.getElementById('name').value.trim();
    const title = document.getElementById('title').value.trim();
    document.getElementById('copyButton').disabled = !(name && title);
  }

  function updateSignature() {
    const name = document.getElementById('name').value;
    const title = document.getElementById('title').value;
    const phone = document.getElementById('phone').value.trim();
    const meeting = document.getElementById('meeting').value.trim();

    let html = currentSignatureTemplateContent
      .replace(/{{name}}/g, name)
      .replace(/{{title}}/g, title)
      .replace(/{{phone}}/g, phone)
      .replace(/{{meeting}}/g, meeting)
      .replace(/{{logoUrl}}/g, '')
      .replace(/{{website}}/g, '')
      .replace(/{{company}}/g, '');

    document.getElementById('signaturePreview').innerHTML = html;

    const preview = document.getElementById('signaturePreview');
    const phoneContainer = preview.querySelector('#phoneContainer');
    if (phoneContainer) phoneContainer.style.display = phone ? 'inline-block' : 'none';
    const meetingContainer = preview.querySelector('#meetingLinkContainer');
    if (meetingContainer) meetingContainer.style.display = meeting ? 'inline-block' : 'none';

    checkCopyButtonState();
  }

  function copyToClipboard() {
    const html = document.getElementById('signaturePreview').innerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => {
      alert('Signature copied to clipboard!');
    }, () => {
      alert('Failed to copy. Please try again.');
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const saved = localStorage.getItem('darkMode');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
      document.getElementById('darkModeToggle').checked = saved === 'dark';
    }

    try {
      const res = await fetch('templates/manifest.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const templates = await res.json();
      window._templates = templates;
      populateTemplateSelector(templates);
    } catch (err) {
      document.getElementById('signaturePreview').innerHTML =
        '<p style="color:red;">Could not load signature templates. Make sure you\'re running from a web server (not file://).</p>';
    }

    document.getElementById('templateSelector').addEventListener('change', () => {
      loadSignatureTemplate(window._templates);
    });

    checkCopyButtonState();
  });
</script>
```

The HTML form structure (above the `<script>`) is identical to `test/main.html` — keep all the form fields, the preview div, the copy button, and the dark mode toggle. Add a small footer line just before `</body>`:

```html
<p style="text-align:center; font-size:11px; color:#aaa; margin-top:30px;">
  Are you a designer? <a href="preview.html">Open the banner preview tool</a>.
</p>
```

**Step 2: Manually verify it works**

Serve the directory locally (you need a web server because `fetch()` doesn't work over `file://`):

```bash
npx serve .
```

Open `http://localhost:3000` in a browser. Verify:
- Dropdown shows "Default" and "CEDIA 2025"
- Selecting a template and typing a name updates the preview live
- Copy button is disabled until name + title are filled
- Dark mode toggle works and persists on refresh

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add index.html with manifest-driven template selector"
```

---

## Task 10: Build `preview.html`

**Files:**
- Create: `preview.html`

**Step 1: Create `preview.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Banner Preview — Email Signature Generator</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; color: #333; }
    .container { max-width: 600px; margin: auto; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-size: 14px; font-weight: bold; }
    .form-group input[type="text"] {
      width: 100%; padding: 10px; box-sizing: border-box;
      border-radius: 8px; border: 1px solid #ccc; font-family: 'Inter', sans-serif; font-size: 14px;
    }
    .upload-area {
      border: 2px dashed #ccc; border-radius: 8px; padding: 24px;
      text-align: center; cursor: pointer; background: #fff; margin-bottom: 16px;
    }
    .upload-area:hover { border-color: #007bff; }
    .upload-area input[type="file"] { display: none; }
    .upload-area .hint { color: #888; font-size: 13px; margin-top: 6px; }
    .preview-box {
      border: 1px solid #ccc; padding: 20px; background: #fff;
      border-radius: 8px; margin-top: 20px;
    }
    .preview-box h2 { font-size: 14px; color: #888; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .next-steps {
      margin-top: 20px; background: #e8f4e8; border-radius: 8px;
      padding: 16px; font-size: 13px; line-height: 1.6;
    }
    .next-steps strong { display: block; margin-bottom: 6px; }
    .filename-tag {
      display: inline-block; background: #333; color: #fff;
      padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 13px;
    }
    .btn {
      display: inline-block; padding: 8px 16px; background: #007bff; color: #fff;
      border-radius: 8px; text-decoration: none; font-size: 13px; margin-top: 8px;
    }
    #noPreview { color: #aaa; font-size: 14px; text-align: center; padding: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Banner Preview</h1>
    <p class="subtitle">See how your banner looks in the full email signature before uploading to GitHub.</p>

    <div class="form-group">
      <label>Banner image</label>
      <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
        <div id="uploadLabel">Click to choose your banner image</div>
        <div class="hint">GIF, PNG, or JPG &nbsp;·&nbsp; 440px wide recommended</div>
        <input type="file" id="fileInput" accept=".gif,.png,.jpg,.jpeg" onchange="handleFile(this)" />
      </div>
    </div>

    <div class="form-group">
      <label for="eventName">Event name <span style="font-weight:normal;color:#888">(auto-filled from filename — edit if needed)</span></label>
      <input type="text" id="eventName" placeholder="e.g. ISE 2026" oninput="renderPreview()" />
    </div>

    <div class="preview-box">
      <h2>Signature preview</h2>
      <div id="previewContainer">
        <div id="noPreview">Choose a banner image above to see the preview.</div>
      </div>
    </div>

    <div class="next-steps" id="nextSteps" style="display:none;">
      <strong>Looks good? Here's what to do next:</strong>
      Upload your banner as <span class="filename-tag" id="suggestedFilename"></span> to the
      <code>assets/</code> folder in the GitHub repository.<br />
      The signature will appear automatically within ~2 minutes.
      <br />
      <a class="btn" id="githubUploadLink" href="#" target="_blank">Open assets/ folder on GitHub →</a>
      <br /><br />
      <a href="index.html" style="font-size:13px;">← Back to the signature generator</a>
    </div>
  </div>

  <script>
    // Update this to your actual GitHub repo URL
    const GITHUB_ASSETS_URL = 'https://github.com/YOUR-ORG/email-generator/upload/main/assets';

    let localImageUrl = null;

    function slugify(name) {
      return name.toLowerCase().replace(/\s+/g, '-');
    }

    function filenameToEventName(filename) {
      const slug = filename.replace(/^banner-/i, '').replace(/\.[^.]+$/, '');
      return slug
        .split('-')
        .map(part => (isNaN(part) ? part.toUpperCase() : part))
        .join(' ');
    }

    function handleFile(input) {
      const file = input.files[0];
      if (!file) return;

      if (localImageUrl) URL.revokeObjectURL(localImageUrl);
      localImageUrl = URL.createObjectURL(file);

      document.getElementById('uploadLabel').textContent = file.name;

      const derived = filenameToEventName(file.name);
      document.getElementById('eventName').value = derived;

      renderPreview();
    }

    function renderPreview() {
      if (!localImageUrl) return;

      const eventName = document.getElementById('eventName').value || 'Event Name';
      const slug = slugify(eventName);
      const suggestedFilename = `banner-${slug}.gif`;

      document.getElementById('previewContainer').innerHTML = `
        <table cellpadding="0" cellspacing="0" width="440" border="0" style="font-family: Verdana, sans-serif; font-size: 12px; line-height: 1.5; color: #878799;">
          <tr>
            <td style="vertical-align: top; width: 160px;">
              <img src="assets/logo-email.gif" alt="Company Logo" width="130" />
            </td>
            <td style="vertical-align: top; padding-bottom: 16px; padding-top: 8px;">
              <strong style="color: #3A3B4C;">Jane Smith</strong><br />
              <span style="color: #555555; display: inline-block;">Senior Engineer</span><br />
              <span>Tel: <a href="#" style="color: #0000EE; text-decoration: underline;">555-000-0000</a></span><br />
              <a href="#" style="color: #0000EE; text-decoration: underline;">Schedule a Meeting</a><br />
              <span style="display: block; margin-top: 8px;"><a href="http://www.bondhome.io" style="color: #0000EE; text-decoration: underline;">www.bondhome.io</a></span>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <img src="${localImageUrl}" alt="${eventName}" width="440" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td colspan="2" style="color: #999999; font-size: 8px; padding-top: 8px; border-top: 1px solid #bcbec0;">
              This e-mail and any files transmitted with it are, unless otherwise marked, the property of Olibra LLC.
            </td>
          </tr>
        </table>
      `;

      document.getElementById('noPreview').style.display = 'none';
      document.getElementById('suggestedFilename').textContent = suggestedFilename;
      document.getElementById('githubUploadLink').href = GITHUB_ASSETS_URL;
      document.getElementById('nextSteps').style.display = 'block';
    }
  </script>
</body>
</html>
```

**Step 2: Update the `GITHUB_ASSETS_URL` constant**

Replace `YOUR-ORG` in the script with the actual GitHub organization or username. You'll know this once the repo is created on GitHub (Task 12).

**Step 3: Manually verify**

Open `http://localhost:3000/preview.html`. Verify:
- Uploading a local image shows the signature preview with the banner
- Event name auto-populates from the filename
- Editing the event name updates the suggested filename in the "next steps" box
- The logo loads correctly (requires a web server)

**Step 4: Commit**

```bash
git add preview.html
git commit -m "feat: add designer banner preview page"
```

---

## Task 11: Create the GitHub Actions workflow

**Files:**
- Create: `.github/workflows/generate-templates.yml`

**Step 1: Create `.github/workflows/generate-templates.yml`**

```bash
mkdir -p .github/workflows
```

```yaml
name: Generate templates from banners

on:
  push:
    branches: [main]
    paths:
      - 'assets/banner-*'

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate templates and manifest
        run: node scripts/generate.js

      - name: Commit generated files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add templates/
          git diff --staged --quiet || git commit -m "chore: auto-generate templates from banners [skip ci]"
          git push
```

**Step 2: Commit**

```bash
git add .github/workflows/generate-templates.yml
git commit -m "ci: add workflow to auto-generate templates from banners"
```

---

## Task 12: Create the GitHub repository and push

**Step 1: Create a new private repository on GitHub**

Go to `github.com/new`. Set:
- Repository name: `email-generator`
- Visibility: **Private**
- Do NOT initialize with README or .gitignore (you already have files)

**Step 2: Add the remote and push**

```bash
git remote add origin https://github.com/YOUR-ORG/email-generator.git
git branch -M main
git push -u origin main
```

**Step 3: Update `GITHUB_ASSETS_URL` in `preview.html`**

Edit `preview.html` line with `const GITHUB_ASSETS_URL` — replace `YOUR-ORG` with your actual org name.

```bash
git add preview.html
git commit -m "chore: set GitHub assets URL in preview page"
git push
```

---

## Task 13: Enable GitHub Pages

**Step 1: In the GitHub repository, go to Settings → Pages**

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- Click Save

**Step 2: Wait ~2 minutes, then visit the Pages URL**

GitHub will show you the URL (e.g., `https://your-org.github.io/email-generator/`). Open it and verify:
- `index.html` loads with the template dropdown working
- "Default" and "CEDIA 2025" appear in the dropdown
- Selecting a template and typing a name renders the preview correctly

**Step 3: Share the URL with your colleagues**

---

## Task 14: Smoke test the full designer workflow

This verifies the entire automation pipeline works end-to-end before declaring the project done.

**Step 1: Create a dummy test banner**

```bash
cp assets/banner-cedia-2025.gif assets/banner-test-2099.gif
```

**Step 2: Push to GitHub**

```bash
git add assets/banner-test-2099.gif
git commit -m "test: add dummy banner to verify CI pipeline"
git push
```

**Step 3: Watch the Action run**

Go to your GitHub repo → **Actions** tab. You should see the "Generate templates from banners" workflow triggered. Wait for it to complete (green checkmark, ~30 seconds).

**Step 4: Verify the auto-commit**

In the repository, check the `templates/` folder. You should see `signature-test-2099.html` and an updated `manifest.json` with "TEST 2099" added.

**Step 5: Verify the live site**

Wait ~2 minutes for Pages to redeploy. Refresh `https://your-org.github.io/email-generator/`. The dropdown should now show "TEST 2099".

**Step 6: Clean up the test banner**

```bash
git rm assets/banner-test-2099.gif
git commit -m "test: remove dummy test banner"
git push
```

Wait for the Action to run again — it will remove `signature-test-2099.html` from `templates/` and update `manifest.json`.

---

## Done

The system is live. The designer workflow going forward:

1. Export banner → name it `banner-<show>-<year>.gif`
2. *(Optional)* Preview at `/preview.html`
3. Upload to `assets/` on github.com
4. New signature appears in the generator within ~2 minutes
