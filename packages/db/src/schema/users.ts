import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { jurisdictionEnum, planEnum } from './enums'
import { organizations } from './organizations'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique(), // Optional for Clerk migration
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // bcrypt/argon2 hash for JWT auth
  organizationId: uuid('organization_id').references(() => organizations.id),
  jurisdiction: jurisdictionEnum('jurisdiction'),
  plan: planEnum('plan'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // PQC columns
  pqcHash: text('pqc_hash'),
  pqcSignature: text('pqc_signature'),
  hederaTxId: text('hedera_tx_id'),
})
