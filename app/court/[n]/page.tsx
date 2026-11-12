import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COURTS, DAYS, type Day } from '@/data/draw';
import AutoRefresh from '@/components/AutoRefresh';
import GameCard from '@/components/GameCard';
import { getPublicState } from '@/lib/data';
export const revalidate = 15;
export const dynamicParams = false;
export const generateStaticParams = () => COURTS.map((n) => ({ n: String(n) }));

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  return { title: `Court ${(await params).n}` };
}

export default async function CourtPage({ params }: { params: Promise<{ n: string }> }) {
  const court = Number((await params).n);
  if (!COURTS.includes(court as 1)) notFound();
  const state = await getPublicState();

  return (
    <div className="space-y-4">
      <AutoRefresh generatedAt={new Date().toISOString()} />
      <div className="flex items-baseline gap-3">
        <h1 className="heading text-[30px]">Court {court}</h1>
        <nav className="flex gap-2 text-sm">
          {COURTS.filter((c) => c !== court).map((c) => (
            <Link key={c} href={`/court/${c}`} className="underline">
              Court {c}
            </Link>
          ))}
        </nav>
      </div>
      {(['sat', 'sun'] as Day[]).map((day) => (
        <section key={day} className="space-y-2">
          <h2 className="heading text-xl">{DAYS[day].label}</h2>
          {state.games
            .filter((g) => g.day === day && g.court === court)
            .sort((a, b) => a.sort - b.sort)
            .map((g) => (
              <GameCard key={g.code} game={g} showCourt={false} />
            ))}
        </section>
      ))}
    </div>
  );
}
