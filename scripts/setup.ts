#!/usr/bin/env bun
/**
 * Bistro Setup Script
 * Runs after `bun install` or manually via `bun setup`
 * Sets up local development environment
 */

import { existsSync } from 'fs';
import { copyFile, readFile, writeFile } from 'fs/promises';
import { randomBytes } from 'crypto';
import { $ } from 'bun';

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const isDocker = existsSync('/.dockerenv');

// Colors for output
const c = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
};

async function prompt(question: string, defaultValue = true): Promise<boolean> {
  const stdin = Bun.stdin.stream();
  const reader = stdin.getReader();

  process.stdout.write(`${question} [${defaultValue ? 'Y/n' : 'y/N'}] `);

  const decoder = new TextDecoder();
  const { value } = await reader.read();
  reader.releaseLock();

  if (!value) return defaultValue;

  const answer = decoder.decode(value).trim().toLowerCase();
  if (!answer) return defaultValue;

  return answer.startsWith('y');
}

async function checkDockerRunning(): Promise<boolean> {
  try {
    await $`docker compose ps`.quiet();
    return true;
  }
  catch {
    return false;
  }
}

async function waitForPostgres(maxAttempts = 30): Promise<boolean> {
  console.log('  Waiting for PostgreSQL...');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await $`docker compose exec -T postgres pg_isready -U bistro`.quiet();
      return true;
    }
    catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return false;
}

async function main() {
  // Skip setup in CI, production, or Docker
  if (isCI) {
    console.log('CI environment detected, skipping setup');
    process.exit(0);
  }

  if (isProduction) {
    console.log('Production environment detected, skipping setup');
    process.exit(0);
  }

  if (isDocker) {
    console.log('Docker environment detected, skipping setup');
    process.exit(0);
  }

  // Skip if .env exists (already set up)
  if (existsSync('.env')) {
    console.log(c.green('✓') + ' Environment already set up (.env exists)');
    console.log(c.cyan('  Run: bun dev'));
    process.exit(0);
  }

  console.log(c.cyan('\n🍽️  Bistro Setup\n'));

  // Step 1: Check/create .env
  if (!existsSync('.env')) {
    if (await prompt('Create .env from template?')) {
      await copyFile('.env.example', '.env');
      console.log(c.green('✓') + ' Created .env');

      // Generate random AUTH_SECRET
      const envContent = await readFile('.env', 'utf-8');
      const secret = randomBytes(32).toString('hex');
      const updatedEnv = envContent.replace(
        'AUTH_SECRET=your-secret-key-change-in-production',
        `AUTH_SECRET=${secret}`,
      );
      await writeFile('.env', updatedEnv);
      console.log(c.green('✓') + ' Generated AUTH_SECRET');

      // Create .env.docker with Docker network hostname
      const dockerEnv = updatedEnv
        .replace(
          'DATABASE_URL=postgresql://bistro:bistro@localhost:5432/bistro',
          'DATABASE_URL=postgresql://bistro:bistro@postgres:5432/bistro',
        )
        .replace('REDIS_URL=redis://localhost:6379', 'REDIS_URL=redis://redis:6379');
      await writeFile('.env.docker', dockerEnv);
      console.log(c.green('✓') + ' Created .env.docker (for Docker testing)');
    }
    else {
      console.log(c.yellow('⊘ Skipped .env creation'));
      console.log(c.yellow('  Run: cp .env.example .env'));
      return;
    }
  }
  else {
    console.log(c.green('✓') + ' .env exists');
  }

  // Step 2: Check Docker services
  const dockerRunning = await checkDockerRunning();

  if (!dockerRunning) {
    if (await prompt('Start Docker services (postgres, redis)?')) {
      console.log('  Starting services...');
      await $`docker compose up -d`;
      console.log(c.green('✓') + ' Docker services started');
    }
    else {
      console.log(c.yellow('⊘ Skipped Docker start'));
      console.log(c.yellow('  Run: docker compose up -d'));
      return;
    }
  }
  else {
    console.log(c.green('✓') + ' Docker services running');
  }

  // Step 3: Wait for PostgreSQL
  const pgReady = await waitForPostgres();

  if (!pgReady) {
    console.log(c.red('✗ PostgreSQL not ready'));
    console.log(c.yellow('  Check: docker compose logs postgres'));
    return;
  }

  console.log(c.green('✓') + ' PostgreSQL ready');

  // Step 4: Run migrations
  if (await prompt('Run database migrations?')) {
    console.log('  Running migrations...');
    await $`cd apps/web && bunx prisma migrate dev --name init`;
    console.log(c.green('✓') + ' Database migrated');
  }

  // Step 5: Generate Prisma client
  console.log('  Generating Prisma client...');
  await $`cd apps/web && bunx prisma generate`;
  console.log(c.green('✓') + ' Prisma client generated');

  // Done!
  console.log(c.green('\n✓ Setup complete!\n'));
  console.log('Next steps:');
  console.log(c.cyan('  bun dev') + '     # Start dev server');
  console.log(c.cyan('  bun dev:landing') + ' # Start landing site\n');
}

main().catch((error) => {
  console.error(c.red('\n✗ Setup failed:'), error.message);
  process.exit(1);
});
