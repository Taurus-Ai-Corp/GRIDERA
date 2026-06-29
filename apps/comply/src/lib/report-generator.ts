/**
 * EU AI Act Conformity Assessment Report Generator.
 *
 * Three modes:
 * - template: No LLM needed — fills a structured template from assessment data (Day 1 ready)
 * - cloud:    OpenAI-compatible API (set REPORT_AI_API_KEY + REPORT_AI_BASE_URL)
 * - sovereign: Customer's own Ollama/vLLM endpoint (same OpenAI-compatible format)
 */

import { euAssessmentSections } from './assessment-sections'
import type { AssessmentRecord } from './assessment-store'
import type { SystemRecord } from './systems-store'
import type { ScoringResult } from './assessment-scorer'

export interface ReportConfig {
  mode: 'template' | 'cloud' | 'sovereign'
  cloudApiKey?: string
  cloudBaseUrl?: string
  cloudModel?: string
  sovereignEndpoint?: string
  sovereignModel?: string
}

export interface ReportInput {
  system: SystemRecord
  assessment: AssessmentRecord
  scoringResult: ScoringResult
  jurisdiction: string
  reportId: string
}

// ─── Section title lookup ────────────────────────────────────────────────────

const SECTION_TITLES: Record<string, string> = Object.fromEntries(
  euAssessmentSections.map((s) => [s.id, s.title]),
)

// ─── Template report (no LLM) ───────────────────────────────────────────────

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function riskBadge(riskLevel: string): string {
  const labels: Record<string, string> = {
    minimal: 'Minimal Risk (Article 6 — No significant concerns)',
    limited: 'Limited Risk (Transparency obligations apply)',
    high: 'High Risk (Article 6 & Annex III — Conformity assessment mandatory)',
    unacceptable: 'Unacceptable Risk (Article 5 — Prohibited use)',
  }
  return labels[riskLevel] ?? capitalise(riskLevel)
}

function formatResponse(value: string | boolean | undefined): string {
  if (value === undefined || value === null || value === '') return '_Not provided_'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function statusFromScore(score: number): string {
  if (score >= 75) return 'Compliant'
  if (score >= 50) return 'Partial'
  return 'Non-Compliant'
}

function priorityDeadline(priority: string): string {
  if (priority === 'critical') return '30 days'
  if (priority === 'high') return '60 days'
  if (priority === 'medium') return '90 days'
  return '180 days'
}

export function generateTemplateReport(input: ReportInput): string {
  const { system, assessment, scoringResult, jurisdiction, reportId } = input
  const { score, riskLevel, categoryScores, recommendations, keyFindings } = scoringResult
  const responses = assessment.responses ?? {}

  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  // Category scores table rows
  const categoryRows = euAssessmentSections
    .map((sec) => {
      const s = categoryScores[sec.id] ?? 0
      return `| ${sec.title} | ${s}% | ${statusFromScore(s)} |`
    })
    .join('\n')

  // Key findings bullet points
  const findingsBullets =
    keyFindings.length > 0
      ? keyFindings.map((f) => `- ${f}`).join('\n')
      : '- No critical findings identified at this stage.'

  // Detailed section responses
  const sectionDetails = euAssessmentSections
    .map((sec, idx) => {
      const questionRows = sec.questions
        .map((q) => {
          const val = formatResponse(responses[q.id])
          return `**${q.label}**\n${val}`
        })
        .join('\n\n')
      return `### ${idx + 1 + 3}.${idx + 1} ${sec.title}\n\n${questionRows}`
    })
    .join('\n\n')

  // Recommendations
  const recsFormatted =
    recommendations.length > 0
      ? recommendations
          .map(
            (r, i) =>
              `${i + 1}. **[${capitalise(r.priority)}] ${r.title}** _(${r.category} — Complete within ${priorityDeadline(r.priority)})_\n   ${r.description}`,
          )
          .join('\n\n')
      : 'No immediate recommendations. Maintain current compliance posture and schedule annual review.'

  return `# EU AI Act Conformity Assessment Report

**Report ID:** ${reportId}
**Generated:** ${generatedDate}
**System:** ${system.name}
**Jurisdiction:** ${jurisdiction === 'eu' ? 'European Union' : capitalise(jurisdiction)}
**Framework:** EU AI Act (Regulation 2024/1689)

---

## 1. System Description

| Field | Details |
|-------|---------|
| **System Name** | ${system.name} |
| **Use Case** | ${system.useCase || '_Not provided_'} |
| **Industry** | ${system.industry || '_Not provided_'} |
| **Deployment Scope** | ${system.deploymentScope || '_Not provided_'} |
| **Autonomy Level** | ${system.autonomyLevel || '_Not provided_'} |
| **Registered Risk Level** | ${capitalise(system.riskLevel || 'Unknown')} |

${system.description ? `**Description:** ${system.description}` : ''}

---

## 2. Compliance Assessment Summary

**Overall Score:** ${score}/100
**Risk Classification:** ${riskBadge(riskLevel)}

### 2.1 Category Scores

| Category | Score | Status |
|----------|-------|--------|
${categoryRows}

---

## 3. Key Findings

${findingsBullets}

---

## 4. Detailed Assessment Responses

${sectionDetails}

---

## 5. Recommendations

The following actions are required to achieve full EU AI Act conformity. Items are listed by priority.

${recsFormatted}

---

## 6. Regulatory References

- **EU AI Act** (Regulation 2024/1689) — Entered into force August 2024
- **GDPR** (Regulation 2016/679) — Applicable to AI systems processing personal data
- **EU AI Act Annex III** — High-Risk AI System classifications
- **EU AI Act Annex IV** — Technical documentation requirements
- **EU AI Act Article 5** — Prohibited AI practices
- **EU AI Act Article 6** — Classification rules for high-risk systems
- **EU AI Act Article 10** — Data and data governance requirements
- **EU AI Act Article 11** — Technical documentation obligations
- **EU AI Act Article 14** — Human oversight requirements
- **EU AI Act Article 15** — Accuracy, robustness and cybersecurity
- **EU AI Act Article 50** — Transparency obligations for certain AI systems
- **EU AI Act Article 72** — Post-market monitoring by providers

---

## 7. Certification

| Field | Value |
|-------|-------|
| **Assessment ID** | ${assessment.id} |
| **Completed** | ${assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'In Progress'} |
| **Algorithm** | ML-DSA-65 (NIST FIPS 204) |
| **Hedera Anchor** | Pending |
| **Generated by** | GRIDERA|Comply — GRIDERA Compliance Platform |

---

_This report was generated by GRIDERA|Comply using post-quantum cryptographic signing (ML-DSA-65). The assessment results and recommendations are based on self-reported information and should be reviewed by qualified legal and technical compliance professionals before submission to regulatory authorities._
`
}

// ─── AI-enhanced report (cloud / sovereign) ─────────────────────────────────

async function callOpenAICompatible(
  messages: Array<{ role: string; content: string }>,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<string> {
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI API error ${res.status}: ${text}`)
  }

  type ChatResponse = {
    choices: Array<{ message: { content: string } }>
  }
  const data = (await res.json()) as ChatResponse
  return data.choices[0]?.message?.content ?? ''
}

function buildSystemPrompt(): string {
  return `You are an expert EU AI Act compliance consultant and legal writer. You write precise, professional conformity assessment reports for AI systems.

Your reports:
- Reference specific EU AI Act articles (Articles 5, 6, 10, 11, 14, 15, 50, 72)
- Are factual, clear and actionable
- Avoid vague language — every recommendation has a specific action and deadline
- Follow the exact structure provided — do not add or remove sections
- Are written in formal British English`
}

export function buildUserPrompt(input: ReportInput): string {
  const { system, assessment, scoringResult } = input
  const { score, riskLevel, categoryScores, recommendations, keyFindings } = scoringResult

  const catSummary = Object.entries(categoryScores)
    .map(([id, s]) => `${SECTION_TITLES[id] ?? id}: ${s}%`)
    .join(', ')

  const responseSummary = euAssessmentSections
    .flatMap((sec) =>
      sec.questions.map((q) => {
        const val = assessment.responses?.[q.id]
        return `[${sec.title}] ${q.label}: ${formatResponse(val)}`
      }),
    )
    .join('\n')

  return `Generate an EU AI Act Conformity Assessment Report for the following AI system.

SYSTEM DETAILS:
Name: ${system.name}
Use Case: ${system.useCase || 'Not specified'}
Industry: ${system.industry || 'Not specified'}
Deployment Scope: ${system.deploymentScope || 'Not specified'}
Autonomy Level: ${system.autonomyLevel || 'Not specified'}

ASSESSMENT SCORES:
Overall: ${score}/100
Risk Level: ${riskLevel}
Category Scores: ${catSummary}

ASSESSMENT RESPONSES:
${responseSummary}

AUTO-GENERATED KEY FINDINGS:
${keyFindings.join('\n')}

AUTO-GENERATED RECOMMENDATIONS:
${recommendations.map((r) => `[${r.priority.toUpperCase()}] ${r.title}: ${r.description}`).join('\n')}

Write ONLY the following three sections as markdown (no headers for other sections):

## 3. Key Findings

Write 4-6 specific, evidence-based findings from the assessment data above.

## 4. Analysis

Write a 3-paragraph executive analysis covering: (1) overall compliance posture, (2) critical gaps, (3) path to conformity.

## 5. Recommendations

Write 5-8 specific, actionable recommendations with EU AI Act article references and realistic deadlines.`
}

async function generateAIReport(
  input: ReportInput,
  baseUrl: string,
  apiKey: string,
  model: string,
): Promise<string> {
  // Get the template as the structural base
  const templateReport = generateTemplateReport(input)

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    { role: 'user', content: buildUserPrompt(input) },
  ]

  let aiContent: string
  try {
    aiContent = await callOpenAICompatible(messages, baseUrl, apiKey, model)
  } catch (err) {
    // Fall back to template if AI call fails
    console.error('[report-generator] AI API call failed, falling back to template:', err)
    return templateReport
  }

  // Replace sections 3, 4, 5 in the template with AI-generated content
  // The template uses ## 3. Key Findings, ## 4. Detailed..., ## 5. Recommendations
  let enhanced = templateReport

  // Try to splice in AI findings (section 3)
  const findingsMatch = aiContent.match(/## 3\. Key Findings([\s\S]*?)(?=## \d|$)/i)
  if (findingsMatch?.[1]) {
    enhanced = enhanced.replace(
      /## 3\. Key Findings[\s\S]*?(?=---)/,
      `## 3. Key Findings\n\n${findingsMatch[1].trim()}\n\n---\n\n`,
    )
  }

  // Try to splice in AI recommendations (section 5)
  const recsMatch = aiContent.match(/## 5\. Recommendations([\s\S]*?)(?=## \d|$)/i)
  if (recsMatch?.[1]) {
    enhanced = enhanced.replace(
      /## 5\. Recommendations[\s\S]*?(?=---)/,
      `## 5. Recommendations\n\n${recsMatch[1].trim()}\n\n---\n\n`,
    )
  }

  // If AI provided an analysis section, insert after section 3
  const analysisMatch = aiContent.match(/## 4\. Analysis([\s\S]*?)(?=## \d|$)/i)
  if (analysisMatch?.[1]) {
    enhanced = enhanced.replace(
      /## 4\. Detailed Assessment Responses/,
      `## 4. Executive Analysis\n\n${analysisMatch[1].trim()}\n\n---\n\n## 4.1 Detailed Assessment Responses`,
    )
  }

  return enhanced
}

// ─── Main entry point ────────────────────────────────────────────────────────

export async function generateReport(input: ReportInput, config: ReportConfig): Promise<string> {
  const hasCloudKey = Boolean(config.cloudApiKey)
  const hasSovereignEndpoint = Boolean(config.sovereignEndpoint)

  // Fall through to template if no AI credentials available
  if (config.mode === 'template' || (!hasCloudKey && !hasSovereignEndpoint)) {
    return generateTemplateReport(input)
  }

  if (config.mode === 'sovereign' && config.sovereignEndpoint) {
    return generateAIReport(
      input,
      config.sovereignEndpoint,
      config.sovereignEndpoint, // Ollama doesn't need a real API key — pass endpoint as placeholder
      config.sovereignModel ?? 'mistral:7b',
    )
  }

  // Cloud mode
  const baseUrl = config.cloudBaseUrl ?? 'https://api.openai.com'
  return generateAIReport(input, baseUrl, config.cloudApiKey!, config.cloudModel ?? 'gpt-4o-mini')
}
