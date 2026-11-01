import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let memoryServerInstance: any = null;

const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parkwise';
const DB_NAME = process.env.MONGODB_DB_NAME || 'parkwise';

/**
 * Connect to authoritative MongoDB or auto-start embedded official mongod if offline
 */
export async function getMongoDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  // First try direct connection to configured URI
  try {
    const client = new MongoClient(DEFAULT_URI, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    await initMongoIndexes(cachedDb);
    return cachedDb;
  } catch (err) {
    // If external MongoDB is not active on port 27017, start official MongoMemoryServer
    if (!memoryServerInstance) {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServerInstance = await MongoMemoryServer.create({
          instance: {
            dbName: DB_NAME,
          },
        });
        const memoryUri = memoryServerInstance.getUri();
        const client = new MongoClient(memoryUri);
        await client.connect();
        cachedClient = client;
        cachedDb = client.db(DB_NAME);
        await initMongoIndexes(cachedDb);
        return cachedDb;
      } catch (memErr) {
        console.error('Failed to initialize MongoDB Memory Server:', memErr);
        throw memErr;
      }
    }
    const memoryUri = memoryServerInstance.getUri();
    const client = new MongoClient(memoryUri);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db(DB_NAME);
    return cachedDb;
  }
}

/**
 * Ensure proper MongoDB collection indexes are in place
 */
async function initMongoIndexes(db: Db) {
  try {
    await db.collection('feedbacks').createIndex({ facilityId: 1, rating: -1 });
    await db.collection('feedbacks').createIndex({ reservationId: 1 }, { unique: true });
    await db.collection('incidents').createIndex({ facilityId: 1, status: 1 });
    await db.collection('recommendation_logs').createIndex({ userId: 1, createdAt: -1 });
  } catch (e) {
    // Indexes might already exist
  }
}

export async function closeMongo() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
}
