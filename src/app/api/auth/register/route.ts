import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { hashPassword, setSessionCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password, phone } = parsed.data;

    // Check existing email
    const existing = await query<any>('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = `usr-cust-${crypto.randomUUID().slice(0, 8)}`;

    await query(
      `INSERT INTO users (id, name, email, password_hash, role, phone, created_at)
       VALUES (?, ?, ?, ?, 'CUSTOMER', ?, NOW())`,
      [userId, name, email.toLowerCase(), hashedPassword, phone || null]
    );

    // Give 100 welcome bonus reward points
    await query(
      `INSERT INTO reward_ledgers (id, user_id, points, type, reference_id, balance_after, description, created_at)
       VALUES (?, ?, 100, 'BONUS_SIGNUP', 'WELCOME-BONUS', 100, 'Welcome bonus reward points for joining ParkWise', NOW())`,
      [`rew-${crypto.randomUUID().slice(0, 10)}`, userId]
    );

    const userSession = {
      id: userId,
      name,
      email: email.toLowerCase(),
      role: 'CUSTOMER' as const,
    };

    setSessionCookie(userSession);

    return NextResponse.json({
      success: true,
      user: userSession,
      message: 'Account registered successfully with 100 welcome reward points!',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
