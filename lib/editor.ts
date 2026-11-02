import { parseDocument, Document, Scalar } from 'yaml';

export const repository = 'HenryHamster/HenryHamster.github.io';
export const owner = 'HenryHamster';
export type Draft = { title: string; summary: string; body: string; date: string; path: string; sha: string; frontmatter: string };

export function emptyDraft(): Draft {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return { title: '', summary: '', body: '', date, path: '', sha: '', frontmatter: '' };
}

export function decodeContent(content: string) {
  return new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, '')), c => c.charCodeAt(0)));
}
export function encodeContent(content: string) {
  return btoa(Array.from(new TextEncoder().encode(content), byte => String.fromCharCode(byte)).join(''));
}
export function readDraft(source: string, path: string, sha: string): Draft {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error('This post has no valid metadata header. No changes were made.');
  const doc = parseDocument(match[1]);
  if (doc.errors.length) throw new Error('This post has invalid metadata. No changes were made.');
  const field = (key: string) => typeof doc.get(key) === 'string' ? doc.get(key) as string : '';
  return { title: field('title'), summary: field('summary'), date: field('date'), body: match[2].replace(/^\r?\n/, ''), frontmatter: match[1], path, sha };
}
export function serializeDraft(draft: Draft) {
  if (!draft.title.trim() || !draft.summary.trim() || !draft.body.trim()) throw new Error('Add a title, a short summary, and some writing before publishing.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) throw new Error('Choose a valid date.');
  const doc = draft.frontmatter ? parseDocument(draft.frontmatter) : new Document({});
  if (doc.errors.length) throw new Error('Invalid metadata. Your draft is still saved locally.');
  // The site's gray-matter parser recognizes unquoted dates as Date objects.
  // Explicit string nodes keep both YAML parsers on the same contract.
  for (const [key, value] of Object.entries({ title: draft.title.trim(), summary: draft.summary.trim(), date: draft.date })) {
    const node = new Scalar(value); node.type = Scalar.QUOTE_DOUBLE; doc.set(key, node);
  }
  doc.set('draft', false);
  return `---\n${doc.toString()}---\n\n${draft.body}\n`;
}
export function postPath(draft: Draft) {
  if (draft.path) {
    if (!/^content\/writeups\/[a-zA-Z0-9_-]+\.md$/.test(draft.path)) throw new Error('Unsupported post filename.');
    return draft.path;
  }
  const slug = draft.title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!slug) throw new Error('Please include a letter or number in the title.');
  return `content/writeups/${draft.date}-${slug}.md`;
}

export async function github<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init, cache: 'no-store', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', ...init.headers },
  });
  if (!response.ok) {
    if (response.status === 409 || response.status === 422) throw new Error('The post changed on GitHub, or that filename already exists. Your local draft is safe. Download it, then reopen the latest post before publishing again.');
    if (response.status === 401 || response.status === 403) throw new Error('GitHub denied access. Check that your token is valid and has Contents: read and write for this repository.');
    throw new Error(`GitHub returned ${response.status}. Your draft is still on this device; try again later.`);
  }
  return response.json() as Promise<T>;
}
export async function verifyOwner(token: string) {
  const user = await github<{ login: string }>(token, '/user');
  if (user.login?.toLowerCase() !== owner.toLowerCase()) throw new Error('Only HenryHamster can unlock this editor.');
  const repo = await github<{ permissions?: { push?: boolean }; default_branch: string }>(token, `/repos/${repository}`);
  if (!repo.permissions?.push) throw new Error('This token does not have write access to the blog.');
  return repo.default_branch as string;
}
