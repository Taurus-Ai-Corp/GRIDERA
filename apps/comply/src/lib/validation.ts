import { z } from 'zod'

// ─── System schemas ────────────────────────────────────────────────────────────

export const createSystemSchema = z.object({
  name: z.string().min(1, 'System name is required').max(200),
  description: z.string().max(2000).optional().default(''),
  useCase: z.string().max(1000).optional().default(''),
  industry: z
    .enum([
      'healthcare',
      'finance',
      'government',
      'defense',
      'education',
      'employment',
      'technology',
      'other',
    ])
    .optional()
    .default('other'),
  deploymentScope: z.enum(['internal', 'external', 'both']).optional().default('internal'),
  autonomyLevel: z
    .enum(['advisory', 'semi-autonomous', 'fully-autonomous'])
    .optional()
    .default('advisory'),
})

export type CreateSystemInput = z.infer<typeof createSystemSchema>

// ─── Assessment schemas ────────────────────────────────────────────────────────

export const createAssessmentSchema = z.object({
  systemId: z.string().uuid('systemId must be a valid UUID'),
})

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>

export const updateAssessmentSchema = z.object({
  responses: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
  currentSection: z.number().int().min(0).max(20).optional(),
  status: z.enum(['draft', 'in_progress', 'completed']).optional(),
})

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>

// ─── Report schemas ────────────────────────────────────────────────────────────

export const createReportSchema = z.object({
  assessmentId: z.string().uuid('assessmentId must be a valid UUID'),
  mode: z.enum(['template', 'cloud', 'sovereign']).optional().default('template'),
  // Bound to JurisdictionConfig.documentTypes at route (caConfig for CA cell)
  documentType: z.string().min(1).max(80).optional(),
  // sovereignEndpoint is validated as a URL only when mode=sovereign; empty string means not set
  sovereignEndpoint: z.union([z.string().url(), z.literal('')]).optional(),
  sovereignModel: z.string().max(100).optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
