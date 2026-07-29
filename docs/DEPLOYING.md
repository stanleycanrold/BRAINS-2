# Deploying — Vercel setup

This repo holds two deployables. They share a git repository and a small
tokens package, but they are **two separate Vercel projects**, each pointed at
a different folder in the same repo.

| What | Folder | Domain |
|---|---|---|
| The app (Clerk, Neon, Stripe, agents) | repo root | `app.nexabrains.io` |
| The marketing site + pSEO | `web/` | `nexabrains.io` |

Two projects rather than one, because they have different environment
variables, different build outputs, and different reasons to redeploy. A push
that only touches the app should not rebuild the marketing site.

---

## Deploying the marketing site (`web/`)

### 1. Create the project

On Vercel, **Add New → Project**, import `stanleycanrold/BRAINS-AI`.

Then, before the first deploy, open **Settings → Build and Deployment**:

| Setting | Value |
|---|---|
| **Root Directory** | `web` |
| Framework Preset | Next.js (auto-detected) |
| Build Command | leave as default (`next build`) |
| Install Command | leave as default |
| Output Directory | leave as default |

**Root Directory is the only setting that matters here, and it is the one
that is easy to miss.** Without it Vercel builds the app at the repo root and
deploys the wrong thing to the marketing domain.

Leave Install Command alone. This is an npm workspaces monorepo, and Vercel
detects the workspace root from `package-lock.json` and installs from there,
which is what makes the `@brains-ai/tokens` import resolve. Overriding the
install command with something scoped to `web/` will break that import.

### 2. Environment variables

**Settings → Environment Variables.** Both are public (`NEXT_PUBLIC_`), so
neither is a secret, but both must be set or links will point at localhost in
production.

| Name | Production value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://nexabrains.io` |
| `NEXT_PUBLIC_APP_URL` | `https://app.nexabrains.io` |

`NEXT_PUBLIC_SITE_URL` feeds canonical tags, `sitemap.xml`, `robots.txt`, and
Open Graph URLs. `NEXT_PUBLIC_APP_URL` is where every Log in, Sign up, and
composer submission sends people. Getting the second one wrong is the exact
bug that broke Stripe returns in the app earlier in this project: a URL that
drifted from where the thing was actually served.

Set both for **Production**, **Preview**, and **Development**.

### 3. Domain

**Settings → Domains → Add** `nexabrains.io`.

Vercel will show the DNS records to add at your registrar. For an apex domain
that is normally an `A` record to Vercel's IP; for `www` a `CNAME`. Add
`www.nexabrains.io` too and let Vercel redirect it to the apex, so the site
does not answer on two hostnames with duplicate content.

### 4. Deploy

Push to `main`, or hit Deploy. Nothing else is needed: every route on this
site is statically prerendered, so there are no serverless functions, no
database, and no runtime secrets involved.

---

## Deploying the app (repo root), when you get to it

Same import flow, second project, but:

- **Root Directory:** leave empty (repo root)
- **Domain:** `app.nexabrains.io`
- **Environment variables:** everything currently in `.env.local` — Clerk,
  Neon `DATABASE_URL`, Groq, Stripe secret and publishable keys,
  `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` set to
  `https://app.nexabrains.io`

Three things that need doing outside Vercel for the app, and will not be
obvious from a failing build:

1. **Clerk** needs `app.nexabrains.io` added as an allowed origin, and
   `nexabrains.io` registered as a satellite domain if the shared-session
   handoff from the marketing site is still wanted.
2. **Stripe** needs a live webhook endpoint at
   `https://app.nexabrains.io/api/webhooks/stripe`, and the signing secret it
   gives you set as `STRIPE_WEBHOOK_SECRET`. Until that exists, payments
   confirm only on return from checkout, so a customer who closes the tab
   mid-payment leaves an order unconfirmed.
3. **Neon** connection strings are region-specific. Use the pooled connection
   string for a serverless deployment, not the direct one.

---

## Optional: stop each project rebuilding for the other's changes

Once both projects exist, each will rebuild on every push to `main`, including
pushes that cannot possibly affect it. To stop that, set an **Ignored Build
Step** under Settings → Git.

For the **web** project:

```sh
git diff --quiet HEAD^ HEAD -- web packages
```

For the **app** project:

```sh
git diff --quiet HEAD^ HEAD -- src drizzle scripts package.json
```

Vercel cancels the build when the command exits `0`, which here means "nothing
this project depends on changed". Worth adding once both are live, not before.

---

## Moving to `brains-ai.com` later

Planned, and worth knowing the shape of it in advance since it is more than a
DNS change:

- Add the new domains in Vercel and keep the old ones pointed at the same
  projects, so nothing 404s during the switch.
- Update `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL`, which moves
  canonical tags and every internal link in one step.
- Redirect the old apex to the new one so accumulated search authority
  follows rather than being split across two hostnames.
- Update Clerk allowed origins, the Stripe webhook URL, and any OAuth
  callbacks before cutting over, not after.
