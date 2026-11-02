import { SiteHeader } from '@/components/site-header';
import { WriteEditor } from '@/components/write-editor';

export const metadata = { title: 'Write', robots: { index: false, follow: false } };
export default function EditPage() {
  return <div className="site-shell"><SiteHeader /><WriteEditor /></div>;
}
