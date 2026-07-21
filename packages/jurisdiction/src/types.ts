export type Jurisdiction = 'na' | 'eu' | 'in' | 'ae' | 'ca'

export interface Regulation {
  id: string
  name: string
  authority: string
  /** ISO date the mandate bites (procurement gate, sunset, enforcement start). */
  deadline?: string
}

export interface RiskLevel {
  key: string
  label: string
  color: string
  bgColor: string
  description: string
}

export interface JurisdictionConfig {
  id: Jurisdiction
  name: string
  shortName: string
  domain: string
  currency: { code: string; symbol: string; locale: string }
  regulations: Regulation[]
  riskLevels: RiskLevel[]
  assessmentTitle: string
  documentTypes: string[]
  supportedLocales: string[]
  defaultLocale: string
  dataResidencyRegion: string
  vercelRegion: string
  pricingMultiplier: number
}
