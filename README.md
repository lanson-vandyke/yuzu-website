# yuzutalent.com

The live Yuzu Talent Agency website: Concept 10, "Good Trouble", from `yuzu-concepts/sites/10-good-trouble/`.

## How it runs (US$0 a month)

- **Hosting:** Cloudflare Pages (free plan), connected to this GitHub repo. Every push to `main` deploys.
- **Site:** static files in `public/`. No build step.
- **Enquiry form:** `public/js/yuzu-api.js` POSTs to `/api/enquiries`, a Pages Function in `functions/api/enquiries.js`. It validates the enquiry and forwards it to a Google Apps Script web app (`apps-script/Code.gs`). The script adds a row to the "Website Enquiries" Sheet in lanson@yuzutalent.com's Drive and emails hello@yuzutalent.com (a Google Group).

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

Edit `NOTIFY_TO` in the Apps Script editor (Extensions › Apps Script from the Sheet), then **Deploy › Manage deployments › Edit › New version**. Also update `apps-script/Code.gs` here to match.
