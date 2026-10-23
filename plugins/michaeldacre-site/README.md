# michaeldacre-site

Guardrails, content review, and CV workflow for **michaeldacre.com** — the personal site
of Michael Dacre, MD.

## Why this exists

The full specification for the site lives in `docs/CLAUDE.md` in the
[personal-site repository](https://github.com/MikeDacre/personal-site). That directory is
deliberately gitignored and local-only, which means it is unreachable from a phone, from
the web app, or from any fresh task without filesystem access.

This plugin carries the parts that must never be missed — the hard rules and the review
gates — so they travel with the account instead of depending on a file being present.

`docs/CLAUDE.md` remains authoritative. Where the two disagree, it wins.

## Skills

| Skill              | Triggers on                                                       |
|--------------------|-------------------------------------------------------------------|
| `site-guardrails`  | Any work touching the site — content, templates, config, deploy.  |
| `content-review`   | Before publishing: B&P § 651, PHI, secrets, WCAG 2.1 AA.          |
| `cv-update`        | When the CV changes and needs republishing.                        |

**The sandwich:** `site-guardrails` opens the work, `content-review` closes it. The first
stops a rule being missed; the second stops a breach reaching the public. `cv-update`
assumes both, and calls `content-review` before the CV page ships.

`site-guardrails` also carries a routing table for the general-purpose tools — when to
reach for `modern-web-guidance`, `design:accessibility-review`, `design:ux-copy`,
`theme-factory`, and the connectors — plus the overlaps that would otherwise cause
hesitation. Notably: `content-review` is the broad gate across four dimensions while
`design:accessibility-review` goes deep on one; and the `docx`/`pdf` skills *build*
documents, whereas this project only *reads* them via the Word and PDF Tools connectors.

## What the rules actually are

A physician's personal website carries constraints ordinary web work does not:

- **The repository is public.** No secrets, ever. They live only in Cloudflare Pages
  encrypted environment variables.
- **No PHI**, anywhere — including anecdotes a reader in the same community could
  re-identify.
- **California B&P Code § 651** governs physician advertising: no testimonials, no
  before/after imagery, no superiority claims, no guaranteed outcomes, and board
  certification requires the certifying board's full name at comparable prominence.
- **WCAG 2.1 AA is mandatory.** Healthcare-adjacent sites are a frequent ADA Title III
  target, and it is the standard an employer's compliance office will assume.
- **No analytics of any kind**, including cookieless. **No blog. No npm.**
- **Never publish the DEA registration number**, home address, SSN, or date of birth.

## Stack it assumes

Hugo (extended) + Markdown → Cloudflare Pages, with Cloudflare DNS/CDN/WAF in front.
Contact form is a Pages Function → Turnstile → Resend, storing nothing. Canonical hostname
is `www.michaeldacre.com`; the apex, `dacre.me`, and `dacre.md` all 301 to it.

Repository at `~/sites/personal-site`. CV master copy at `~/Documents/Professional/CV/`.

## Connectors

No MCP servers are bundled — the connectors these skills reference (Resend, Cloudflare
Developer Platform, PubMed, NPI Registry, Figma) are configured at the account level.
Local tooling (Desktop Commander, PDF Tools, Word) comes through the desktop bridge.

Two connector rules the skills enforce, both worth knowing before you wonder why:

- **Never call Resend `create-api-key`** — a key created through a connector lands in the
  conversation transcript. Create it in the dashboard instead.
- **Never create Cloudflare D1, R2, or KV** — the contact form is specified to store
  nothing, so needing persistence means something has gone wrong upstream.

## Keeping it in sync

**This directory is the source of truth** (`plugins/michaeldacre-site/` in the site
repository), listed by the repo's own marketplace at `.claude-plugin/marketplace.json`.
It is versioned with the site, so a change to the site and the rule or workflow that
governs it can land in the same commit.

Claude Code on the Mac reads it straight from the working tree:

```bash
claude plugin marketplace add ~/sites/personal-site
claude plugin install michaeldacre-site@personal-site
```

Edits take effect at the next session start or on `/reload-plugins`. Anywhere else, add
the marketplace from GitHub (`claude plugin marketplace add MikeDacre/personal-site`) and
update with `claude plugin marketplace update personal-site`.

Validate after editing: `claude plugin validate ~/sites/personal-site`.

**Do not edit the copies under `~/.claude/plugins/synced/` or `~/.claude/skills/synced/`.**
Those are account-synced snapshots that can be overwritten; changes made there never reach
the repo.

When a rule in `docs/CLAUDE.md` changes (that directory is local-only and not in this
repository), update this plugin in the same session. A plugin that drifts from the spec is
worse than no plugin, because it will confidently assert a stale rule to a session that has
no other source.

## Scope

Written specifically for Mike's site, with real paths, real domains, and real
constraints. Not intended as a general-purpose template — the specificity is what makes
the review gate catch anything.

Version 0.3.0 · MIT
