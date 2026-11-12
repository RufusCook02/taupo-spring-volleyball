import { getPublicState } from '@/lib/data';
import { buildTeamIcs } from '@/lib/ics';

// Built on request so it always includes the latest decided games.
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await getPublicState();
  const team = state.teamsById[id];
  if (!team) return new Response('Team not found', { status: 404 });

  const file = `${team.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '') || id}-taupo-volleyball.ics`;
  return new Response(buildTeamIcs(state, id), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${file}"`,
      'Cache-Control': 'no-store',
    },
  });
}
