import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';
import { incrementDbQueries, log } from './request-context';

const isDev = process.env.NODE_ENV === 'development';

// Symbol key for HMR-safe singleton
const PRISMA_KEY = Symbol.for('bistro.prisma');

function prismaClientSingleton() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg({ connectionString });

  const client = new PrismaClient({
    adapter,
    log: isDev
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'warn' },
        ]
      : [{ emit: 'stdout', level: 'error' }],
  });

  // Route queries to request trace in dev
  if (isDev) {
    client.$on('query', (e) => {
      incrementDbQueries();
      // Truncate long queries for readability
      const query = e.query.length > 100 ? `${e.query.slice(0, 100)}...` : e.query;
      log.debug(`DB ${e.duration}ms: ${query}`);
    });
  }

  return client;
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// Lazy init - avoids crash during prerender when no DATABASE_URL
function getDb(): PrismaClientSingleton {
  const cached = (globalThis as Record<symbol, unknown>)[PRISMA_KEY] as PrismaClientSingleton | undefined;
  if (cached) {
    return cached;
  }

  const client = prismaClientSingleton();
  (globalThis as Record<symbol, unknown>)[PRISMA_KEY] = client;
  return client;
}

export const db = new Proxy({} as PrismaClientSingleton, {
  get(_, prop) {
    return getDb()[prop as keyof PrismaClientSingleton];
  },
});
