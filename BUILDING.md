# Building and deploying michaeldacre.com

A one-page quick start for building the site locally, working through GitHub, and
deploying with Cloudflare Pages. Current version: see [`VERSION`](VERSION).

## 1. Build the dev site locally

You need Git and Hugo **extended** — the version pinned in [`.hugo-version`](.hugo-version).

1. Install Hugo: `brew install hugo`
2. Confirm the build: `hugo version` — the output must contain `+extended` and should
   match `.hugo-version` (currently `0.164.0`).
3. Clone and enter the repo:

   ```bash
   git clone https://github.com/MikeDacre/personal-site.git
   cd personal-site
   ```

4. Run the dev server: `hugo server -D --navigateToChanged` — then open
   <http://localhost:1313>. Pages rebuild on save; `-D` includes drafts.
5. Check a production build before pushing anything:

   ```bash
   hugo --minify --gc
   ```

   Output goes to `public/`. The build must finish with **no errors and no warnings**.

To develop the contact form locally, build first and then serve `public/` through
Wrangler with a local `.dev.vars` file (gitignored — **never commit it**):

```bash
hugo --minify --gc
npx wrangler pages dev public --compatibility-date=2026-08-15
```

`.dev.vars` keys: `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
`CONTACT_FROM_EMAIL`.

## 2. Deploy to GitHub

1. Branch from `main`: `git checkout -b feat/short-name` (prefixes: `feat/`, `fix/`,
   `content/`, `chore/`).
2. Review your diff for anything secret-shaped, then commit with a conventional subject
   (imperative, ≤ 72 chars): `git commit -m "content: tighten practice page"`
3. Push and open a pull request:

   ```bash
   git push -u origin HEAD
   gh pr create --fill
   ```

4. Cloudflare Pages builds a preview for every PR — check the preview URL before
   merging. Merging to `main` deploys production automatically.

### Cutting a release

1. Bump [`VERSION`](VERSION) (SemVer; pre-releases use `-alpha`, `-beta`, `-rc.1` —
   e.g. `0.2.0-alpha`), update the project changelog, and commit.
2. Tag and build the release zip (`releases/` is gitignored, so the zip stays local):

   ```bash
   V=$(cat VERSION)
   git tag -a "v$V" -m "v$V" && git push origin "v$V"
   mkdir -p releases && git archive --format=zip \
     --prefix="michaeldacre-site-v$V/" -o "releases/michaeldacre-site-v$V.zip" HEAD
   ```

   Always use `git archive` — it packages only committed, tracked files, so ignored
   and local-only material can't end up in a release by accident.
3. Publish on GitHub (optional):

   ```bash
   gh release create "v$V" "releases/michaeldacre-site-v$V.zip" \
     --title "v$V" --generate-notes --prerelease
   ```

   Drop `--prerelease` once the version has no `-alpha`/`-beta`/`-rc` suffix.

## 3. Deploy with Cloudflare Pages (one-time setup)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** →
   select `MikeDacre/personal-site`.
2. Build settings: framework preset **Hugo**, build command `hugo --minify --gc`,
   output directory `public`, production branch `main`.
3. Add the environment variable `HUGO_VERSION`, set to the value in `.hugo-version`
   (`0.164.0`). Check the first build log confirms an **extended** Hugo build — the
   SCSS pipeline needs it.
4. Contact-form variables (Settings → Environment variables): `TURNSTILE_SECRET_KEY`
   and `RESEND_API_KEY` as **encrypted** secrets, plus `CONTACT_TO_EMAIL` and
   `CONTACT_FROM_EMAIL` (the from-address must be on a Resend-verified domain).
   Create the keys in the Turnstile and Resend dashboards — they never go in git.
5. Custom domain: add `www.michaeldacre.com` to the Pages project. Redirect the apex
   (`michaeldacre.com`), `dacre.me`, and `dacre.md` to it (301, single hop) using
   Cloudflare Bulk Redirects. SSL/TLS mode **Full (strict)**; **Always Use HTTPS** on.
6. WAF: add a rate-limiting rule for `POST /api/contact` (a sensible start: 5 requests
   per 10 minutes per IP).
7. After each production deploy, run Lighthouse (Accessibility must be **100**,
   Performance ≥ 95) and a `pa11y-ci` pass over the sitemap.

Headers and path-level redirects are configured in [`static/_headers`](static/_headers)
and [`static/_redirects`](static/_redirects) and ship with the build.
