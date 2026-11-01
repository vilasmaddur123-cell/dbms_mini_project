import crypto from 'crypto';
import { query, getConnection } from './db';
import { getUserPriority } from './priority';

export interface JoinWaitlistParams {
  userId: string;
  facilityId: string;
  desiredCategory?: string | null;
  startTime: string; // ISO
  endTime: string;   // ISO
}

/**
 * Join Waiting List with deterministic priority assignment
 */
export async function joinWaitlist(params: JoinWaitlistParams) {
  const start = new Date(params.startTime);
  const end = new Date(params.endTime);

  if (start >= end) {
    throw new Error('Start time must precede end time');
  }

  // Check if user already has an active waitlist entry for this facility & interval
  const existing = await query<any>(
    `SELECT id FROM waiting_list_entries
     WHERE user_id = ? 
       AND facility_id = ? 
       AND status = 'WAITING'
       AND expires_at > NOW()
       AND (start_time < ? AND end_time > ?)`,
    [params.userId, params.facilityId, end, start]
  );

  if (existing.length > 0) {
    throw new Error('DUPLICATE_WAITLIST_REQUEST');
  }

  // Get user priority class
  const priority = await getUserPriority(params.userId);

  // Set expiry to 30 mins before requested start time or 1 hour from now
  const expiresAt = new Date(Math.min(start.getTime() - 30 * 60000, Date.now() + 24 * 60 * 60000));
  const entryId = `wl-${crypto.randomUUID().slice(0, 10)}`;

  await query(
    `INSERT INTO waiting_list_entries (
       id, user_id, facility_id, desired_category, start_time, end_time,
       priority_level, status, created_at, expires_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', NOW(), ?)`,
    [
      entryId,
      params.userId,
      params.facilityId,
      params.desiredCategory || null,
      start,
      end,
      priority.priorityLevel,
      expiresAt,
    ]
  );

  // Get current queue position
  const queuePos = await getWaitlistQueuePosition(entryId, params.facilityId);

  return {
    success: true,
    entryId,
    queuePosition: queuePos,
    priorityCategory: priority.category,
    priorityLevel: priority.priorityLevel,
    expiresAt,
  };
}

/**
 * Compute current queue position for a waiting list entry
 */
export async function getWaitlistQueuePosition(entryId: string, facilityId: string): Promise<number> {
  const rows = await query<any>(
    `SELECT COUNT(*) AS position_ahead
     FROM waiting_list_entries w1
     JOIN waiting_list_entries target ON target.id = ?
     WHERE w1.facility_id = ?
       AND w1.status = 'WAITING'
       AND (
         w1.priority_level < target.priority_level
         OR (w1.priority_level = target.priority_level AND w1.created_at < target.created_at)
       )`,
    [entryId, facilityId]
  );

  return (Number(rows[0]?.position_ahead) || 0) + 1;
}

/**
 * Leave waiting list
 */
export async function leaveWaitlist(entryId: string, userId: string) {
  await query(
    `UPDATE waiting_list_entries 
     SET status = 'CANCELLED' 
     WHERE id = ? AND user_id = ?`,
    [entryId, userId]
  );
  return { success: true };
}
