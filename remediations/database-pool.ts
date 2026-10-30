// remediations/database-pool.ts
// Serverless Connection Pooling Architecture for PostgreSQL / Prisma

import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple client instances during hot-reloading in Next.js development
  var prismaGlobal: PrismaClient | undefined;
}

// Ensure connection pool limits are tailored for Serverless Edge runtimes
export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL // Pooler connection string (e.g. pgBouncer / Neon pooler)
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Health check helper to verify database connectivity without query overhead
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
