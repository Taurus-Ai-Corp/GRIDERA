/**
 * GRIDERA Guard — Preset Index
 *
 * Re-exports all jurisdiction presets.
 */

export { EU_AI_ACT_PRESET } from './eu-ai-act'
export { NIST_AI_RMF_PRESET } from './nist-ai-rmf'
export { SOC2_PRESET } from './soc2'

import { EU_AI_ACT_PRESET } from './eu-ai-act'
import { NIST_AI_RMF_PRESET } from './nist-ai-rmf'
import { SOC2_PRESET } from './soc2'
import type { JurisdictionPreset, GuardRule } from '../types'

export const PRESETS: Record<JurisdictionPreset, { rules: GuardRule[]; name: string }> = {
  'eu-ai-act': EU_AI_ACT_PRESET,
  'nist-ai-rmf': NIST_AI_RMF_PRESET,
  'soc2': SOC2_PRESET,
  'default': { name: 'default', rules: [] },
}