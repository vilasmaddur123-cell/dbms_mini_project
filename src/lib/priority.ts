import { query } from './db';

export interface PriorityInfo {
  category: string;
  priorityLevel: number;
  isActive: boolean;
  expiresAt: string | null;
}

/**
 * Fetch highest priority rank for a given user (1 is highest, 99 is default general)
 */
export async function getUserPriority(userId: string): Promise<PriorityInfo> {
  const rows = await query<any>(
    `SELECT category, priority_level, is_active, expires_at
     FROM priority_eligibilities
     WHERE user_id = ? 
       AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY priority_level ASC
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return {
      category: 'GENERAL',
      priorityLevel: 99,
      isActive: true,
      expiresAt: null,
    };
  }

  const p = rows[0];
  return {
    category: p.category,
    priorityLevel: Number(p.priority_level),
    isActive: Boolean(p.is_active),
    expiresAt: p.expires_at,
  };
}
