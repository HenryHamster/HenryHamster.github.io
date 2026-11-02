# Personal writeups

A deliberately plain personal site for publishing experiments and technical results.

## Start locally

```bash
pnpm install
pnpm dev
```

## Add a writeup

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
