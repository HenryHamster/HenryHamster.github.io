# Personal writeups

A deliberately plain personal site for publishing experiments and technical results.

## Start locally

```bash
pnpm install
pnpm dev
```

## Add a writeup

### Write on the website

Open `/edit` (or choose **Edit** in the navigation). Unlock with a fine-grained
GitHub personal access token owned by `HenryHamster`, restricted to this repository,
with **Contents: read and write**. The token goes directly to GitHub and is kept
only in page memory, never in local storage or the repository. Reloading or locking
requires unlocking again. GitHub enforces repository write permissions; the UI also
checks the authenticated owner. The editor's URL and code are public, not a secret.

Write a title, summary, and body on the page. Preview supports basic Markdown.
Drafts autosave to this browser's local storage, including across reloads; they are
not synced or backed up remotely. Use **Download draft** for a portable copy.
Only one local draft is kept. New/open operations ask before replacing it.
**Publish** commits a Markdown file to the default branch and triggers the existing
Pages deployment. A successful commit is reported separately from deployment.
**Open a post** loads an existing file; updates include its SHA so concurrent changes
cause a conflict instead of being overwritten. Existing metadata, including links,
is preserved. Never put a token in post content or commit one to this repository.

### Write locally

Create a dated Markdown file with the standard research-writeup outline:

```bash
pnpm new -- "Title of the result"
```

The command prints the new path under `content/writeups/`. Write normally in Markdown, then change `draft: true` to `draft: false` when it is ready to appear on the homepage.

Each writeup requires:

```yaml
---
title: "Exact title"
date: "2026-08-23"
summary: "One factual sentence stating the result."
draft: false
links:
  - label: "Code"
    url: "https://github.com/..."
---
```

The body supports headings, tables, fenced code, blockquotes, footnotes, raw HTML, inline math such as `$p(y \\mid x)$`, and display math between `$$` delimiters. The repository intentionally starts with no published writeups.

Put images in `public/images/` and use normal Markdown:

```markdown
![Useful alt text](/images/result.png "Figure 1. Caption text.")
```

The image title becomes its caption. Prefix the title with `wide:` to let a large plot extend beyond the text column:

```markdown
![Useful alt text](/images/result.png "wide: Figure 2. Full-width comparison.")
```

## Personal details

Edit `lib/site.ts` for the displayed name and GitHub URL. The restrained About page is in `app/about/page.tsx`.

## Publish with GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages** and choose **GitHub Actions** as the source.
3. The included workflow builds and publishes the static site after each push to `main`.

Both a user site such as `username.github.io` and a project site under `/repository-name/` are supported.
