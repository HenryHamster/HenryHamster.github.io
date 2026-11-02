import { siteConfig } from '@/lib/site';

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="site-name" href="/">
        {siteConfig.name}
      </a>
      <nav aria-label="Primary navigation">
        <a href="/">Writing</a>
        <a href="/about">About</a>
        <a href="/edit" aria-label="Owner editor">Edit</a>
        <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </header>
  );
}
