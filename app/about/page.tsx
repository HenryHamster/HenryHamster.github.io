import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: 'About',
};

export default function AboutPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        <h1>About</h1>
        <p><a href="/writing/intro">Intro &amp; Motivations</a></p>
      </main>
    </div>
  );
}
