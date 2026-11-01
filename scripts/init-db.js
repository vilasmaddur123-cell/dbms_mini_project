const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  console.log('--- Initializing ParkWise MySQL Database ---');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'parkwise',
    password: process.env.MYSQL_PASSWORD || 'parkwise_password',
    multipleStatements: true,
  });

  try {
    console.log('Connected to MySQL. Executing schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf-8');
    await connection.query(schemaSql);
    console.log('Schema created successfully.');

    console.log('Executing views.sql...');
    const viewsSql = fs.readFileSync(path.join(__dirname, '../database/views.sql'), 'utf-8');
    await connection.query(viewsSql);
    console.log('Views created successfully.');

    console.log('Executing procedures.sql...');
    // Execute procedures with delimiter handling
    const procSql = fs.readFileSync(path.join(__dirname, '../database/procedures.sql'), 'utf-8');
    // Strip DELIMITER statements for mysql2 multipleStatements
    const cleanProcSql = procSql
      .replace(/DELIMITER\s+\$\$/g, '')
      .replace(/DELIMITER\s+;/g, '')
      .replace(/\$\$/g, ';');
    await connection.query(cleanProcSql);
    console.log('Stored procedures created successfully.');

    console.log('Executing triggers.sql...');
    const trigSql = fs.readFileSync(path.join(__dirname, '../database/triggers.sql'), 'utf-8');
    const cleanTrigSql = trigSql
      .replace(/DELIMITER\s+\$\$/g, '')
      .replace(/DELIMITER\s+;/g, '')
      .replace(/\$\$/g, ';');
    await connection.query(cleanTrigSql);
    console.log('Database triggers created successfully.');

    console.log('--- ParkWise MySQL Database Initialization Complete ---');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
