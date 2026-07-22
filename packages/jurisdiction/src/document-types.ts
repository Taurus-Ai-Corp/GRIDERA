/**
 * A1 report document types are bound to JurisdictionConfig.documentTypes.
 * Never invent a free-form "Canada pack" outside caConfig.
 */

import type { Jurisdiction } from './types.js'
import { naConfig } from './configs/na.js'
import { euConfig } from './configs/eu.js'
import { inConfig } from './configs/in.js'
import { aeConfig } from './configs/ae.js'
import { caConfig } from './configs/ca.js'
import type { JurisdictionConfig } from './types.js'

const configMap: Record<Jurisdiction, JurisdictionConfig> = {
  na: naConfig,
  eu: euConfig,
  in: inConfig,
  ae: aeConfig,
  ca: caConfig,
}

function getConfig(jurisdiction: Jurisdiction): JurisdictionConfig {
  return configMap[jurisdiction]
}

/** Document types A1 sales-engine / CA FI path must support. */
export const A1_REQUIRED_DOCUMENT_TYPES = [
  'pqc_readiness_report',
  'data_residency_certificate',
] as const

export type A1DocumentType = (typeof A1_REQUIRED_DOCUMENT_TYPES)[number]

export function getJurisdictionDocumentTypes(jurisdiction: Jurisdiction): string[] {
  return [...getConfig(jurisdiction).documentTypes]
}

export function isAllowedDocumentType(
  jurisdiction: Jurisdiction,
  documentType: string,
): boolean {
  return getJurisdictionDocumentTypes(jurisdiction).includes(documentType)
}

/**
 * Default report document type for a cell.
 * CA A1 defaults to pqc_readiness_report (CSE/OSFI readiness artifact).
 */
export function defaultReportDocumentType(jurisdiction: Jurisdiction): string {
  if (jurisdiction === 'ca') return 'pqc_readiness_report'
  const types = getJurisdictionDocumentTypes(jurisdiction)
  return types[0] ?? 'pqc_readiness_report'
}

/**
 * Resolve documentType for report creation.
 * @throws Error if requested type is not in jurisdiction pack
 */
export function resolveReportDocumentType(
  jurisdiction: Jurisdiction,
  requested?: string | null,
): string {
  if (requested == null || requested === '') {
    return defaultReportDocumentType(jurisdiction)
  }
  if (!isAllowedDocumentType(jurisdiction, requested)) {
    throw new Error(
      `documentType '${requested}' is not allowed for jurisdiction '${jurisdiction}'. ` +
        `Allowed: ${getJurisdictionDocumentTypes(jurisdiction).join(', ')}`,
    )
  }
  return requested
}

/** Fail loud if A1 required types are missing from the cell config. */
export function assertA1DocumentTypesSupported(jurisdiction: Jurisdiction): void {
  const types = getJurisdictionDocumentTypes(jurisdiction)
  for (const required of A1_REQUIRED_DOCUMENT_TYPES) {
    if (!types.includes(required)) {
      throw new Error(
        `Jurisdiction '${jurisdiction}' missing A1 document type '${required}' in config.documentTypes`,
      )
    }
  }
}
