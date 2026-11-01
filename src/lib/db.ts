import mysql from 'mysql2/promise';

// Authoritative MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'parkwise',
  password: process.env.MYSQL_PASSWORD || 'parkwise_password',
  database: process.env.MYSQL_DATABASE || 'parkwise_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Execute parameterized query safely preventing SQL Injection
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

/**
 * Get dedicated connection for transactional operations (Pessimistic Locking / Multi-step ACID)
 */
export async function getConnection() {
  return await pool.getConnection();
}

export default pool;
