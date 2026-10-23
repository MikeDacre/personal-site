---
name: content-review
description: >
  Review pages, copy, or a diff for michaeldacre.com before it goes live, checking
  California B&P Code 651 physician-advertising compliance, protected health information,
  leaked secrets, and WCAG 2.1 AA accessibility. Use this whenever content or templates
  for the personal site are about to be committed, merged, deployed, or published — and
  whenever Mike asks "does this look OK to publish?", "review this page", "is this
  compliant?", "check this before I push", or shares draft copy for the site. Also use it
  proactively after writing or substantially editing any page, since the whole point is
  catching a breach before it is public rather than after.
---

# Pre-publish review — michaeldacre.com

Run this before anything reaches the public site. It is a gate, not a suggestion: the
author is a licensed physician, the repository is public, and the cost of catching a
problem afterwards is much higher than the cost of checking now.

Load `michaeldacre-site:site-guardrails` first if it is not already loaded — it carries
the project context this review assumes.

For a deeper accessibility pass than Check 4 provides, hand off to
`design:accessibility-review`. Running both on a significant page is right, not redundant:
this skill is the broad gate across four dimensions, that one goes deep on a single one.

## How to run it

Work through all four checks. Do not stop at the first failure; Mike wants the full
picture in one pass, not a trickle of separate problems.

Review the **actual diff** where one exists (`git diff`, `git diff --staged`), not your
memory of what you wrote. If reviewing rendered output, check the built HTML in `public/`
or a Cloudflare preview URL, because templates can introduce problems the Markdown source
does not show.

## Check 1 — Secrets and the public repository

The repo is public. Scan the diff for anything credential-shaped: API keys, tokens,
passwords, private keys, `.env` or `.dev.vars` content, Cloudflare account IDs paired with
tokens, Resend keys, Turnstile **secret** keys.

The Turnstile **site** key is public by design and is fine in committed config. Only the
secret key is a problem. If you are unsure which one you are looking at, treat it as
secret and ask.

```bash
git diff --staged | grep -nEi 'api[_-]?key|secret|token|password|BEGIN [A-Z ]*PRIVATE KEY|re_[A-Za-z0-9]{16,}|sk_live'
```

A hit is not automatically a failure — the word "secret" appears in prose. Read each one.

## Check 2 — Protected health information

No PHI anywhere: not in content, commit messages, test fixtures, example form
submissions, or code comments.

Look for patient names or initials, dates tied to a person, conditions attached to an
individual, identifiable photographs, and anecdotes a reader in Mike's community could
reasonably re-identify. That last one is the real risk — a de-identified story can still
identify someone in a small community, and Sonoma County is a small community.

Clinical examples must be fictional composites and marked `fictional: true` in front
matter. If a passage reads like it happened to a specific person, ask Mike whether it did.

Also check Mike's own data: **DEA registration number never appears, ever.** No home
address, SSN, or date of birth. Work address only. His personal mobile number appears only
where he has explicitly confirmed it per-page.

## Check 3 — California B&P Code § 651

A licensed physician's website is regulated advertising. Read
`references/bpc-651.md` for the detail; the summary of what to flag:

- **Testimonials or endorsements** — any of them, including favourable and unsolicited
  ones. This surprises people, so state the reason when you flag it.
- **Before/after imagery** — requires procedure disclosure and variability disclaimers.
- **Superiority claims** — "best", "leading", "top-rated", "#1", "expert in", "premier",
  "renowned". Also softer forms: "unmatched", "second to none", "the only physician
  who…".
- **Guaranteed or implied outcomes** — including hedged phrasings like "you'll feel
  better" stated as fact.
- **Unsupported scientific claims** — anything empirical needs a citation to
  peer-reviewed published work. Integrative and whole-person medicine claims deserve
  particular care here, because the surrounding literature is uneven and it is easy to
  overstate.
- **Board certification** stated without the certifying board's full name at comparable
  prominence.
- **Specialty claims** for fields Mike is not certified in.
- **Fee statements** — these carry specific disclosure requirements. Flag for human
  review rather than trying to make them compliant yourself.

Flag anything in a grey area rather than deciding. This is a content-review rule, not
legal advice, and Mike's licence is the thing at risk.

## Check 4 — WCAG 2.1 AA

Mandatory, not aspirational. Check the rendered output:

- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text (≥24px, or ≥18.66px bold) and for
  UI component boundaries and graphical objects. Compute it — do not eyeball it.
- Every interactive element reachable and operable by keyboard, in a logical order.
- Visible focus indicator on everything focusable. `outline: none` without an equally
  visible replacement is a failure.
- Semantic HTML: one `<h1>`, no skipped heading levels, landmarks present, lists as
  lists, buttons as `<button>`, links as `<a>`.
- Meaningful `alt` on non-decorative images; `alt=""` on decorative ones.
- Every form input has an associated `<label>`. Errors described in text, never by colour
  alone.
- `lang` attribute present; `<title>` unique and descriptive.
- No horizontal scroll at 320px; content and function survive 200% zoom.
- `prefers-reduced-motion` respected. No autoplay, parallax, or carousels.
- Touch targets ≥ 44×44 CSS px.

For a deeper audit, hand off to `design:accessibility-review`. For live verification of
focus rings and keyboard order, drive the page with Claude in Chrome — a build log cannot
tell you whether the focus ring is actually visible.

## Contact page — extra scrutiny

If the contact form is in scope, verify the PHI notice sits **above** the message field,
not below it, and reads clearly: do not include medical details or personal health
information, this is not a secure channel, if this is an emergency call 911.

Also confirm nothing logs the message body, sender email, or IP; that no database, KV, R2,
or Durable Object has crept in; and that a no-JavaScript fallback leaves a patient a way
to reach him.

## Report format

Report by severity, most serious first. For each finding give the file and line, what the
rule is, and a concrete fix — not just "this violates § 651".

```
## Blocking
- <file>:<line> — <what and why> → <suggested fix>

## Should fix
- ...

## Worth a look
- ...

## Passed
Secrets · PHI · B&P 651 · WCAG 2.1 AA   (list only the ones that genuinely passed)
```

If everything passes, say so plainly and briefly. Do not invent findings to look thorough
— a false positive on a § 651 call costs Mike real time chasing a non-problem.
