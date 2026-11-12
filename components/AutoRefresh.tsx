'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const ago = (secs: number) => (secs < 60 ? `${Math.max(0, Math.round(secs))} s ago` : `${Math.floor(secs / 60)} min ago`);

/**
 * Re-fetches the (cached) page every `seconds` while the tab is visible and on return to the tab,
 * and shows when the data was last updated with a manual Refresh button.
 */
export default function AutoRefresh({ seconds = 20, generatedAt }: { seconds?: number; generatedAt?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') startTransition(() => router.refresh());
    };
    const id = window.setInterval(refresh, seconds * 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [router, seconds]);

  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, [generatedAt]);

  if (!generatedAt) return null;
  const secs = now === null ? 0 : (now - Date.parse(generatedAt)) / 1000;

  return (
    <div className="flex items-center justify-end gap-2 text-xs text-ink-muted" aria-live="polite">
      <span>{pending ? 'Updating…' : `Updated ${ago(secs)}`}</span>
      <button
        type="button"
        onClick={() => startTransition(() => router.refresh())}
        disabled={pending}
        className="rounded border border-rule bg-white px-2 py-1 font-semibold text-navy disabled:opacity-50"
      >
        Refresh
      </button>
    </div>
  );
}
