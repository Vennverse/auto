import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import ws from "ws";

const { Pool: PgPool } = pkg;
import * as schema from "@shared/schema";

// Configure database based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasReplitDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');
const hasExternalDb = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('neon') || 
   process.env.DATABASE_URL.includes('supabase') ||
   process.env.DATABASE_URL.includes('planetscale'));

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;

// Use the database URL from environment variable
console.log('Using database from environment variable');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Use Neon serverless with WebSocket support
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: DATABASE_URL });
db = drizzle({ client: pool, schema });

export { db };