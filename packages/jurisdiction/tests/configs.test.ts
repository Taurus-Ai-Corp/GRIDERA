import { describe, it, expect } from 'vitest'
import { naConfig } from '../src/configs/na.js'

/**
 * NA launch activation (2026-07): the NA regulatory pack must carry the US
 * federal deadline stack — the "compliance egg-timer" the landing narrative
 * sells — alongside the existing Canadian frameworks, and bill in USD per the
 * dual-entity decision (USD via US LLC for US/LATAM, CAD handled separately).
 */
describe('naConfig — NA launch regulatory pack', () => {
  const regIds = () => naConfig.regulations.map((r) => r.id)

  it('serves na.q-grid.net and bills in USD', () => {
    expect(naConfig.domain).toBe('na.q-grid.net')
    expect(naConfig.currency.code).toBe('USD')
    expect(naConfig.currency.locale).toBe('en-US')
  })

  it('carries the US federal deadline stack', () => {
    expect(regIds()).toEqual(
      expect.arrayContaining([
        'eo-14412',
        'cnsa-2-0',
        'nist-fips-203-204',
        'fips-140-2-sunset',
        'cmmc-2-0',
        'fedramp',
        'hipaa',
      ]),
    )
  })

  it('dates the deadline-stack regulations (deadline stacking narrative)', () => {
    const byId = Object.fromEntries(naConfig.regulations.map((r) => [r.id, r]))
    expect(byId['cnsa-2-0'].deadline).toBe('2027-01-01')
    expect(byId['fips-140-2-sunset'].deadline).toBe('2026-09-21')
    expect(byId['eo-14412'].deadline).toBeDefined()
    expect(byId['cmmc-2-0'].deadline).toBeDefined()
  })

  it('retains the Canadian frameworks (NA covers both countries)', () => {
    expect(regIds()).toEqual(
      expect.arrayContaining(['pipeda', 'cccs-pqc', 'osfi-b13', 'soc2']),
    )
  })
})
