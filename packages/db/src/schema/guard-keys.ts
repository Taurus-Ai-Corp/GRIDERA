import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const guardKeys = pgTable('guard_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  apiKeyHash: text('api_key_hash').notNull(),
  apiKeyPrefix: text('api_key_prefix').notNull(),
  tier: text('tier').notNull().default('sandbox'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  active: boolean('active').notNull().default(true),
  monthlyLimit: integer('monthly_limit').notNull().default(1000),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
})
