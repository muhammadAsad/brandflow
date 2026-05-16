import { createAdminClient } from './supabase-admin';

interface LogParams {
  adminId: string;
  adminEmail: string;
  action: string;
  targetUserId?: string;
  targetUserEmail?: string;
  details?: object;
  ipAddress?: string;
}

export async function logAdminAction(params: LogParams): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from('admin_logs').insert({
      admin_id:          params.adminId,
      admin_email:       params.adminEmail,
      action:            params.action,
      target_user_id:    params.targetUserId   ?? null,
      target_user_email: params.targetUserEmail ?? null,
      details:           params.details        ?? {},
      ip_address:        params.ipAddress      ?? null,
    });
  } catch {
    // Non-fatal — logging should never break an admin action
  }
}
