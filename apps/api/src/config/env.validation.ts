import { Logger } from '@nestjs/common';
import { z } from 'zod';

const logger = new Logger('EnvValidation');

/**
 * Boot-time env check. Payment keys stay OPTIONAL so the app runs with
 * checkout disabled (the adapters degrade gracefully), but a half-configured
 * provider — a key without its webhook secret — is caught here rather than at
 * the first webhook, when money is already in flight.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be >= 16 chars'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    /// Absolute base this API is reachable at — baked into stored photo URLs.
    PUBLIC_API_URL: z.string().url().optional(),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_PREMIUM: z.string().optional(),
    STRIPE_PRICE_PREMIUM_PLUS: z.string().optional(),

    MONEROO_SECRET_KEY: z.string().optional(),
    MONEROO_WEBHOOK_SECRET: z.string().optional(),
    MONEROO_BASE_URL: z.string().url().default('https://api.moneroo.io'),

    INTERNAL_CRON_TOKEN: z.string().min(16).optional(),
  })
  // Unknown keys pass through untouched — this validates, it does not restrict.
  .passthrough();

export function validateEnv(raw: Record<string, unknown>) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  // Half-configured providers are a silent-failure trap: checkout would take
  // money that no verifiable webhook could ever fulfil.
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_SECRET_KEY set without STRIPE_WEBHOOK_SECRET — card payments disabled');
  }
  if (env.MONEROO_SECRET_KEY && !env.MONEROO_WEBHOOK_SECRET) {
    logger.error('MONEROO_SECRET_KEY set without MONEROO_WEBHOOK_SECRET — Mobile Money disabled');
  }
  if (env.MONEROO_WEBHOOK_SECRET && !env.MONEROO_SECRET_KEY) {
    logger.warn('MONEROO_WEBHOOK_SECRET set without MONEROO_SECRET_KEY — Mobile Money disabled');
  }
  if (!env.INTERNAL_CRON_TOKEN) {
    logger.warn('INTERNAL_CRON_TOKEN not set — the expiry sweep endpoint is disabled');
  }

  return env;
}
