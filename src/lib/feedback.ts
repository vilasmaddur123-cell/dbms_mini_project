import { ObjectId } from 'mongodb';
import { getMongoDb } from './mongodb';
import { query } from './db';

export interface SubmitFeedbackParams {
  userId: string;
  userName: string;
  reservationId: string;
  facilityId: string;
  rating: number; // 1 - 5
  category: string;
  comment: string;
}

export interface SubmitIncidentParams {
  userId: string;
  facilityId: string;
  slotNumber?: string | null;
  title: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

/**
 * Submit feedback document to MongoDB with MySQL reservation validation
 */
export async function submitFeedback(params: SubmitFeedbackParams) {
  // 1. Authoritative MySQL Check: Ensure user has a valid completed or checked-in reservation
  const resRows = await query<any>(
    `SELECT r.id, r.user_id, s.facility_id, f.name AS facility_name
     FROM reservations r
     JOIN parking_slots s ON r.slot_id = s.id
     JOIN parking_facilities f ON s.facility_id = f.id
     WHERE r.id = ? AND r.user_id = ?`,
    [params.reservationId, params.userId]
  );

  if (resRows.length === 0) {
    throw new Error('ELIGIBILITY_FAILED: You can only submit feedback for your own reservations.');
  }

  const facilityName = resRows[0].facility_name;
  const mongo = await getMongoDb();
  const feedbacks = mongo.collection('feedbacks');

  // 2. Prevent duplicate reviews for the same reservation
  const existing = await feedbacks.findOne({ reservationId: params.reservationId });
  if (existing) {
    // Update existing review
    await feedbacks.updateOne(
      { reservationId: params.reservationId },
      {
        $set: {
          rating: params.rating,
          category: params.category,
          comment: params.comment,
          updatedAt: new Date(),
        },
      }
    );
    return { success: true, updated: true };
  }

  // 3. Insert new feedback document into MongoDB
  const doc = {
    reservationId: params.reservationId,
    facilityId: params.facilityId,
    facilityName,
    userId: params.userId,
    userName: params.userName,
    rating: params.rating,
    category: params.category,
    comment: params.comment,
    status: 'APPROVED', // Default approved; can be moderated by Admin
    createdAt: new Date(),
  };

  const insertResult = await feedbacks.insertOne(doc);
  return { success: true, feedbackId: insertResult.insertedId.toString() };
}

/**
 * Submit Incident Report to MongoDB
 */
export async function submitIncident(params: SubmitIncidentParams) {
  const facilityRows = await query<any>(
    'SELECT name FROM parking_facilities WHERE id = ?',
    [params.facilityId]
  );
  const facilityName = facilityRows[0]?.name || 'Unknown Facility';

  const mongo = await getMongoDb();
  const incidents = mongo.collection('incidents');

  const doc = {
    facilityId: params.facilityId,
    facilityName,
    slotNumber: params.slotNumber || null,
    reportedBy: params.userId,
    title: params.title,
    category: params.category,
    severity: params.severity,
    status: 'OPEN',
    description: params.description,
    reportedAt: new Date(),
  };

  const result = await incidents.insertOne(doc);
  return { success: true, incidentId: result.insertedId.toString() };
}

/**
 * MongoDB Aggregation: Facility Rating Breakdown & Common Complaints
 */
export async function getFeedbackAnalytics(facilityId?: string) {
  const mongo = await getMongoDb();
  const feedbacks = mongo.collection('feedbacks');
  const incidents = mongo.collection('incidents');

  const matchFilter: any = { status: 'APPROVED' };
  if (facilityId) matchFilter.facilityId = facilityId;

  // Aggregation 1: Rating summary & distribution
  const ratingStats = await feedbacks.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalCount: { $sum: 1 },
        stars5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        stars4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        stars3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        stars2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        stars1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]).toArray();

  // Aggregation 2: Category Breakdown
  const categoryStats = await feedbacks.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
    { $sort: { count: -1 } },
  ]).toArray();

  // Aggregation 3: Open incidents count
  const incidentFilter: any = {};
  if (facilityId) incidentFilter.facilityId = facilityId;
  const incidentStats = await incidents.aggregate([
    { $match: incidentFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]).toArray();

  return {
    ratings: ratingStats[0] || {
      averageRating: 0,
      totalCount: 0,
      stars5: 0,
      stars4: 0,
      stars3: 0,
      stars2: 0,
      stars1: 0,
    },
    categoryStats,
    incidentStats,
  };
}

/**
 * Get Feedback list with pagination
 */
export async function getFeedbacks(facilityId?: string, limit: number = 20) {
  const mongo = await getMongoDb();
  const filter: any = {};
  if (facilityId) filter.facilityId = facilityId;

  return await mongo.collection('feedbacks')
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Get Incidents list
 */
export async function getIncidents(limit: number = 20) {
  const mongo = await getMongoDb();
  return await mongo.collection('incidents')
    .find({})
    .sort({ reportedAt: -1 })
    .limit(limit)
    .toArray();
}

/**
 * Admin Respond to Feedback
 */
export async function respondToFeedback(feedbackId: string, adminId: string, responseText: string) {
  const mongo = await getMongoDb();
  await mongo.collection('feedbacks').updateOne(
    { _id: new ObjectId(feedbackId) },
    {
      $set: {
        adminResponse: {
          responderId: adminId,
          comment: responseText,
          respondedAt: new Date(),
        },
      },
    }
  );
  return { success: true };
}

/**
 * Admin Update Incident Status
 */
export async function updateIncidentStatus(incidentId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED', notes?: string) {
  const mongo = await getMongoDb();
  await mongo.collection('incidents').updateOne(
    { _id: new ObjectId(incidentId) },
    {
      $set: {
        status,
        resolutionNotes: notes || null,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
      },
    }
  );
  return { success: true };
}
