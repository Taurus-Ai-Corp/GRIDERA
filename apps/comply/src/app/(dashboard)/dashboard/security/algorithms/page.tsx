'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Lock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

// ---------- Types ----------

interface DsaVariant {
  variant: string
  level: string
  publicKey: string
  signature: string
  useCase: string
}

interface KemVariant {
  variant: string
  level: string
  publicKey: string
  ciphertext: string
  useCase: string
}

interface LegacyAlgorithm {
  algorithm: string
  status: 'Deprecated' | 'Acceptable'
  risk: 'HIGH' | 'MEDIUM'
  migrationPath: string
}

// ---------- Data ----------

const ML_DSA_VARIANTS: DsaVariant[] = [
  {
    variant: 'ML-DSA-44',
    level: 'NIST Level 2',
    publicKey: '1,312 B',
    signature: '2,420 B',
    useCase: 'General purpose',
  },
  {
    variant: 'ML-DSA-65',
    level: 'NIST Level 3',
    publicKey: '1,952 B',
    signature: '3,309 B',
    useCase: 'Recommended',
  },
  {
    variant: 'ML-DSA-87',
    level: 'NIST Level 5',
    publicKey: '2,592 B',
    signature: '4,627 B',
    useCase: 'High security',
  },
]

const ML_KEM_VARIANTS: KemVariant[] = [
  {
    variant: 'ML-KEM-512',
    level: 'NIST Level 1',
    publicKey: '800 B',
    ciphertext: '768 B',
    useCase: 'Basic',
  },
  {
    variant: 'ML-KEM-768',
    level: 'NIST Level 3',
    publicKey: '1,184 B',
    ciphertext: '1,088 B',
    useCase: 'Recommended',
  },
  {
    variant: 'ML-KEM-1024',
    level: 'NIST Level 5',
    publicKey: '1,568 B',
    ciphertext: '1,568 B',
    useCase: 'High security',
  },
]

const LEGACY_ALGORITHMS: LegacyAlgorithm[] = [
  {
    algorithm: 'RSA-2048',
    status: 'Deprecated',
    risk: 'HIGH',
    migrationPath: '→ ML-DSA-65',
  },
  {
    algorithm: 'RSA-4096',
    status: 'Acceptable',
    risk: 'MEDIUM',
    migrationPath: '→ ML-DSA-87',
  },
  {
    algorithm: 'ECDSA P-256',
    status: 'Deprecated',
    risk: 'HIGH',
    migrationPath: '→ ML-DSA-65',
  },
  {
    algorithm: 'Ed25519',
    status: 'Acceptable',
    risk: 'MEDIUM',
    migrationPath: '→ ML-DSA-65',
  },
]

// ---------- Helpers ----------

function PqcBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold font-mono text-accent bg-accent-light">
      {label}
    </span>
  )
}

function LevelBadge({ level }: { level: string }) {
  const isTop = level.includes('5')
  const isMid = level.includes('3')
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
        isTop
          ? 'text-purple-700 bg-purple-50'
          : isMid
          ? 'text-accent bg-accent-light'
          : 'text-blue-700 bg-blue-50'
      }`}
    >
      {level}
    </span>
  )
}

function RecommendedTag({ useCase }: { useCase: string }) {
  if (useCase === 'Recommended') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-accent bg-accent-light px-1.5 py-0.5 rounded">
        <CheckCircle className="h-2.5 w-2.5" />
        Recommended
      </span>
    )
  }
  return <span className="text-xs text-graphite-med">{useCase}</span>
}

export default function AlgorithmsPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/dashboard/security"
            className="inline-flex items-center gap-1 text-xs font-medium text-graphite-med hover:text-graphite transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Security
          </Link>
          <span className="text-graphite-faint">/</span>
          <span className="text-xs text-graphite-light">Algorithm Reference</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-graphite mb-1">
          Algorithm Reference
        </h1>
        <p className="text-sm text-graphite-med">
          Supported post-quantum cryptographic algorithms (NIST FIPS 203 / 204) and legacy migration paths
        </p>
      </div>

      <div className="space-y-6">

        {/* ML-DSA */}
        <div className="bg-white rounded-brand border border-graphite-ghost shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-graphite-ghost bg-bone flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-graphite">
                ML-DSA — Digital Signatures
              </h2>
              <p className="text-xs text-graphite-med">NIST FIPS 204 — Module-Lattice-Based Digital Signature Algorithm</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Quantum-Safe
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-graphite-ghost">
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Variant
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden sm:table-cell">
                  Security Level
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden md:table-cell">
                  Public Key
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden md:table-cell">
                  Signature
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Use Case
                </th>
              </tr>
            </thead>
            <tbody>
              {ML_DSA_VARIANTS.map((row) => (
                <tr
                  key={row.variant}
                  className="border-b border-graphite-ghost last:border-0 hover:bg-bone transition-colors"
                >
                  <td className="px-5 py-4">
                    <PqcBadge label={row.variant} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-graphite">{row.publicKey}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-graphite">{row.signature}</span>
                  </td>
                  <td className="px-5 py-4">
                    <RecommendedTag useCase={row.useCase} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ML-KEM */}
        <div className="bg-white rounded-brand border border-graphite-ghost shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-graphite-ghost bg-bone flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <Lock className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-graphite">
                ML-KEM — Key Encapsulation
              </h2>
              <p className="text-xs text-graphite-med">NIST FIPS 203 — Module-Lattice-Based Key-Encapsulation Mechanism</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Quantum-Safe
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-graphite-ghost">
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Variant
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden sm:table-cell">
                  Security Level
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden md:table-cell">
                  Public Key
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden md:table-cell">
                  Ciphertext
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Use Case
                </th>
              </tr>
            </thead>
            <tbody>
              {ML_KEM_VARIANTS.map((row) => (
                <tr
                  key={row.variant}
                  className="border-b border-graphite-ghost last:border-0 hover:bg-bone transition-colors"
                >
                  <td className="px-5 py-4">
                    <PqcBadge label={row.variant} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-graphite">{row.publicKey}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="font-mono text-xs text-graphite">{row.ciphertext}</span>
                  </td>
                  <td className="px-5 py-4">
                    <RecommendedTag useCase={row.useCase} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legacy */}
        <div className="bg-white rounded-brand border border-graphite-ghost shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-graphite-ghost bg-bone flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-graphite">
                Legacy Algorithms
              </h2>
              <p className="text-xs text-graphite-med">Quantum-vulnerable — schedule migration to PQC</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              Quantum-Vulnerable
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-graphite-ghost">
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Algorithm
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide hidden sm:table-cell">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Risk
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-graphite-light uppercase tracking-wide">
                  Migration Path
                </th>
              </tr>
            </thead>
            <tbody>
              {LEGACY_ALGORITHMS.map((row) => (
                <tr
                  key={row.algorithm}
                  className="border-b border-graphite-ghost last:border-0 hover:bg-bone transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      {row.algorithm}
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {row.status === 'Deprecated' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                        <XCircle className="h-3 w-3" />
                        Deprecated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        Acceptable
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        row.risk === 'HIGH'
                          ? 'text-red-700 bg-red-50'
                          : 'text-amber-700 bg-amber-50'
                      }`}
                    >
                      {row.risk}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-accent font-semibold">
                      {row.migrationPath}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info footer */}
        <div className="bg-accent-light border border-accent border-opacity-20 rounded-brand p-5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm text-graphite mb-1">
                NIST Post-Quantum Cryptography Standardisation
              </h3>
              <p className="text-xs text-graphite-med leading-relaxed">
                ML-DSA (FIPS 204) and ML-KEM (FIPS 203) were finalised by NIST in August 2024. These are
                module-lattice-based algorithms designed to resist attacks from both classical and quantum computers.
                All GRIDERA|Comply artifacts are signed with ML-DSA-65 and anchored to Hedera HCS.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
