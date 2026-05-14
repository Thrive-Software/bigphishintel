# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common commands

The repo is split into a Node/Express backend at the repo root and a Create React App frontend in `client/`. They run as separate dev servers and are stitched together in production by serving `client/build` from Express.

### Backend (repo root)
- `npm install` — install backend deps
- `npm start` — runs `nodemon --exec babel-node app.js` (auto-reload; transpiles ES modules via Babel). The README's suggestion of plain `nodemon app.js` also works because `.babelrc` is present, but `npm start` is the canonical entry.
- `node scripts/initRootAdmin.js` — **must run once before first start** to create the root admin from `ADMIN_PASSWORD`. The Docker entrypoint runs this automatically; local dev does not.
- `npm run build` — Babel transpile to `dist/` (used by Docker, not by `npm start`).

### Backend tests
- The `npm test` script is a placeholder (`echo "Error: no test specified" && exit 1`). To actually run Jest: `npx jest`.
- Jest is configured in `jest.config.js` with `testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)']` and an 80% global coverage threshold. The single file under `tests/` (`test-ip-extraction.js`) does **not** match this pattern and is not picked up — new tests must use `*.test.js` / `*.spec.js` or live under `__tests__/`.
- Run a single test: `npx jest path/to/file.test.js` or `npx jest -t "test name"`.

### Frontend (`client/`)
- `cd client && npm install && npm start` — dev server on `:3000` (CRA / react-scripts 5).
- `npm run build` — production bundle to `client/build/`, served by Express in prod.
- `npm test` — react-scripts test runner.

### Docker
- `docker-compose up` — brings up MongoDB + app together (recommended). Data persists in the `phishintel_mongo_data` volume. `docker-compose down -v` wipes data.
- The Dockerfile is multi-stage: builds the React client, then copies `client/build` into the backend image. ENTRYPOINT is `docker-entrypoint.sh`, which runs `initRootAdmin.js` then `node app.js`.

### Required env vars
`NODE_ENV`, `DB_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET` are validated at startup in [app.js:17-31](app.js#L17-L31) and the process exits if any are missing. `PORT` defaults to 8080. Frontend optionally reads `REACT_APP_API_URL`.

## Architecture

PhishIntel is a phishing-simulation platform. The product flow is: an admin builds an **Audience** of **Contacts**, designs a **Template**, picks a **SenderProfile** (SMTP creds + identity), and launches a **Campaign**. The server sends a tracked email to each contact; clicks and credential submissions on the phishing page are recorded against per-recipient tracking rows.

### Backend layout (`MVC + services`)
The conventional Express layering is consistent across features:
- `routes/` — thin: declares paths and applies `authMiddleware`. `routes/index.js` is the single mount point ([app.js:67](app.js#L67)) and registers all `/api/*` routers.
- `controllers/` — request/response handlers; validate input and delegate to services or directly to models.
- `services/` — orchestration logic that touches multiple models or external systems (`emailService`, `smtpService`, `campaignService`, `templateService`, `aiIntegrationService`, `userService`).
- `models/` — Mongoose schemas. `models/index.js` is an aggregator.
- `middlewares/` — `authMiddleware` (JWT via `jsonwebtoken`), `errorHandler` (terminal handler in `app.js`), and two file-upload middlewares (`uploadCSV`, `uploadHTML`).
- `utils/` — generic helpers (notably `getClientIP`, which respects `trust proxy`).
- `scripts/initRootAdmin.js` — idempotent bootstrap for the root admin.
- `data/` — seed/reference data.

### The campaign flow (most important cross-file path)
1. `controllers/campaignController.js` creates a `Campaign` doc that references an `Audience`, a `Template`, and a `SenderProfile`. On launch, `CampaignTracking` rows are created — one per recipient — each with a `shortId`.
2. `services/campaignService.js` iterates tracking rows and calls `sendMultipleEmails(...)` in `services/emailService.js`.
3. `emailService.js`:
   - Builds a Nodemailer transport from the SenderProfile's SMTP fields. Auth is **omitted** if `email`/`password` are blank (open relays / unauthenticated SMTP).
   - Constructs the tracking link: `${origin}/account/signin?id=${shortId}&src=email`. This URL is exposed to the template via the `link` placeholder.
   - Renders the template with `templateService.renderTemplate(htmlContent, placeholders)`. Placeholders include the contact's fields plus the tracking `link` and metadata (`department`, `company`).
   - Sends via Nodemailer; updates the `CampaignTracking` row to `sent` or `failed` with attempt count and error.
4. When a target visits the link, `routes/emailClick` records the click. If they submit credentials, `routes/submission` records the submission. These are joined back to campaigns through `CampaignTracking.shortId`.

### SenderProfile FROM/Reply-To resolution
A SenderProfile's `email` field is **dual-purpose**: SMTP auth username AND the historical FROM-header source. The model now also has optional `fromAddress` and `replyTo` fields. In `emailService.js` the FROM is chosen as: `fromAddress` if valid → else `email` if valid → else hardcoded `no-reply@mail.com`. `replyTo` is only set on the outgoing mail when it's a valid email. Existing profiles without the new fields behave exactly as before.

### Frontend
React 18 + Material-UI v6 + react-router v6, talking to the backend via `axios`. Pages live under `client/src/pages/<Feature>/`, with hooks under `client/src/hooks/` (e.g. `useSenderProfiles`) wrapping API calls. The frontend is served as static files from `client/build` in production; in dev it runs separately on `:3000` and CORS in `app.js` whitelists `localhost:3000`.

## Conventions and gotchas

- **ES Modules + Babel.** `package.json` has `"type": "module"`. The backend is run through `babel-node` in dev and Node-native in prod. Use `import`/`export`, not `require`.
- **Production CORS is hardcoded** to `http://localhost:3000` in [app.js:43](app.js#L43). When deploying to a real host this needs to be changed — it is **not** read from env.
- **SMTP passwords are stored as plain text** in the SenderProfile. The controller comments `// Store password as plain text for now`. Do not silently "fix" this with hashing — that would break SMTP auth (Nodemailer needs the cleartext). Any encryption work has to also handle decryption at send time.
- **Dev logging redacts sensitive bodies** ([app.js:50-64](app.js#L50-L64)) for paths `/api/users/me/change-password` and `/api/integrations/ai`, on keys `password`/`currentPassword`/`newPassword`/`apiKey`. If you add a new route handling secrets, extend that list.
- **`trust proxy` is on.** Use `utils.getClientIP(req)` for real IPs; don't read `req.ip`/`req.connection.remoteAddress` directly.
- **No migration framework.** Schema changes are additive (new optional fields). For backfills, write a one-off script in `scripts/`.
- **Test directory naming is misleading.** `tests/test-ip-extraction.js` is not picked up by Jest's default `testMatch`. New tests need the `*.test.js` / `*.spec.js` suffix or to live under `__tests__/`.
- **The `email` field on SenderProfile is doubly meaningful** — it's both the SMTP username and the historical FROM address. When touching anything that reads it, check both call sites in `emailService.js` (auth block and FROM resolution).
