import { pgEnum } from 'drizzle-orm/pg-core'

export const jurisdictionEnum = pgEnum('jurisdiction', ['na', 'eu', 'in', 'ae', 'ca'])
export const planEnum = pgEnum('plan', ['free', 'starter', 'growth', 'enterprise'])
export const assessmentStatusEnum = pgEnum('assessment_status', ['draft', 'in_progress', 'completed', 'archived'])
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical'])
export const entityTypeEnum = pgEnum('entity_type', ['organization', 'user', 'system', 'assessment', 'report', 'scan'])
