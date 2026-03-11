# Tenth Lining – Logo and brand colors

Brand assets (logo and color palette) are provided here:

**Google Drive:** https://drive.google.com/open?id=1fPqoCJz4Br2H6sdA4GAY0GhVk5TsI7TK&usp=drive_fs

## Applying the assets

1. **Logo**
   - Download the logo from the Drive link above.
   - Place the main logo in the frontend project: `public/logo.png` (or `public/logo.svg` if vector).
   - Use it in the header in `app/app.vue` (e.g. replace or complement the current “Tenth Lining” text with an image).

2. **Favicon**
   - Use the logo or a dedicated favicon from the Drive assets.
   - Put the favicon in `public/favicon.ico` (and optionally `public/favicon.svg`).
   - Reference it in `nuxt.config.ts` under `app.head.link` if needed.

3. **Colors**
   - Current primary palette is in `nuxt.config.ts` under `ui.theme.colors.primary`.
   - Update those values to match the hex codes from the brand assets in the Drive folder.
   - You can also update the gradient and accents in `app/app.vue` (e.g. `.app-shell` and `.dropzone-card` in the `<style>` section) to use the new primary colors.

After updating, rebuild the app so the new logo and colors are applied.
