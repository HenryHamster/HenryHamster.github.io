import matter from 'gray-matter';
import katex from 'katex';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import footnote from 'markdown-it-footnote';
import texmath from 'markdown-it-texmath';

export type WriteupLink = {
  label: string;
  url: string;
};

export type WriteupHeading = {
  depth: 2 | 3;
  id: string;
  text: string;
};

export type Writeup = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  draft: boolean;
  links: WriteupLink[];
  readingMinutes: number;
  headings: WriteupHeading[];
  html: string;
};

type Frontmatter = {
  title?: unknown;
  date?: unknown;
  summary?: unknown;
  draft?: unknown;
  links?: unknown;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function withBasePath(url: string) {
  if (!url.startsWith('/') || url.startsWith('//')) return url;
  return `${basePath}${url}`;
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function createMarkdown() {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
  });

  markdown.use(anchor, { slugify: slugifyHeading });
  markdown.use(footnote as unknown as Parameters<typeof markdown.use>[0]);
  markdown.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false },
  });

  const defaultLinkOpen =
    markdown.renderer.rules.link_open ??
    ((tokens, index, options, _env, renderer) =>
      renderer.renderToken(tokens, index, options));

  markdown.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
    const href = tokens[index].attrGet('href');
    if (href) tokens[index].attrSet('href', withBasePath(String(href)));
    return defaultLinkOpen(tokens, index, options, env, renderer);
  };

  markdown.renderer.rules.image = (tokens, index) => {
    const token = tokens[index];
    const src = withBasePath(String(token.attrGet('src') ?? ''));
    const alt = markdown.utils.escapeHtml(token.content);
    const rawTitle = String(token.attrGet('title') ?? '');
    const isWide = rawTitle.toLowerCase().startsWith('wide:');
    const caption = isWide ? rawTitle.slice(5).trim() : rawTitle;
    const className = isWide ? ' class="wide"' : '';
    const figcaption = caption
      ? `<figcaption>${markdown.utils.escapeHtml(caption)}</figcaption>`
      : '';

    return `<figure${className}><img src="${markdown.utils.escapeHtml(src)}" alt="${alt}" loading="lazy">${figcaption}</figure>`;
  };

  markdown.renderer.rules.table_open = () =>
    '<div class="table-scroll"><table>\n';
  markdown.renderer.rules.table_close = () => '</table></div>\n';

  return markdown;
}

const markdown = createMarkdown();
const files = import.meta.glob('/content/writeups/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

function requiredString(value: unknown, field: string, file: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${file}: frontmatter field "${field}" must be a string`);
  }
  return value.trim();
}

function parseLinks(value: unknown, file: string): WriteupLink[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    throw new Error(`${file}: frontmatter field "links" must be a list`);
  }

  return value.map((item, index) => {
    if (
      typeof item !== 'object' ||
      item == null ||
      !('label' in item) ||
      !('url' in item)
    ) {
      throw new Error(`${file}: links[${index}] needs a label and url`);
    }

    return {
      label: requiredString(item.label, `links[${index}].label`, file),
      url: requiredString(item.url, `links[${index}].url`, file),
    };
  });
}

function filenameSlug(file: string) {
  return file
    .split('/')
    .pop()!
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function parseWriteup(file: string, source: string): Writeup {
  const { data, content } = matter(source);
  const frontmatter = data as Frontmatter;
  const title = requiredString(frontmatter.title, 'title', file);
  const date = requiredString(frontmatter.date, 'date', file);
  const summary = requiredString(frontmatter.summary, 'summary', file);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${file}: date must use YYYY-MM-DD`);
  }

  const environment = {};
  const tokens = markdown.parse(content, environment);
  const headings: WriteupHeading[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'heading_open' || (token.tag !== 'h2' && token.tag !== 'h3')) {
      continue;
    }

    const text = tokens[index + 1]?.content?.trim();
    const rawId = token.attrGet('id');
    const id = rawId == null ? null : String(rawId);
    if (text && id) {
      headings.push({
        depth: token.tag === 'h2' ? 2 : 3,
        id,
        text,
      });
    }
  }

  const words = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return {
    slug: filenameSlug(file),
    title,
    date,
    summary,
    draft: frontmatter.draft === true,
    links: parseLinks(frontmatter.links, file),
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
    headings,
    html: markdown.renderer.render(tokens, markdown.options, environment),
  };
}

const writeups = Object.entries(files)
  .map(([file, source]) => parseWriteup(file, source))
  .sort((left, right) => right.date.localeCompare(left.date));

export function getPublishedWriteups() {
  return writeups.filter((writeup) => !writeup.draft);
}

export function getWriteup(slug: string) {
  return writeups.find((writeup) => writeup.slug === slug && !writeup.draft);
}
