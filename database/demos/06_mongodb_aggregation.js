/**
 * ============================================================================
 * PARKWISE DBMS DEMO 6: MONGODB DOCUMENT MODELING & AGGREGATION PIPELINES
 * ============================================================================
 * Objective: Demonstrate NoSQL document modeling, indexing, and complex
 * aggregation pipelines ($match, $group, $project, $sort) for flexible user
 * feedback, parking incidents, and recommendation explanations.
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parkwise';
const dbName = process.env.MONGODB_DB_NAME || 'parkwise';

async function runMongoDemo() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB server');
    const db = client.db(dbName);

    const feedbacks = db.collection('feedbacks');
    const incidents = db.collection('incidents');
    const recommendationLogs = db.collection('recommendation_logs');

    // Create Indexes
    await feedbacks.createIndex({ facilityId: 1, rating: -1 });
    await feedbacks.createIndex({ reservationId: 1 }, { unique: true });
    await incidents.createIndex({ facilityId: 1, status: 1 });
    console.log('Indexes created successfully');

    // Seed Sample Feedbacks
    await feedbacks.deleteMany({});
    await feedbacks.insertMany([
      {
        reservationId: 'res-hist-01',
        facilityId: 'fac-pesu',
        facilityName: 'PES University Multi-Level Parking Hub',
        userId: 'usr-cust-01',
        userName: 'John Doe',
        rating: 5,
        category: 'cleanliness',
        comment: 'Spacious slots and excellent lighting on Floor 1. Seamless barrier exit.',
        adminResponse: {
          responderId: 'usr-admin-01',
          comment: 'Thank you for your feedback John! We strive to maintain high standards.',
          respondedAt: new Date(),
        },
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 9 * 86400000),
      },
      {
        reservationId: 'res-hist-03',
        facilityId: 'fac-pesu',
        facilityName: 'PES University Multi-Level Parking Hub',
        userId: 'usr-cust-02',
        userName: 'Sarah Connor',
        rating: 4,
        category: 'accessibility',
        comment: 'Ramp access was clear and slot G-01 was directly adjacent to the entrance.',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        reservationId: 'res-hist-06',
        facilityId: 'fac-forum',
        facilityName: 'Nexus Forum Mall Parking Deck',
        userId: 'usr-cust-01',
        userName: 'John Doe',
        rating: 3,
        category: 'pricing',
        comment: 'Weekend pricing is slightly steep during peak hours, but convenient.',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        reservationId: 'res-hist-07',
        facilityId: 'fac-forum',
        facilityName: 'Nexus Forum Mall Parking Deck',
        userId: 'usr-cust-03',
        userName: 'David Miller',
        rating: 5,
        category: 'availability',
        comment: 'EV charging slot was open and functioning at full 50kW rate.',
        status: 'APPROVED',
        createdAt: new Date(Date.now() - 3 * 86400000),
      },
    ]);
    console.log('Sample feedback documents inserted');

    // Seed Sample Incidents
    await incidents.deleteMany({});
    await incidents.insertMany([
      {
        facilityId: 'fac-pesu',
        facilityName: 'PES University Multi-Level Parking Hub',
        slotNumber: 'F2-04',
        reportedBy: 'usr-cust-01',
        title: 'Floor 2 Entry Barrier Sensor Delay',
        category: 'maintenance',
        severity: 'LOW',
        status: 'RESOLVED',
        description: 'Barrier took approximately 45 seconds to detect vehicle license plate.',
        resolutionNotes: 'Sensor recalibrated and lens wiped by facility engineering team.',
        reportedAt: new Date(Date.now() - 5 * 86400000),
        resolvedAt: new Date(Date.now() - 4 * 86400000),
      },
      {
        facilityId: 'fac-forum',
        facilityName: 'Nexus Forum Mall Parking Deck',
        slotNumber: 'B1-02',
        reportedBy: 'usr-cust-04',
        title: 'EV Charger Connector Cable Tension',
        category: 'equipment',
        severity: 'MEDIUM',
        status: 'OPEN',
        description: 'Connector cable sheath shows minor outer wear; needs inspection.',
        reportedAt: new Date(Date.now() - 1 * 86400000),
      },
    ]);
    console.log('Sample incident documents inserted');

    // AGGREGATION PIPELINE 1: Rating Distribution & Facility Averages
    console.log('\n--- MONGODB AGGREGATION PIPELINE 1: Facility Rating Breakdown ---');
    const ratingAggregation = await feedbacks.aggregate([
      { $match: { status: 'APPROVED' } },
      {
        $group: {
          _id: '$facilityName',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStarCount: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStarCount: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStarCount: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        },
      },
      {
        $project: {
          facility: '$_id',
          avgRating: { $round: ['$avgRating', 2] },
          totalReviews: 1,
          fiveStarCount: 1,
          fourStarCount: 1,
          threeStarCount: 1,
          _id: 0,
        },
      },
      { $sort: { avgRating: -1 } },
    ]).toArray();
    console.table(ratingAggregation);

    // AGGREGATION PIPELINE 2: Feedback Categories Breakdown
    console.log('\n--- MONGODB AGGREGATION PIPELINE 2: Feedback by Category ---');
    const categoryAggregation = await feedbacks.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();
    console.table(categoryAggregation);

    // AGGREGATION PIPELINE 3: Incident Resolution Summary
    console.log('\n--- MONGODB AGGREGATION PIPELINE 3: Incident Status Breakdown ---');
    const incidentAggregation = await incidents.aggregate([
      {
        $group: {
          _id: '$status',
          total: { $sum: 1 },
          facilitiesAffected: { $addToSet: '$facilityName' },
        },
      },
    ]).toArray();
    console.table(incidentAggregation);

  } finally {
    await client.close();
  }
}

if (require.main === module) {
  runMongoDemo().catch(console.error);
}

module.exports = { runMongoDemo };
