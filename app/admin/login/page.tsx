import { LoginForm } from '@/components/admin/forms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'TVC login', robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-sm space-y-4 card p-4">
      <h1 className="heading text-[26px]">TVC score entry</h1>
      {error === 'not-admin' && (
        <p className="rounded bg-amber-100 p-2 text-sm text-amber-900">
          You&apos;re signed in, but this account isn&apos;t set up for score entry. Ask the site admin to add you.
        </p>
      )}
      <LoginForm />
    </div>
  );
}
