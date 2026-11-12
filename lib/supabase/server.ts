import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './public';

/** Cookie-based client acting as the signed-in TVC user. All writes go through this so RLS and the change log see who did it. */
export async function userClient() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component – middleware refreshes the session instead.
        }
      },
    },
  });
}

/** Signed-in admin or redirect to login. Checks the admins table, not just the session. */
export async function requireAdmin() {
  const supabase = await userClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) redirect('/admin/login?error=not-admin');
  return { supabase, user };
}
