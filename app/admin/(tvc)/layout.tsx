import Link from 'next/link';
import { signOut } from '@/app/admin/actions';
import { requireAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'TVC admin', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-100 p-2 text-sm">
        <strong>TVC admin</strong>
        <nav className="flex flex-wrap gap-1">
          {[
            ['/admin', 'Scores'],
            ['/admin/teams', 'Team names'],
            ['/admin/ties', 'Ties'],
            ['/admin/log', 'Change log'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded bg-white px-2 py-1">
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-ink-muted sm:inline">{user.email}</span>
          <button className="rounded bg-white px-2 py-1">Sign out</button>
        </form>
      </div>
      {children}
    </div>
  );
}
