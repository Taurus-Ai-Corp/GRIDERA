import { describe, it, expect } from 'vitest'
import {
  A1_REQUIRED_DOCUMENT_TYPES,
  isAllowedDocumentType,
  resolveReportDocumentType,
  getJurisdictionDocumentTypes,
  assertA1DocumentTypesSupported,
} from './document-types.js'

describe('document types (A1 bind to jurisdiction config)', () => {
  it('lists CA document types including A1 primaries', () => {
    const types = getJurisdictionDocumentTypes('ca')
    expect(types).toContain('pqc_readiness_report')
    expect(types).toContain('data_residency_certificate')
  })

  it('accepts pqc_readiness_report for ca', () => {
    expect(isAllowedDocumentType('ca', 'pqc_readiness_report')).toBe(true)
  })

  it('rejects unknown document types for ca', () => {
    expect(isAllowedDocumentType('ca', 'invented_canada_pack')).toBe(false)
  })

  it('resolves default CA A1 report type to pqc_readiness_report', () => {
    expect(resolveReportDocumentType('ca')).toBe('pqc_readiness_report')
  })

  it('resolves explicit allowed type when provided', () => {
    expect(resolveReportDocumentType('ca', 'data_residency_certificate')).toBe(
      'data_residency_certificate',
    )
  })

  it('throws when explicit type is not in jurisdiction pack', () => {
    expect(() => resolveReportDocumentType('ca', 'eu_only_fake_type')).toThrow(
      /documentType/,
    )
  })

  it('asserts A1 required types exist on caConfig', () => {
    expect(() => assertA1DocumentTypesSupported('ca')).not.toThrow()
    for (const t of A1_REQUIRED_DOCUMENT_TYPES) {
      expect(getJurisdictionDocumentTypes('ca')).toContain(t)
    }
  })
})
