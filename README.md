# yuzutalent.com

The live Yuzu Talent Agency website. It started as Concept 10, "Good Trouble", from `yuzu-concepts/sites/10-good-trouble/`, and has since been restyled.

## How it runs (US$0 a month)

- **Hosting:** Cloudflare Pages (free plan), connected to this GitHub repo. Every push to `main` deploys.
- **Site:** static files in `public/`. No build step.
- **Enquiry form:** `public/js/yuzu-api.js` POSTs to `/api/enquiries`, a Pages Function in `functions/api/enquiries.js`. It validates the enquiry and forwards it to a Google Apps Script web app (`apps-script/Code.gs`). The script adds a row to the "Website Enquiries" Sheet in lanson@yuzutalent.com's Drive and emails the Google Group for that enquiry type: creators@yuzutalent.com for creators, brands@yuzutalent.com for brands, hi@yuzutalent.com for anything else.
- **Email links:** the "Say hi" section lists creators@, brands@ and hi@ as mailto links, and the footer links hi@. The form's error messages point to the same three addresses.

## Analytics

Google Analytics 4 counts visits. The Google tag (`GTM-PNXWFSK6`, measurement ID `G-YRZDS6G3H4`) is in the `<head>` of `public/index.html`. Reports are at analytics.google.com under the "Yuzu Talent Agency" account, owned by lanson@yuzutalent.com. To give someone access, go to Admin › Account access management.

`public/robots.txt` and `public/sitemap.xml` list the one page for search engines. Add any new page to the sitemap.

## Cloudflare Pages settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(empty)* |
| Build output directory | `public` |
| Variable `ENQUIRY_WEBHOOK_URL` | Apps Script web app `/exec` URL |
| Secret `ENQUIRY_WEBHOOK_SECRET` | Must match the `ENQUIRY_SECRET` script property in Apps Script |

## Editing the site

Edit the files in `public/`, commit, and push. Cloudflare redeploys in about a minute. The concept copy in `yuzu-concepts/` isn't used by the live site.

## Run locally

```bash
npx wrangler pages dev public
```

Put the two variables in a `.dev.vars` file (git-ignored) to test the form locally.

## Changing who gets enquiry emails

To change who is in an inbox, edit the members of the creators@, brands@ or hi@ Group in the Google Admin console; no code change is needed.

To change which address an enquiry type goes to, edit `NOTIFY_TO` / `NOTIFY_DEFAULT` in the Apps Script editor (script.google.com, signed in as lanson@), then **Deploy › Manage deployments › Edit › New version**. Also update `apps-script/Code.gs`, `functions/api/enquiries.js` and `public/js/yuzu-api.js` here to match, plus the mailto links in `public/index.html`.
