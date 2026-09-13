# South Bank — Vercel Deployment

This project is a static/learning banking dashboard. It is **not production banking software** and must not use real customer credentials, financial data, or real banking operations.

## Deployment settings

- **Repository:** `JamesHD001/South-Bank`
- **Framework preset:** Other
- **Root directory:** repository root
- **Build command:** leave empty
- **Output directory:** leave empty
- **Install command:** `npm install`
- **Node.js:** 22+

`vercel.json` routes `/api/*` to the Vercel Node function in `api/index.js` and serves the frontend from `bank/`.

## Required environment variable

Add this variable in the Vercel project settings for Production, Preview, and Development:

```text
SESSION_SECRET
```

Use a long random value. Do not commit the value to GitHub.

If the project is only being used as a classroom/demo deployment, the local fallback in `api/index.js` keeps the API usable when the variable is not configured. A real deployment should always set `SESSION_SECRET`.

## Optional admin variable

The API recognizes:

```text
ADMIN_TOKEN
```

However, changing account withdrawal-lock state is intentionally disabled on the Vercel deployment because Vercel's runtime filesystem is read-only. The local `server.js` can still be used for development/admin testing.

For persistent admin/account state, replace the JSON-file storage with a real database before treating the application as anything more than a demo.

## Deploy from GitHub

1. Open Vercel and choose **Add New → Project**.
2. Import `JamesHD001/South-Bank`.
3. Keep the project root at the repository root.
4. Confirm Node.js 22+ is selected.
5. Add `SESSION_SECRET` under Environment Variables.
6. Deploy.

## Local verification

Run:

```bash
npm install
npm run check
npm start
```

The local server remains available through `server.js`; Vercel uses `api/index.js` for the deployed API.

## Important security note

The deployed app is intentionally a learning/demo system. The account data remains in the repository so the serverless function can authenticate the demo account, but it is no longer exposed through a public `/data/accounts.json` route. Do not put real passwords or personal/financial information in `data/accounts.json`.
