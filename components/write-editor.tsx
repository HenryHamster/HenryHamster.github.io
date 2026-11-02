'use client';

import { useEffect, useRef, useState } from 'react';
import MarkdownIt from 'markdown-it';
import { decodeContent, emptyDraft, encodeContent, github, postPath, readDraft, repository, serializeDraft, verifyOwner, type Draft } from '@/lib/editor';

const storageKey = 'henry-writing-draft-v1';
const markdown = new MarkdownIt({ html: false, linkify: true });
const tokenUrl = 'https://github.com/settings/personal-access-tokens/new?name=Blog%20editor&target_name=HenryHamster&contents=write';

export function WriteEditor() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [ready, setReady] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const token = useRef('');
  const [branch, setBranch] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState('');
  const [posts, setPosts] = useState<{ path: string; name: string }[]>([]);
  const [published, setPublished] = useState('');
  const body = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const local = localStorage.getItem(storageKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Object.keys(emptyDraft()).every(key => typeof parsed[key] === 'string')) setDraft(parsed);
        else throw new Error('Invalid local draft');
      }
    } catch { setStatus('Could not restore the saved draft. Browser storage may be unavailable.'); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setSaved('Draft saved on this device'); }
    catch { setSaved('Autosave unavailable — download a copy before closing'); }
  }, [draft, ready]);
  useEffect(() => {
    if (body.current) { body.current.style.height = 'auto'; body.current.style.height = `${Math.max(350, body.current.scrollHeight)}px`; }
  }, [draft.body, preview, branch]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setStatus('');
    try { await action(); } catch (error) { setStatus(error instanceof Error ? error.message : 'Something went wrong. Your draft is still on this device.'); }
    finally { setBusy(false); }
  }
  async function listPosts() {
    const entries = await github<{ path: string; name: string }[]>(token.current, `/repos/${repository}/contents/content/writeups?ref=${encodeURIComponent(branch)}`);
    const available = entries.filter(entry => entry.name.endsWith('.md'));
    setPosts(available);
    if (!available.length) setStatus('No posts yet. Start writing below.');
  }
  function update(field: keyof Draft, value: string) { setDraft(current => ({ ...current, [field]: value })); setPublished(''); }
  function download() {
    const text = `# ${draft.title}\n\n${draft.summary}\n\n${draft.body}`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'writing-draft.md'; link.click(); URL.revokeObjectURL(url);
  }
  if (!branch) return <main className="simple-page editor-login">
    <h1>Your writing desk</h1><p>Unlock with your GitHub account to write and publish here.</p>
    <form onSubmit={event => { event.preventDefault(); void run(async () => {
      const value = tokenInput.trim(); const verifiedBranch = await verifyOwner(value);
      token.current = value; setTokenInput(''); setBranch(verifiedBranch);
    }); }}>
      <label htmlFor="github-token">GitHub access token</label>
      <input id="github-token" type="password" autoComplete="off" spellCheck={false} value={tokenInput} onChange={event => setTokenInput(event.target.value)} required />
      <button disabled={busy}>{busy ? 'Checking…' : 'Unlock editor'}</button>
    </form>
    <details><summary>First time? Set up access</summary>
      <p><a href={tokenUrl} target="_blank" rel="noreferrer">Create a fine-grained GitHub token</a>. Choose <strong>Only select repositories → HenryHamster.github.io</strong>, with <strong>Contents: read and write</strong>. Copy it into the field above.</p>
      <p>Your token is sent only to GitHub and stays in memory until you close, reload, or lock this page. Drafts stay in this browser, never in the public repository until you publish.</p>
    </details><p role="status">{status}</p>
  </main>;

  return <main className="editor-main">
    <div className="editor-toolbar">
      <span>Writing as Henry</span>
      <button disabled={busy} onClick={() => { token.current = ''; setBranch(''); setPosts([]); }}>Lock</button>
    </div>
    <div className="editor-toolbar">
      <button disabled={busy} onClick={() => { if (window.confirm('Start a new post? Download this draft first if you want to keep it.')) { setDraft(emptyDraft()); setPublished(''); setStatus(''); setPreview(false); } }}>New post</button>
      <button disabled={busy} onClick={() => void run(listPosts)}>Open a post</button>
      <button onClick={download}>Download draft</button>
    </div>
    {posts.length > 0 && <label className="editor-post-picker">Open from GitHub<select disabled={busy} value="" onChange={event => {
      const path = event.target.value; if (!path || !window.confirm('Replace the local draft with this post? Download your current draft first if needed.')) return;
      void run(async () => { const file = await github<{ content: string; sha: string }>(token.current, `/repos/${repository}/contents/${path}?ref=${encodeURIComponent(branch)}`); setDraft(readDraft(decodeContent(file.content), path, file.sha)); setPosts([]); setPublished(''); setPreview(false); });
    }}><option value="">Choose a post…</option>{posts.map(post => <option key={post.path} value={post.path}>{post.name}</option>)}</select></label>}
    <fieldset disabled={busy || !ready} className="editor-fields">
      {preview ? <><h1 className="editor-title">{draft.title || 'Untitled'}</h1><p className="article-summary">{draft.summary}</p><article className="article-body editor-preview" dangerouslySetInnerHTML={{ __html: markdown.render(draft.body) }} /></> : <>
        <input className="editor-title" aria-label="Title" placeholder="Title" value={draft.title} onChange={event => update('title', event.target.value)} />
        <textarea className="editor-summary" aria-label="Short summary" placeholder="A short summary" rows={2} value={draft.summary} onChange={event => update('summary', event.target.value)} />
        <textarea ref={body} className="editor-body article-body" aria-label="Post body" placeholder="Start writing…" value={draft.body} onChange={event => update('body', event.target.value)} />
      </>}
      <label className="editor-date">Post date <input aria-label="Post date" type="date" value={draft.date} onChange={event => update('date', event.target.value)} /></label>
    </fieldset>
    <div className="editor-toolbar editor-actions">
      <button disabled={busy} onClick={() => setPreview(!preview)}>{preview ? 'Keep writing' : 'Preview'}</button>
      <button className="publish-button" disabled={busy || !ready} onClick={() => void run(async () => {
        const content = serializeDraft(draft); const path = postPath(draft);
        if (!window.confirm(`Publish “${draft.title}” to your public blog?`)) return;
        await verifyOwner(token.current);
        if (!draft.sha) {
          const existing = await github<{ name: string }[]>(token.current, `/repos/${repository}/contents/content/writeups?ref=${encodeURIComponent(branch)}`);
          const slug = path.split('/').pop()!.replace(/^\d{4}-\d{2}-\d{2}-/, '');
          if (existing.some(file => file.name.replace(/^\d{4}-\d{2}-\d{2}-/, '') === slug)) throw new Error('A post with this address already exists. Open that post to edit it, or choose a different title.');
        }
        const result = await github<{ content: { sha: string } }>(token.current, `/repos/${repository}/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `${draft.sha ? 'Update' : 'Publish'} writeup: ${draft.title}`, content: encodeContent(content), branch, ...(draft.sha ? { sha: draft.sha } : {}) }) });
        setDraft({ ...draft, path, sha: result.content.sha });
        setPublished(`https://github.com/${repository}/actions`);
        setStatus('Saved to GitHub. Your site will update when its deployment finishes.');
      })}>{busy ? 'Working…' : draft.sha ? 'Publish changes' : 'Publish'}</button>
      <span className="editor-save" role="status">{saved}</span>
    </div>
    <p className="editor-note">Drafts are saved in this browser only. Markdown works for headings, links, and lists. Download a copy to keep a backup.</p>
    <p role="status">{status} {published && <a href={published} target="_blank" rel="noreferrer">View deployment</a>}</p>
  </main>;
}
