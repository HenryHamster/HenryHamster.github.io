import { test } from 'node:test';
import assert from 'node:assert/strict';
import matter from 'gray-matter';
import { decodeContent, encodeContent, readDraft, serializeDraft, postPath, github, verifyOwner } from '../lib/editor.ts';

test('editing preserves links and custom YAML metadata with Unicode prose', () => {
  const source = '---\ntitle: Original\nsummary: Short\ndate: "2026-11-02"\ndraft: true\nlinks:\n  - label: Code\n    url: https://example.com\ncustom: keep\n---\n\nHello 世界 👋';
  const draft = readDraft(source, 'content/writeups/2026-11-02-original.md', 'original-sha');
  draft.title = 'A title: "quoted"';
  const published = serializeDraft(draft);
  assert.match(published, /custom: keep/);
  assert.match(published, /https:\/\/example.com/);
  assert.match(published, /draft: false/);
  assert.equal(readDraft(published, draft.path, draft.sha).title, draft.title);
  assert.equal(matter(published).data.date, '2026-11-02');
  assert.equal(matter(published).data.title, draft.title);
  assert.equal(decodeContent(encodeContent(published)), published);
  assert.equal(postPath(draft), draft.path);
});
test('invalid and empty content cannot be published, path traversal rejected', () => {
  assert.throws(() => readDraft('no metadata', '', ''), /metadata/);
  const draft = { title: '', summary: '', body: '', date: '2026-11-02', path: '', sha: '', frontmatter: '' };
  assert.throws(() => serializeDraft(draft), /title/);
  assert.throws(() => postPath({ ...draft, path: 'content/writeups/../../evil.md' }), /filename/);
  assert.equal(postPath({ ...draft, title: 'Hello, world!' }), 'content/writeups/2026-11-02-hello-world.md');
});
test('only owner with repository write access unlocks; conflicts remain errors', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ login: 'someone-else' });
    await assert.rejects(verifyOwner('test-token'), /Only HenryHamster/);
    globalThis.fetch = async url => Response.json(url.endsWith('/user') ? { login: 'HenryHamster' } : { permissions: { push: false } });
    await assert.rejects(verifyOwner('test-token'), /write access/);
    globalThis.fetch = async (url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      assert.ok(url.startsWith('https://api.github.com/'));
      return Response.json(url.endsWith('/user') ? { login: 'HenryHamster' } : { permissions: { push: true }, default_branch: 'main' });
    };
    assert.equal(await verifyOwner('test-token'), 'main');
    globalThis.fetch = async () => new Response('{}', { status: 409 });
    await assert.rejects(github('test-token', '/repos/test'), /changed on GitHub/);
  } finally { globalThis.fetch = original; }
});
