# SPEC-267 — Knowledge Base: the Jasper-shape library on Brand Brain → Files

**Status:** implemented · **Date:** 2026-09-17 · **Repo:** frontend · **Backend:** `SPEC-267-brand-knowledge-base.md` · **Extends:** SPEC-263 · **Reference:** the owner's Jasper screenshots (Add to Knowledge Base modal; drag & drop with type tiles; name + tags; external sources); `ref/mockups/knowledge-base.html`

## Why

Brand Brain → Files was a drop zone and a list. The owner wants the Knowledge Base he
knows from Jasper: one **Add to Knowledge Base** entry with four doors, a library of
named, tagged, re-openable items, and a clear "coming soon" on what is not built.

## What

- The Files sub-tab is titled **Knowledge Base**. Header: item count, the **Add to
  Knowledge Base** button (the shell's *Add knowledge* deep-links to
  `/spotlight/brand-brain/files?add=1`, which opens it).
- **Add to Knowledge Base** dialog (`features/brand-brain/add-knowledge-dialog.tsx`)
  — step 1 the four doors: **From text**, **Upload file**, **Enter URL**, **From
  external source**; step 2 the door's form, each with **Name** (optional for files
  and URLs — the backend names it) and **Tags** (type + Enter, suggestions from the
  library's existing tags), Back / Add to Knowledge Base:
  - From text: a textarea (≥ 40 chars).
  - Upload file: drag & drop / browse, with the type tiles **Doc · Sheet · Slides ·
    PDF · CSV · Text** live and **Image · Audio · Video** greyed with a *Coming soon*
    badge (and a friendly refusal if such a file is dropped anyway).
  - Enter URL: the address, a note that it is re-read weekly.
  - External source: Google Drive and SharePoint tiles, both *Coming soon*, disabled.
- **Library** (`knowledge-library.tsx`): search (title, tags), filter chips by tag,
  kind filter, sort (newest · name · type), the table — Title (kind badge, status),
  Tags, What it taught (facts · personas · samples · rules), Added by, Date; a row
  opens the detail panel (SPEC-263's source facts panel, now with **Download**, **Edit
  name & tags**, **Re-check**, **Remove**).
- Extracting rows poll every 2 s until ready/failed (as SPEC-263).
- `lib/knowledge-base.ts` — pure: `filterLibrary`, `sortLibrary`, `allTags`,
  `parseTags`, `KIND_META` (label, extension list, coming-soon flag), `refuseReason`
  (why a dropped file is refused, before any request) — unit-tested.

## Acceptance criteria

- [x] Add dialog: four doors; text / file / URL each create an item that appears in
  the library as *Extracting…* and polls to ready; image/audio/video tiles and the
  external tiles say *Coming soon* and cannot be used. Live 2026-09-17: a `.jpg` drop
  was refused with "Images are coming soon — for now, paste the text instead."; the
  external door's submit stays disabled; a brand-book `.txt` went Extracting… → ready
  in 28 s with 1 fact · 1 persona · 2 samples · 5 rules on its row.
- [x] Name + tags saved on create and editable from the row; tags filter the library.
- [x] Download returns the original file for uploaded items; hidden for text/URL.
- [x] The four streams show on the item: facts (with Approve/Reject), personas,
  samples, rules counts, each linking to its tab.
- [x] `tests/knowledge-base.test.ts` covers the pure helpers; `npm test`, `tsc`,
  `npm run build` green; docs section updated; both themes.
