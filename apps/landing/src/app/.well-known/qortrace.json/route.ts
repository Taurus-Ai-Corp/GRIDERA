import { NextResponse } from 'next/server'

export const dynamic = 'force-static'
export const revalidate = false

const qortraceSpec = {
  version: 'qortrace.threat.intel.v0',
  organization: {
    name: 'GRIDERA by Taurus AI Corp.',
    url: 'https://q-grid.net',
    contact: 'admin@taurusai.io',
  },
  feeds: [
    {
      id: 'gridera-pqc-scores',
      name: 'GRIDERA PQC Exposure Scores',
      description: 'Quantum Readiness Score (QRS) output from GRIDERA|Scan across 4 regions',
      methodology_version: 'qortrace-method-v0.2',
      update_frequency: 'hourly',
      format: 'hcs-json',
      endpoints: {
        hcs_topic: '0.0.9612022',
        rest: 'https://q-grid.net/api/v1/threat-radar',
        docs: 'https://q-grid.net/docs/threat-radar',
      },
      coverage: {
        chains: ['ethereum', 'bitcoin', 'solana', 'hedera', 'polygon', 'arbitrum', 'optimism', 'base'],
        regions: ['EU', 'NA', 'IN', 'AE'],
      },
      attestation: {
        signature_scheme: 'ML-DSA-65',
        anchor: 'hedera-hcs',
        public_key_url: 'https://q-grid.net/.well-known/pqc-public.key',
      },
    },
  ],
}

export async function GET() {
  return NextResponse.json(qortraceSpec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
