import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-name" href="/">
        {siteConfig.name}
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/">Writing</Link>
        <Link href="/about">About</Link>
        <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </header>
  );
}
