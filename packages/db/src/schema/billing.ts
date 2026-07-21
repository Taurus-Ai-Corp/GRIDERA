import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { organizations } from './organizations'

export const billing = pgTable('billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  // Payment-provider abstraction (Stripe replacement — see
  // docs/payments-open-source-stack.md). `provider` is one of
  // 'stripe' | 'hyperswitch' | 'hedera' | 'lago'; `providerEventId` is the
  // provider's idempotency key (Stripe event id, Hedera tx id, Lago event id).
  provider: text('provider'),
  providerEventId: text('provider_event_id').unique(),
  /** @deprecated Use providerEventId. Retained for backward compat until Stripe
   * removal (Phase 5). Backfilled into providerEventId by the provider-generic migration. */
  stripeEventId: text('stripe_event_id').unique(),
  type: text('type').notNull(),
  amountCents: integer('amount_cents'),
  currency: text('currency'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // PQC columns
  pqcHash: text('pqc_hash'),
  pqcSignature: text('pqc_signature'),
  hederaTxId: text('hedera_tx_id'),
})
