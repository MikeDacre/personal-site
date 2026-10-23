---
name: site-guardrails
description: >
  Load the ground rules, stack, and tooling for michaeldacre.com — Michael Dacre MD's
  personal Hugo site. Use this skill whenever work touches the personal site, the
  personal-site repository, michaeldacre.com, dacre.me, dacre.md, or anything under
  ~/sites/personal-site: writing content or templates, changing the Hugo config, working
  on the contact form, adjusting deployment, or answering "how does my site work again?".
  Trigger it even when the request sounds routine — "add a page", "fix the header",
  "change the footer" — because this site carries constraints that ordinary web work does
  not, and the failure mode is publishing something that breaches them.
---

# michaeldacre.com — guardrails

You are working on the personal website of **Michael (Mike) Dacre, MD**, a fully licensed
Family Medicine physician in California.

Read `CLAUDE/CLAUDE.md` in the repository before making changes, if it exists. It is
gitignored and local-only — on mobile, on the web, or in a fresh task with no filesystem,
it will not be reachable. This skill is the rule set of record; if it is all you have,
say so rather than guessing at detail it does not contain.

The original, far more detailed spec (formerly `docs/CLAUDE.md`; its numbered § references
are still cited in code comments) was deleted on 2026-10-22 and has not been recovered. If
a fuller `CLAUDE/CLAUDE.md` is restored, **it wins** where it disagrees with this skill.

## Why this site is not ordinary web work

Three things make it different, and each has bitten real projects:

1. **The repository is public and the author is a physician.** A leaked key is bad
   anywhere; here it sits next to a name a medical board can look up.
2. **A physician's website is regulated advertising** under California Business &
   Professions Code § 651. Testimonials and superlatives are not stylistic choices.
3. **Patients are half the audience**, and healthcare-adjacent sites are a frequent ADA
   Title III target. Accessibility is a legal surface, not a nice-to-have.

## The two audiences

Every decision gets checked against both, because they read in opposite ways.

**Employers, colleagues, recruiters, credentialing bodies** skim for credentials. Density
is a feature. They want training history, current role, board status, CV, publications.

**Current and prospective patients** read slowly, usually on a phone, often while anxious
or unwell. They want warmth, plain language, a photograph of a human, an explicit
statement of how Mike practises, and one obvious way to make contact.

When they conflict, patient legibility wins on the home page and general pages; employer
density wins on the CV and publications pages. Never resolve the conflict by making one
audience read the other's page.

**Tone:** plain, warm, direct, unhurried. Short sentences. No marketing voice, no
superlatives, no urgency devices, no sales-funnel CTAs. Patient-facing pages at roughly an
8th-grade reading level; professional register is fine on the CV and publications pages.

## Hard rules

These are hard failures. Breaching one is worse than not shipping.

**Secrets.** The repo is public and stays public. No API keys, tokens, passwords, private
keys, `.env`, or `.dev.vars` — ever. Secrets live only in Cloudflare Pages encrypted
environment variables. The Turnstile *site* key is public and may be committed; the
Turnstile *secret* key may not. Scan every diff before committing.

**PHI.** No protected health information anywhere — not in content, commit messages, test
fixtures, or comments. No patient names, initials, dates, conditions, photos, or anecdotes
identifiable to a real person. Clinical examples must be fictional composites, marked
`fictional: true` in front matter.

**Mike's personal data.** Never publish his DEA registration number — absolute. Never
publish home address, SSN, or date of birth. Work address only. Personal mobile only with
his explicit per-page confirmation. Medical licence number and NPI are public record but
do not add them unprompted.

**Advertising law (B&P § 651).** No patient testimonials or endorsements, even favourable
ones. No before/after imagery. No superiority claims ("best", "leading", "top-rated"). No
guaranteed outcomes. Scientific claims need a citation to peer-reviewed published work.
"Board certified" requires the certifying board's full name at comparable prominence.

**Accessibility.** WCAG 2.1 AA, mandatory. Contrast ≥ 4.5:1 body and ≥ 3:1 large text and
UI boundaries; full keyboard operability; visible focus indicators; semantic HTML with one
`<h1>` and no skipped levels; labelled inputs; errors in text not colour; works at 320px
and 200% zoom; respects `prefers-reduced-motion`; touch targets ≥ 44×44px. Target
Lighthouse Accessibility 100.

**Privacy.** No analytics of any kind — not Google Analytics, not Plausible, not
Cloudflare Web Analytics, not even cookieless. Do not add them and do not propose them. No
ad tech, no session recording, no fingerprinting. Self-host fonts. The only third-party
script anywhere is the Cloudflare Turnstile widget on the contact page.

**No blog.** There is no `/posts/` and no `content/posts/`. Do not create one.

**No npm.** No `package.json`, Node dependencies, Tailwind, PostCSS, bundler, or JS
framework. Hugo Pipes handles assets. JavaScript is minimal, vanilla, progressive
enhancement only. If a task appears to need npm, it is the wrong task — ask.

When a rule blocks something Mike explicitly asked for, surface the conflict and let him
decide. Never resolve it silently, and never work around a prohibition to be helpful.

## Stack

Hugo (extended) + Markdown, deployed to Cloudflare Pages, Cloudflare DNS/CDN/WAF in front.
Contact form is a Pages Function → Turnstile → Resend. No database, no persistence.

- Canonical hostname **`www.michaeldacre.com`**. The apex, `dacre.me`, and `dacre.md` all
  301 to it in one hop. The canonical host never redirects anywhere.
- `HUGO_VERSION` is pinned and mirrored in `.hugo-version` — never float it.
- Build: `hugo --minify --gc`, output `public`, production branch `main`.
- Theme: scaffolded from Hugo Serif; interim overrides live in root `layouts/`. **Never
  edit `themes/serif/`** — override in root `layouts/` instead; Hugo's lookup order
  prefers root. An edit inside `themes/` is a bug. Long-term plan (revised 2026-08-21):
  replace the theme wholesale with a different theme and customize it — choice open
  (Open Decision 7); candidates must need no npm, reach WCAG 2.1 AA, and ship no
  analytics, external fonts, or third-party origins.
- Sections: `/`, `/about/`, `/practice/`, `/cv/`, `/publications/`, `/contact/`,
  `/legal/privacy/`, `/legal/accessibility/`.
- Front matter needs `title`, `description`, `audience` (patients | colleagues | both),
  `date`, `lastmod`, `draft`. The `audience` field is load-bearing — never omit it.

## Repository layout

`~/sites/personal-site` — public repo, github.com/MikeDacre/personal-site.

`CLAUDE/` holds Claude-facing project notes (`CLAUDE.md`, `CHANGELOG.txt`, and
`ROADMAP.md` once rebuilt). It is **gitignored and local-only**, so it cannot reach GitHub.
A gitignored symlink `CLAUDE.md -> CLAUDE/CLAUDE.md` sits at the root so auto-discovery
resolves. Mike's rule: no loose `docs/`, `bin/` or similar directories in the repo root —
notes and tooling live under `CLAUDE/` or `.claude/`.

A plain `git status` at the root will **not** show changes in `CLAUDE/`. Never
`git add -f CLAUDE/`, never replace the root symlink with a real file.

## Tooling

**Desktop Commander is the primary tool for local files and shell.** Prefer it over the
Cowork device bridge for anything in `~/sites/personal-site` — the bridge cannot delete
files, which strands `.git/*.lock` files and blocks every later git command. Desktop
Commander runs a real zsh with real permissions. Its `write_file` caps at 50 lines per
call, so chunk long files or use a heredoc through `start_process`.

Git and `gh` may be run directly. **Local commits on a working branch to track your work
are encouraged** (policy set by Mike 2026-08-16), as are version bumps when a milestone
lands. **Anything that leaves the machine needs Mike's explicit, per-instance approval:**
`git push` of any branch or tag, creating or editing a GitHub release, and merging to
`main` (which auto-deploys once Cloudflare Pages is connected). Never force-push, never
rewrite history.

Approved connectors: **Resend** (contact-form domain verification and delivery logs),
**Cloudflare Developer Platform** (docs search, read-mostly), **PubMed** (building
`/publications/`), **NPI Registry**, **Figma**, **Excalidraw** (docs diagrams only, never
site content), **Bitly** (only if the old `mdd.li` links carry over — ask first).

Two connector rules worth stating plainly:

- **Never call Resend `create-api-key`.** A key created through the connector lands in the
  conversation transcript. Mike creates it in the dashboard and pastes it into Cloudflare
  himself. Resend broadcast, contact, segment, and automation tools are also off — this
  project sends no marketing email and keeps no lists.
- **Never create Cloudflare D1, R2, or KV resources.** The contact form is specified to
  store nothing, so reaching for persistence means the design went wrong.

Useful skills: `design:accessibility-review` before calling anything done,
`design:ux-copy` for contact-form microcopy, `modern-web-guidance` for current HTML/CSS
practice — but if it suggests npm or a framework, the no-npm rule wins.

Connected but **not** for this project: Todoist, Notion, Google Calendar, Google Drive,
Box, Zoom, Gmail, PayPal, and the clinical/research connectors. `CLAUDE/ROADMAP.md` is the
tracker (to be rebuilt) — do not mirror project tasks into Todoist or Notion.

## Routing — which tool for which task

**The sandwich:** this skill opens the work; `michaeldacre-site:content-review` closes it.
Loading the guardrails at the start is what stops a rule being missed; running the review
at the end is what stops a breach reaching the public. Neither substitutes for the other.

| When you are…                                 | Use                                             |
|-----------------------------------------------|-------------------------------------------------|
| About to publish, commit, merge, or deploy    | `michaeldacre-site:content-review`              |
| Handling a changed CV                         | `michaeldacre-site:cv-update`                   |
| Touching local files, shell, or git           | Desktop Commander                               |
| Writing HTML or CSS for the theme             | `modern-web-guidance` first, then write         |
| Auditing one page's accessibility in depth    | `design:accessibility-review`                   |
| Wording a form field, error, notice, button   | `design:ux-copy`                                |
| Choosing colours or font pairings             | `theme-factory`, then contrast-check            |
| Judging a layout against both audiences       | `design:design-critique`                        |
| Building `/publications/`                     | PubMed connector                                |
| Debugging contact-form email delivery         | Resend connector — read-only tools only         |
| Reading the CV `.docx` / `.pdf`               | Word connector / PDF Tools connector            |
| Verifying focus rings, keyboard order, 320px  | Claude in Chrome, against a real page           |
| GitHub issues, PRs, releases                  | `gh`                                            |

Overlaps, resolved so you do not hesitate:

- `content-review` covers accessibility at checklist depth alongside secrets, PHI, and
  § 651. Reach for `design:accessibility-review` when accessibility specifically needs
  scrutiny — a new component, a colour-system change, or a `content-review` finding worth
  investigating properly. Running both on a significant page is right, not redundant.
- The `docx` and `pdf` **skills** build documents. This project only **reads** them, which
  is what the Word and PDF Tools **connectors** do. Do not reach for the skills in the CV
  pipeline.
- `modern-web-guidance` sometimes recommends a framework, bundler, or npm dependency. Take
  its platform and CSS advice; the no-npm rule above wins on tooling.

Do not invoke for this project: `small-business`, `finance`, `legal`, `zoom-plugin`,
`bio-research`, `data`, `productivity`, `pdf-viewer`, `dataviz`, `canvas-design`,
`algorithmic-art`.

If only this skill is available and the sibling skills are not, the checks still apply —
you just run them yourself, and you should say that you are doing so.

## Before calling anything done

Build clean with `hugo --minify --gc`. Keyboard-only navigation works on changed pages.
Contrast verified. Headings semantic, one `<h1>`. Alt text present. Renders at 320px with
no horizontal scroll. Lighthouse Accessibility 100, Performance ≥ 95. Front matter
complete including `audience` and `lastmod`. Diff contains no secrets, no PHI, no DEA
number, no home address. Content passes the § 651 review. Privacy policy still accurate if
data handling changed. `CLAUDE/CHANGELOG.txt` updated.
