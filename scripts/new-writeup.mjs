import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: pnpm new -- "Writeup title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-');

if (!slug) {
  console.error('The title needs at least one letter or number.');
  process.exit(1);
}

const date = new Date().toISOString().slice(0, 10);
const directory = resolve('content', 'writeups');
const path = resolve(directory, `${date}-${slug}.md`);
const quotedTitle = JSON.stringify(title);

const template = `---
title: ${quotedTitle}
date: "${date}"
summary: "One sentence stating the result."
draft: true
links:
  - label: "Code"
    url: "https://github.com/"
---

Open with the result and the minimum context needed to understand it.

## Result

What changed, by how much, and under which conditions?

## Setup

What was compared? Include data, environments, baselines, seeds, and evaluation criteria.

## Method

What did you run, and what would someone need to reproduce it?

## Findings

Separate observations from interpretation.

## Limitations

What does this experiment not establish?

## Reproduction

Provide the shortest path to rerunning the result.
`;

await mkdir(directory, { recursive: true });

try {
  await writeFile(path, template, { encoding: 'utf8', flag: 'wx' });
  console.log(path);
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
    console.error(`A writeup already exists at ${path}`);
    process.exit(1);
  }
  throw error;
}
