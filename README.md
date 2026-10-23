# michaeldacre.com

Source for the personal site of **Michael Dacre, MD** — a Family Medicine physician in
California. Live at [www.michaeldacre.com](https://www.michaeldacre.com), also reachable
at `michaeldacre.com`, `dacre.me`, and `dacre.md`, all of which redirect to the canonical
`www` host.

The site exists to tell prospective patients how I practise, and to give employers and
colleagues my CV and background in one place.

## Stack

 |                       |                                                                                                                      |
 |-----------------------|----------------------------------------------------------------------------------------------------------------------|
 | Static site generator | [Hugo](https://gohugo.io) (extended), Markdown content                                                               |
 | Hosting               | [Cloudflare Pages](https://pages.cloudflare.com), Git-connected                                                      |
 | CDN / DNS / WAF       | Cloudflare                                                                                                           |
 | Contact form          | Cloudflare Pages Function → [Turnstile](https://developers.cloudflare.com/turnstile/) → [Resend](https://resend.com) |
 | Dependencies          | None. No npm, no framework, no bundler.                                                                              |

## Local development

```bash
hugo server -D --navigateToChanged     # dev server, drafts included
hugo --minify --gc                     # production build → public/
```

Contact form development additionally needs
[Wrangler](https://developers.cloudflare.com/workers/wrangler/) and a local `.dev.vars`
file (gitignored — never commit it):

```bash
npx wrangler pages dev public --compatibility-date=2026-08-15
```

## Repository guide

 | Path                                   | Purpose                                                        |
 |----------------------------------------|----------------------------------------------------------------|
 | `content/`                             | All Markdown content                                           |
 | `layouts/`, `assets/`                  | The custom theme                                               |
 | `themes/serif/`                        | Temporary scaffold, being progressively replaced — do not edit |
 | `functions/`                           | Cloudflare Pages Functions (contact form)                      |
 | `data/cv.yml`                          | Structured CV, generated from the PDF and human-reviewed       |
 | `scripts/cv_extract.py`                | CV extraction. Run manually — never during the build.          |
 | `static/_headers`, `static/_redirects` | Cloudflare Pages headers and redirects                         |

Project documentation — notes, roadmap, and changelog — lives in a `CLAUDE/`
directory that is deliberately excluded from this repository. It is working material
rather than anything a visitor or contributor needs, so it stays on my machine.

## A note on this repository being public

The source is public; the site is public; that's fine. But it does mean **no secrets ever
enter this repository**. API keys, tokens, and the Turnstile secret key live only in
Cloudflare's encrypted environment variables.

The site is also subject to constraints most personal sites aren't: no protected health
information, California Business & Professions Code § 651 advertising rules, and WCAG 2.1
AA accessibility. These are not optional, and they're the reason some obvious-looking
conveniences (testimonials, analytics, an embedded PDF CV) are deliberately absent.

## Contributing

This is a personal site, so I'm not looking for feature contributions — but if you spot an
accessibility problem, a broken link, a typo, or a factual error, it would be very kind
of you to let me know.

## Questions for Me / Communication

Medical or personal questions sent over github in any capacity will be
immediatly deleted and will receive no response.

If you would like to conact me in a professional capacity, please do so through
appropriate means: the electronic health record for medical questions and my
contact form or email for any other questions.

## Licence

Code is MIT licensed (see [`LICENSE`](LICENSE)) — reuse it freely. The written content,
photographs, and CV are not; those are mine, and borrowing them would be strange anyway.

Writing by me. Code by me, with support from Claude.
