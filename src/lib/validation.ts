import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const vehicleSchema = z.object({
  licensePlate: z.string().min(3).max(20),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  color: z.string().max(30).optional(),
  isEv: z.boolean().default(false),
});

export const preferencesSchema = z.object({
  preferredFloor: z.number().nullable().optional(),
  preferCovered: z.boolean().default(false),
  preferNearEntrance: z.boolean().default(false),
  preferNearExit: z.boolean().default(false),
  preferNearLift: z.boolean().default(false),
  requireEv: z.boolean().default(false),
  requireAccessible: z.boolean().default(false),
  maxHourlyBudget: z.number().positive().nullable().optional(),
  maxWalkingDistanceM: z.number().int().positive().nullable().optional(),
});

export const bookingSchema = z.object({
  slotId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  vehicleId: z.string().optional().nullable(),
  idempotencyKey: z.string().optional(),
});

export const waitlistSchema = z.object({
  facilityId: z.string().min(1),
  desiredCategory: z.string().optional().nullable(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export const feedbackSchema = z.object({
  reservationId: z.string().min(1),
  facilityId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  category: z.enum(['pricing', 'cleanliness', 'availability', 'security', 'location', 'booking', 'other', 'accessibility']),
  comment: z.string().min(5).max(1000),
});

export const incidentSchema = z.object({
  facilityId: z.string().min(1),
  slotNumber: z.string().optional().nullable(),
  title: z.string().min(5).max(150),
  category: z.enum(['maintenance', 'equipment', 'safety', 'access', 'other']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  description: z.string().min(10).max(2000),
});
