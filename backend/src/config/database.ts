import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;
let memDbAdapter: any = null;
let isInMemory = false;

// Table creation schema with standard PostgreSQL types
const INIT_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_name VARCHAR(120) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  is_repaid BOOLEAN DEFAULT FALSE NOT NULL,
  repaid_at TIMESTAMP,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
CREATE INDEX IF NOT EXISTS idx_otps_phone ON otps(phone);
`;

/**
 * Initialize in-memory PostgreSQL (via pg-mem) for standalone testing/dev
 */
async function setupInMemoryDb(): Promise<void> {
  const { newDb } = await import('pg-mem');
  const db = newDb();

  // Execute schema
  db.public.none(INIT_SCHEMA_SQL);
  memDbAdapter = db.adapters.createPg();
  isInMemory = true;
  console.log('⚡ [Database] Running with in-memory PostgreSQL engine (pg-mem). Ready for standalone execution!');
}

/**
 * Initialize connection pool to PostgreSQL or fallback gracefully
 */
export async function initDb(): Promise<void> {
  // If explicitly requested or running in test mode with no explicit DB URL
  if (process.env.USE_MEMORY_DB === 'true' || (process.env.NODE_ENV === 'test' && !process.env.TEST_DATABASE_URL)) {
    await setupInMemoryDb();
    return;
  }

  const connectionString = process.env.DATABASE_URL;

  try {
    pool = new Pool(
      connectionString
        ? { connectionString, ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined }
        : {
            host: process.env.PGHOST || 'localhost',
            port: parseInt(process.env.PGPORT || '5432', 10),
            user: process.env.PGUSER || 'postgres',
            password: process.env.PGPASSWORD || 'postgres',
            database: process.env.PGDATABASE || 'miniledger',
            connectionTimeoutMillis: 3000,
          }
    );

    // Test connection with a timeout
    const client = await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PostgreSQL connection timed out')), 3500)
      ),
    ]);

    try {
      await client.query(INIT_SCHEMA_SQL);
      console.log('✅ [Database] Connected to PostgreSQL & schemas verified successfully.');
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.warn(`⚠️ [Database] Unable to connect to PostgreSQL server: ${error.message}`);
    console.log('🔄 [Database] Falling back to high-fidelity In-Memory PostgreSQL (pg-mem) for zero-config operation...');
    await setupInMemoryDb();
  }
}

/**
 * Universal query function supporting both live PostgreSQL and pg-mem
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  if (isInMemory && memDbAdapter) {
    const client = new memDbAdapter.Client();
    await client.connect();
    try {
      const res = (await client.query(text, params)) as QueryResult<T>;
      return res;
    } finally {
      await client.end();
    }
  }

  if (!pool) {
    throw new Error('Database has not been initialized. Call initDb() first.');
  }

  return pool.query<T>(text, params);
}

export function getIsInMemory(): boolean {
  return isInMemory;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
