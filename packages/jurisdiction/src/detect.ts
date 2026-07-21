import type { Jurisdiction } from './types.js'

export function detectJurisdiction(hostname: string, envOverride?: string): Jurisdiction {
  if (envOverride && isValidJurisdiction(envOverride)) return envOverride

  // Subdomain pattern: eu.q-grid.net, na.q-grid.net, in.q-grid.net, ae.q-grid.net, ca.q-grid.net
  if (hostname.startsWith('eu.')) return 'eu'
  if (hostname.startsWith('in.')) return 'in'
  if (hostname.startsWith('ae.')) return 'ae'
  if (hostname.startsWith('ca.')) return 'ca'
  if (hostname.startsWith('na.')) return 'na'

  // Legacy domain patterns (separate TLDs — kept for backward compatibility)
  if (hostname.includes('q-grid.eu')) return 'eu'
  if (hostname.includes('q-grid.in')) return 'in'
  if (hostname.includes('q-grid.ae')) return 'ae'
  if (hostname.includes('q-grid.ca')) return 'ca'

  return 'na' // Default: q-grid.net and localhost → NA
}

function isValidJurisdiction(value: string): value is Jurisdiction {
  return ['na', 'eu', 'in', 'ae', 'ca'].includes(value)
}
