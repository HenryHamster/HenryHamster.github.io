import { SiteHeader } from '@/components/site-header';

export default function NotFound() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="simple-page">
        <h1>Not found</h1>
        <p>
          <a href="/">Return to the writing index.</a>
        </p>
      </main>
    </div>
  );
}
