---
name: cv-update
description: >
  Refresh the CV on michaeldacre.com from Mike's master copy in ~/Documents/Professional/CV —
  screening for personal data that must not be published, copying the PDF into the repo,
  extracting structured data into data/cv.yml, and rendering the /cv/ page. Use whenever
  Mike says he has updated his CV, asks to update or publish the CV, mentions a new
  position, publication, certification, or licence that should appear on the site, or asks
  to rebuild the CV page. Also use when the /cv/ page looks out of date relative to the
  CV PDF, since the two drifting apart is the failure this workflow exists to prevent.
---

# CV update — michaeldacre.com

Refresh the published CV from Mike's master copy. Load `michaeldacre-site:site-guardrails` first if it is
not already loaded.

The design point behind this workflow: extraction never runs during the Hugo build. Hugo
reads only a committed `data/cv.yml`, so a malformed PDF can never break a deploy, and a
human always sees the extracted data before it goes live.

## Where things live

Master copy — **`~/Documents/Professional/CV/`**, outside the repository. This is Mike's
directory. **Read from it; never write to it.**

| File                       | Role                                                            |
|----------------------------|-----------------------------------------------------------------|
| `Michael_Dacre_CV.docx`    | Upstream source. What Mike edits. Read this for data.           |
| `Michael_Dacre_CV.pdf`     | Export of the `.docx`. The artefact that gets published.        |
| `Michael_Dacre_CV.pdf.sig` | GPG detached signature, if present. Never copy into the repo or publish.    |
| `archive/`                 | Superseded CVs and cover letters. Never read or publish from here. |

`archive/` holds older CVs with different content and possibly different personal details.
Treat it as entirely out of scope — a stale address or number from a 2019 résumé must not
find its way onto the live site.

Repository side:

- `static/cv/Michael_Dacre_CV_public.pdf` — the published PDF (master with the contact line redacted), committed. The master PDF is never committed.
- `data/cv.yml` — structured CV data, committed, human-reviewed.
- `layouts/cv/single.html` — renders `/cv/`.

## Step 1 — Check the PDF is not stale

Compare modification times. If the `.docx` is newer than the `.pdf`, the PDF is a stale
export.

```bash
ls -la --time-style=+%Y-%m-%d\ %H:%M ~/Documents/Professional/CV/Michael_Dacre_CV.{docx,pdf} 2>/dev/null \
  || stat -f '%Sm  %N' -t '%Y-%m-%d %H:%M' ~/Documents/Professional/CV/Michael_Dacre_CV.docx ~/Documents/Professional/CV/Michael_Dacre_CV.pdf
```

If the PDF is older, stop and tell Mike he needs to re-export it. Publishing a stale PDF
alongside fresh extracted data would put two different CVs on the same page.

## Step 2 — Screen for data that must not be published

**Do this before reading the CV's contents into the conversation.** Run the scan locally
through Desktop Commander so sensitive values never enter the transcript — the point is to
learn *whether* something is present, not what it says.

```bash
python3 -c "
import re
from pypdf import PdfReader
t=''.join((p.extract_text() or '') for p in PdfReader('$HOME/Documents/Professional/CV/Michael_Dacre_CV.pdf').pages)
for label,pat in {
  'DEA':          r'\b[A-Z]{2}\d{7}\b',
  'SSN':          r'\b\d{3}-\d{2}-\d{4}\b',
  'phone':        r'\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b',
  'street addr':  r'\b\d{1,5}\s+[A-Z][A-Za-z]+\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Blvd|Ct|Court|Way|Pl|Place)\b',
  'DOB':          r'(?i)\b(?:date of birth|d\.?o\.?b\.?)\b',
  '10-digit num': r'\b\d{10}\b',
  'licence no':   r'(?i)licen[cs]e\s*(?:no|number|#)',
}.items(): print(('HIT   ' if re.search(pat,t) else 'clean ')+label)"
```

`pypdf` may need installing: `python3 -m pip install --quiet --user pypdf`.

**If a prohibited item is found — DEA number, SSN, street address, or DOB — stop. Write
nothing. Tell Mike.** Do not quietly omit it and carry on: he needs to know his CV
contains it, because he sends that same file to employers and credentialing bodies. The
value of this step is the warning, not the filtering.

A phone or email hit is not disqualifying — both are ordinary on a CV. But publishing
either on the public page needs Mike's explicit confirmation. If they are present and he
has not already decided, ask before rendering them into `/cv/`.

## Step 3 — Build the public PDF and copy it into the repo

The repo and site publish **`Michael_Dacre_CV_public.pdf`**: the master PDF with the
phone/email line on page 1 redacted. **Never copy the master PDF into the repo.** (Mike's
standing decision, 2026-10-22: public-facing material excludes contact details.) Never the
`.docx`, never the `.sig`, never anything from `archive/`.

Redact only the contact line — match it narrowly. A loose phone regex hits DOIs
(`...13059-020-02049-5`) and will silently destroy a publication line.

```bash
cd ~/sites/personal-site && uv run --quiet --with pymupdf --with pypdf python3 - <<'EOF'
import fitz, re
src='/Users/dacre/Documents/Professional/CV/Michael_Dacre_CV.pdf'
out='static/cv/Michael_Dacre_CV_public.pdf'
doc=fitz.open(src); n=0
for page in doc:
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines',[]):
            t=''.join(s['text'] for s in l['spans'])
            if page.number==0 and re.search(r'(?<![\d-])\d{3}-\d{3}-\d{4}(?![\d-])|[\w.+-]+@[\w-]+\.\w+',t):
                page.add_redact_annot(fitz.Rect(l['bbox'])+(-2,-2,2,2),fill=(1,1,1)); n+=1
    for lk in page.get_links():
        if re.search(r'mailto|tel:',str(lk.get('uri','')),re.I): page.delete_link(lk)
    page.apply_redactions()
assert n==1, f'expected exactly one contact line, found {n}'
doc.set_metadata({}); doc.save(out,garbage=4,deflate=True,clean=True)
EOF
```

Then verify, and do not skip it: page count equals the master, extracted text differs from the
master by exactly the one contact line, and the output contains no `mailto`, phone, or
email (check the raw bytes too).

## Step 4 — Extract into `data/cv.yml`

**Preferred: the Word connector on the `.docx`.** `open_document` then
`get_document_text` on `~/Documents/Professional/CV/Michael_Dacre_CV.docx`. The `.docx` retains
heading and paragraph structure that PDF export flattens, which makes mapping to the
schema much more reliable. This opens Word on Mike's machine — acceptable for a
deliberate, occasional step.

**Alternative: PDF Tools on the `.pdf`.** `read_pdf_content`, or `read_pdf_pages` for
page-bounded excerpts, when the `.docx` is unavailable or Word should not be launched.

Read the text and write the schema yourself rather than reaching for a regex parser — CV
layouts defeat parsers, and a model reading prose handles section headings, date ranges,
and wrapped entries far better.

```yaml
name: "Michael Dacre, MD"
updated: YYYY-MM-DD
education:
  - institution: ""
    degree: ""
    start: ""
    end: ""
    location: ""
training: []       # residency, fellowships
licensure: []      # licences and board certifications
positions: []
publications: []
teaching: []
service: []
```

Two things to get right while writing it:

**Board certifications** must carry the certifying board's full name — "American Board of
Family Medicine", not "Family Medicine". This is a § 651 requirement, and the CV page is
exactly where the shorthand form tends to creep in.

**Omit anything screened out in Step 2.** If Mike approved publishing a phone or email,
include it; otherwise leave those fields out entirely rather than including a placeholder.

## Step 5 — Human review, then commit

Show Mike the diff. This gate is not optional, whichever extraction path was used.

```bash
# git add -N first: on the FIRST run these files are untracked, and a plain
# `git diff` silently shows nothing for untracked files.
git -C ~/sites/personal-site add -N data/cv.yml static/cv/
git -C ~/sites/personal-site diff data/cv.yml static/cv/
```

Walk him through what changed rather than just printing the diff — new positions, changed
dates, anything the extraction may have mangled. Extraction errors cluster around date
ranges and multi-line entries, so look there first.

Commit the PDF and `data/cv.yml` **together** once he approves, so the published PDF and
the rendered page can never diverge in history. **Only commit when he asks** — the
standing rule that agents do not commit unbidden applies here too.

## Step 6 — Verify the rendered page

The `/cv/` page shows the HTML CV **and** a prominent download link to the PDF. It must
**not** use an `<object>` or `<iframe>` PDF embed — unusable on mobile, hostile to screen
readers, and a deliberate departure from the old site.

Check `schema.org` `Person` + `ProfilePage` structured data is present and current, then
run `michaeldacre-site:content-review` against the page before it ships.

## Afterwards

Update `docs/CHANGELOG.txt` with what changed, and commit the docs repo separately:

```bash
git -C ~/sites/personal-site/docs add -A
git -C ~/sites/personal-site/docs commit -m "docs: CV updated <date>"
```

Note the screening result in the changelog entry, including the date. The next person to
run this workflow — likely a future session with no memory of this one — needs to know
when the CV was last screened and what it found.
