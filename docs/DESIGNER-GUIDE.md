# Designer Guide — Email Signature Generator

This guide covers everything you need to know to add a new trade show signature or update an existing one. No code editing required.

---

## How it works

The email signature generator lives at a public URL that all Bond colleagues use to create their own signatures. When you add a new banner image to this repository, the system automatically creates a new signature template and adds it to the dropdown — no engineering work needed.

---

## Adding a new trade show signature

### Step 1 — Export your banner

Design the banner in Photoshop, Illustrator, or After Effects and export it. The banner should be **440px wide**. GIF, PNG, and JPG are all supported.

### Step 2 — Name the file correctly

The filename is the only rule you need to follow. Use this format:

```
banner-<show>-<year>.<ext>
```

**Examples:**

| Show | Filename |
|------|----------|
| ISE 2026 | `banner-ise-2026.gif` |
| CEDIA 2026 | `banner-cedia-2026.gif` |
| HPBExpo 2026 | `banner-hpbexpo-2026.png` |

The name you give the file is how it will appear in the dropdown for your colleagues. `banner-ise-2026.gif` becomes "ISE 2026".

### Step 3 — *(Optional)* Preview before publishing

Open the preview tool at `<org>.github.io/email-generator/preview.html` to see exactly how the full signature will look before you commit.

1. Click **Choose file** and pick your banner from your computer
2. Verify the event name is correct (it's auto-filled from the filename)
3. Check how the banner looks in the full signature context

Nothing is uploaded at this step — it's just a local preview.

### Step 4 — Upload the banner to GitHub

1. Go to the repository on github.com
2. Navigate to the **`assets/`** folder
3. Click **Add file → Upload files**
4. Drag in your banner file (e.g., `banner-ise-2026.gif`)
5. Scroll down and click **Commit changes**

That's it. You're done.

### What happens next (automatically)

Within about 2 minutes of your upload:

- GitHub automatically generates the signature template
- The dropdown on the generator is updated
- The live site redeploys

Your colleagues will see the new "ISE 2026" option in the generator the next time they load the page (or refresh).

---

## Updating an existing banner

If you need to update a banner (for example, the booth number changed after you already published it):

1. Export the updated banner
2. **Use the exact same filename** as the original (e.g., `banner-ise-2026.gif`)
3. Upload it to `assets/` on GitHub — it will replace the old file
4. The signature template updates automatically

---

## File size guidelines

Email clients load images every time someone opens an email. Keep banner files as small as possible:

| Format | Recommended max |
|--------|----------------|
| GIF (animated) | 400 KB |
| GIF (static) | 150 KB |
| PNG | 150 KB |
| JPG | 100 KB |

For animated GIFs, limit to 3–5 seconds and loop. Many email clients ignore animation after the first loop anyway.

---

## The default signature

The **Default** signature (no banner) is always available in the generator. It never changes and is not affected by anything you do in `assets/`.

---

## Questions?

If something doesn't look right or the dropdown hasn't updated after a few minutes, check the **Actions** tab in the GitHub repository to see if the automation ran successfully. If there's an error, reach out to the engineering team.
