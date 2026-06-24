import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'
import {
  compareRiskFrameworks,
  scoreCustomerRisk,
  scoreTransactionRisk,
  type CustomerRiskInput,
  type TransactionRiskInput,
} from '@/lib/risk-scoring-comparison'

/**
 * GET /api/risk-comparison
 * Returns the static QRS vs RegTech framework comparison.
 */
export async function GET() {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const comparison = compareRiskFrameworks()
    return NextResponse.json({ comparison })
  } catch (error) {
    console.error('[risk-comparison/GET] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/risk-comparison
 * Score a customer or transaction risk.
 *
 * Body: { type: 'customer' | 'transaction', input: CustomerRiskInput | TransactionRiskInput }
 */
export async function POST(req: Request) {
  try {
    const authUser = await getCurrentUser()
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

    const { type, input } = body as { type?: string; input?: unknown }

    if (!type || !input || (type !== 'customer' && type !== 'transaction')) {
      return NextResponse.json(
        { error: 'Invalid request. Provide { type: "customer" | "transaction", input: {...} }' },
        { status: 400 },
      )
    }

    if (type === 'customer') {
      const ci = input as Record<string, unknown>
      const VALID_JURISDICTION = ['low', 'medium', 'high', 'critical']
      const VALID_INDUSTRY = ['low', 'medium', 'high']
      const VALID_PATTERN = ['normal', 'suspicious', 'structured']
      if (
        !VALID_JURISDICTION.includes(ci['jurisdictionRisk'] as string) ||
        typeof ci['pepStatus'] !== 'boolean' ||
        !VALID_INDUSTRY.includes(ci['industryRisk'] as string) ||
        typeof ci['adverseMedia'] !== 'boolean' ||
        !VALID_PATTERN.includes(ci['transactionPattern'] as string) ||
        typeof ci['accountAgeDays'] !== 'number'
      ) {
        return NextResponse.json({ error: 'Invalid customer risk input' }, { status: 400 })
      }
      const result = scoreCustomerRisk(input as CustomerRiskInput)
      return NextResponse.json({ type: 'customer', result })
    }

    const ti = input as Record<string, unknown>
    const VALID_COUNTERPARTY = ['low', 'medium', 'high']
    if (
      typeof ti['amountUsd'] !== 'number' ||
      typeof ti['averageAmountUsd'] !== 'number' ||
      typeof ti['txCountLast24h'] !== 'number' ||
      typeof ti['averageTxCountDaily'] !== 'number' ||
      typeof ti['originCountry'] !== 'string' ||
      typeof ti['destinationCountry'] !== 'string' ||
      !VALID_COUNTERPARTY.includes(ti['counterpartyRisk'] as string) ||
      typeof ti['isOffHours'] !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid transaction risk input' }, { status: 400 })
    }
    const result = scoreTransactionRisk(input as TransactionRiskInput)
    return NextResponse.json({ type: 'transaction', result })
  } catch (error) {
    console.error('[risk-comparison/POST] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}