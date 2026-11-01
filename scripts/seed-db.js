const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { runMongoDemo } = require('../database/demos/06_mongodb_aggregation');

async function seedDatabase() {
  console.log('--- Seeding ParkWise Database ---');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'parkwise',
    password: process.env.MYSQL_PASSWORD || 'parkwise_password',
    database: process.env.MYSQL_DATABASE || 'parkwise_db',
    multipleStatements: true,
  });

  try {
    console.log('Executing seed.sql in MySQL...');
    const seedSql = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf-8');
    await connection.query(seedSql);
    console.log('MySQL seed data inserted successfully.');

    // Seed MongoDB documents
    console.log('Seeding MongoDB documents and verifying aggregation pipelines...');
    try {
      await runMongoDemo();
      console.log('MongoDB seed data inserted successfully.');
    } catch (mErr) {
      console.warn('MongoDB standalone seed note:', mErr.message);
    }

    console.log('--- ParkWise Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
