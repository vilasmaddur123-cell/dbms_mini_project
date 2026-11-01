import crypto from 'crypto';
import { getConnection, query } from './db';

export interface RewardLedgerEntry {
  id: string;
  user_id: string;
  points: number;
  type: 'EARNED_BOOKING' | 'REDEEMED_DISCOUNT' | 'BONUS_SIGNUP' | 'ADMIN_ADJUSTMENT';
  reference_id: string | null;
  balance_after: number;
  description: string;
  created_at: string;
}

/**
 * Get current verified points balance for user derived from latest ledger entry
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
  const rows = await query<any>(
    `SELECT balance_after 
     FROM reward_ledgers 
     WHERE user_id = ? 
     ORDER BY created_at DESC, id DESC 
     LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) return 0;
  return Number(rows[0].balance_after);
}

/**
 * Get reward transaction history for user
 */
export async function getUserRewardHistory(userId: string): Promise<RewardLedgerEntry[]> {
  return await query<RewardLedgerEntry>(
    `SELECT * 
     FROM reward_ledgers 
     WHERE user_id = ? 
     ORDER BY created_at DESC`,
    [userId]
  );
}

/**
 * Award points idempotently (e.g. for completed booking or signup)
 */
export async function awardRewardPoints(
  userId: string,
  points: number,
  type: 'EARNED_BOOKING' | 'BONUS_SIGNUP' | 'ADMIN_ADJUSTMENT',
  referenceId: string,
  description: string
) {
  if (points <= 0) throw new Error('Award points must be strictly positive');

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // Lock latest ledger row for user to serialize balance updates
    const [latestRows]: any = await conn.execute(
      `SELECT balance_after 
       FROM reward_ledgers 
       WHERE user_id = ? 
       ORDER BY created_at DESC, id DESC 
       LIMIT 1 
       FOR UPDATE`,
      [userId]
    );

    const currentBalance = latestRows.length > 0 ? Number(latestRows[0].balance_after) : 0;
    const newBalance = currentBalance + points;
    const entryId = `rew-${crypto.randomUUID().slice(0, 10)}`;

    // Insert ledger record (protected by uq_reward_event unique constraint)
    await conn.execute(
      `INSERT INTO reward_ledgers (
         id, user_id, points, type, reference_id, balance_after, description, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [entryId, userId, points, type, referenceId, newBalance, description]
    );

    await conn.commit();
    return { success: true, pointsAwarded: points, balanceAfter: newBalance };
  } catch (error: any) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      // Duplicate event already processed; idempotent success
      return { success: true, duplicateIgnored: true };
    }
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Redeem points for parking discount (Prevents negative balances)
 */
export async function redeemRewardPoints(
  userId: string,
  pointsToRedeem: number,
  referenceId: string,
  description: string
) {
  if (pointsToRedeem <= 0) throw new Error('Redemption points must be positive');

  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    const [latestRows]: any = await conn.execute(
      `SELECT balance_after 
       FROM reward_ledgers 
       WHERE user_id = ? 
       ORDER BY created_at DESC, id DESC 
       LIMIT 1 
       FOR UPDATE`,
      [userId]
    );

    const currentBalance = latestRows.length > 0 ? Number(latestRows[0].balance_after) : 0;

    if (currentBalance < pointsToRedeem) {
      await conn.rollback();
      throw new Error(`INSUFFICIENT_POINTS: Current balance is ${currentBalance}, cannot redeem ${pointsToRedeem}`);
    }

    const newBalance = currentBalance - pointsToRedeem;
    const entryId = `rew-${crypto.randomUUID().slice(0, 10)}`;

    await conn.execute(
      `INSERT INTO reward_ledgers (
         id, user_id, points, type, reference_id, balance_after, description, created_at
       ) VALUES (?, ?, ?, 'REDEEMED_DISCOUNT', ?, ?, ?, NOW())`,
      [entryId, userId, -pointsToRedeem, referenceId, newBalance, description]
    );

    await conn.commit();
    return { success: true, pointsRedeemed: pointsToRedeem, balanceAfter: newBalance };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
