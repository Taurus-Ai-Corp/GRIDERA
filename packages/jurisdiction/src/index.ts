export { detectJurisdiction } from './detect.js'
export { naConfig } from './configs/na.js'
export { euConfig } from './configs/eu.js'
export { inConfig } from './configs/in.js'
export { aeConfig } from './configs/ae.js'
export { caConfig } from './configs/ca.js'
export type { Jurisdiction, Regulation, RiskLevel, JurisdictionConfig } from './types.js'

import type { Jurisdiction, JurisdictionConfig } from './types.js'
import { naConfig } from './configs/na.js'
import { euConfig } from './configs/eu.js'
import { inConfig } from './configs/in.js'
import { aeConfig } from './configs/ae.js'
import { caConfig } from './configs/ca.js'

const configMap: Record<Jurisdiction, JurisdictionConfig> = {
  na: naConfig,
  eu: euConfig,
  in: inConfig,
  ae: aeConfig,
  ca: caConfig,
}

export function getJurisdictionConfig(jurisdiction: Jurisdiction): JurisdictionConfig {
  return configMap[jurisdiction]
}
