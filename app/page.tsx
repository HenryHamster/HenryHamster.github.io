import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { getPublishedWriteups } from '@/lib/writeups';

export default function Home() {
  const writeups = getPublishedWriteups();

  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="home-main">
        <h1>Writing</h1>
        <ol className="writing-list">
          {writeups.map((writeup) => (
            <li key={writeup.slug}>
              <time dateTime={writeup.date}>{writeup.date}</time>
              <div>
                <Link
                  className="writing-title"
                  href={`/writing/${writeup.slug}`}
                >
                  {writeup.title}
                </Link>
                {writeup.summary ? <p>{writeup.summary}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
