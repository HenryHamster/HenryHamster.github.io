import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { getPublishedWriteups, getWriteup } from '@/lib/writeups';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedWriteups().map((writeup) => ({ slug: writeup.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const writeup = getWriteup(slug);
  if (!writeup) return {};

  return {
    title: writeup.title,
    description: writeup.summary,
    openGraph: {
      type: 'article',
      title: writeup.title,
      description: writeup.summary,
      publishedTime: `${writeup.date}T00:00:00.000Z`,
      images: [],
    },
    twitter: {
      card: 'summary',
      title: writeup.title,
      description: writeup.summary,
      images: [],
    },
  };
}

export default async function WriteupPage({ params }: PageProps) {
  const { slug } = await params;
  const writeup = getWriteup(slug);
  if (!writeup) notFound();

  return (
    <div className="article-shell">
      <SiteHeader />
      <main>
        <header className="article-header">
          <h1>{writeup.title}</h1>
          <p className="article-summary">{writeup.summary}</p>
          <div className="article-meta">
            <time dateTime={writeup.date}>{writeup.date}</time>
            <span aria-hidden="true">·</span>
            <span>{writeup.readingMinutes} min read</span>
            {writeup.links.map((link) => (
              <span key={link.url}>
                <span aria-hidden="true">·</span>{' '}
                <a href={link.url} rel="noreferrer" target="_blank">
                  {link.label}
                </a>
              </span>
            ))}
          </div>
        </header>

        <div
          className={`article-layout${writeup.headings.length < 2 ? ' article-layout-single' : ''}`}
        >
          <article
            className="article-body"
            dangerouslySetInnerHTML={{ __html: writeup.html }}
          />

          {writeup.headings.length >= 2 ? (
            <aside className="article-toc" aria-label="On this page">
              <p>On this page</p>
              <ol>
                {writeup.headings.map((heading) => (
                  <li className={`toc-depth-${heading.depth}`} key={heading.id}>
                    <a href={`#${heading.id}`}>{heading.text}</a>
                  </li>
                ))}
              </ol>
            </aside>
          ) : null}
        </div>

        <footer className="article-footer">
          <a href="/">← All writing</a>
        </footer>
      </main>
    </div>
  );
}
