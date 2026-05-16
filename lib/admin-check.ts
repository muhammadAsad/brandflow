import { createAdminClient } from './supabase-admin';

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from('profiles')
      .select('is_admin')
      .eq('user_id', userId)
      .single();
    return data?.is_admin === true;
  } catch {
    return false;
  }
}
