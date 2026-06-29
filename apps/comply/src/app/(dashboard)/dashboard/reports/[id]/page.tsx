'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, Printer, Link2, Check } from 'lucide-react'
import type { Report } from '@/lib/report-store'

// ─── Markdown renderer (safe — all user content is HTML-escaped before tagging)
// Handles: headings, bold/italic/code inline, tables, lists, hr, paragraphs.
// XSS safe because escapeHtml() runs on every text node before we wrap in tags.
//
// Trust model: report.content comes from our own template generator (fully trusted)
// OR an AI model via cloud/sovereign mode (semi-trusted). Either way, all text nodes
// pass through escapeHtml() before being inserted into HTML tags, so injected
// payloads like <script> or javascript: URLs are neutralised at the text level.
// The markdown parser never emits raw <a href> or <img src> tags — only the safe
// inline elements: <strong>, <em>, <code>. OWASP XSS vectors covered: &, <, >, ",
// ', / — per https://cheatsheetseries.owasp.org/cheatsheets/XSS_Filter_Evasion_Cheat_Sheet.html

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;')
}

function renderInline(raw: string): string {
  // Escape first, then apply safe inline tags
  const s = escapeHtml(raw)
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inTable = false
  let tableHasBody = false
  let inList = false
  let i = 0

  function closeTable() {
    if (inTable) {
      if (tableHasBody) out.push('</tbody>')
      out.push('</table>')
      inTable = false
      tableHasBody = false
    }
  }
  function closeList() {
    if (inList) { out.push('</ul>'); inList = false }
  }

  while (i < lines.length) {
    const line = lines[i]!

    // Heading (H1–H6)
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      closeTable(); closeList()
      const level = headingMatch[1]!.length
      out.push(`<h${level}>${renderInline(headingMatch[2]!)}</h${level}>`)
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeTable(); closeList()
      out.push('<hr />')
      i++; continue
    }

    // Table row
    if (line.startsWith('|')) {
      closeList()
      const cells = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      const isSeparator = cells.every((c) => /^[\s\-:]+$/.test(c))
      if (isSeparator) {
        // Transition from thead to tbody
        if (inTable && !tableHasBody) {
          out.push('</thead><tbody>')
          tableHasBody = true
        }
      } else if (!inTable) {
        out.push('<table><thead><tr>')
        cells.forEach((c) => out.push(`<th>${renderInline(c.trim())}</th>`))
        out.push('</tr>')
        inTable = true
      } else {
        out.push('<tr>')
        cells.forEach((c) => out.push(`<td>${renderInline(c.trim())}</td>`))
        out.push('</tr>')
      }
      i++; continue
    }

    closeTable()

    // Unordered list item
    if (/^[-*]\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true }
      const content = line.replace(/^[-*]\s+/, '')
      out.push(`<li>${renderInline(content)}</li>`)
      i++; continue
    }

    closeList()

    // Numbered list item → styled paragraph
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/)
    if (numMatch) {
      out.push(`<p class="rec-item">${renderInline(numMatch[2]!)}</p>`)
      i++; continue
    }

    // Blank line → spacer
    if (line.trim() === '') {
      out.push('<div class="md-spacer"></div>')
      i++; continue
    }

    // Normal paragraph
    out.push(`<p>${renderInline(line)}</p>`)
    i++
  }

  closeTable(); closeList()
  return out.join('\n')
}

// ─── PQC Badge ────────────────────────────────────────────────────────────────

function PqcBadge({ report }: { report: Report }) {
  const signed = Boolean(report.pqcHash)

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 print:mt-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div
          className={`inline-flex items-center gap-2 px-3 py-2 rounded border text-xs font-semibold shrink-0 ${
            signed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          {signed ? 'ML-DSA-65 Signed \u2713' : 'Unsigned (dev mode)'}
        </div>

        {signed && (
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium shrink-0">Hash:</span>
              <code className="font-mono break-all text-gray-700">{report.pqcHash}</code>
            </div>
            {report.pqcSignature && (
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span className="font-medium shrink-0 pt-px">Sig:</span>
                <code className="font-mono break-all text-gray-700 line-clamp-2">
                  {report.pqcSignature.slice(0, 80)}&hellip;
                </code>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span>Hedera Anchor:</span>
        <span className={report.hederaTxId ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
          {report.hederaTxId ?? 'Pending (Phase 3E)'}
        </span>
      </div>

      <p className="mt-3 text-xs text-gray-400 leading-relaxed">
        Algorithm: ML-DSA-65 (NIST FIPS 204) &middot; Generated by GRIDERA|Comply &middot; GRIDERA Compliance Platform
      </p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReportViewerPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Report not found')
        return r.json() as Promise<Report>
      })
      .then(setReport)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [id])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleCopyLink = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-graphite-light">
        Loading report&hellip;
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-brand p-6 text-sm text-red-700 max-w-lg">
        {error ?? 'Report not found'}
      </div>
    )
  }

  // All text in the markdown was HTML-escaped before tagging in markdownToHtml()
  const htmlContent = markdownToHtml(report.content)

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #report-print-root { display: block !important; }
          @page { margin: 20mm; }
          .no-print { display: none !important; }
          .report-doc {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            max-width: none !important;
          }
        }
        .md-spacer { height: 0.5rem; }
        .report-prose h1 { font-size: 1.375rem; font-weight: 700; margin: 0 0 0.5rem; color: #111827; }
        .report-prose h2 { font-size: 1.0625rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #111827; padding-bottom: 0.375rem; border-bottom: 1px solid #e5e7eb; }
        .report-prose h3 { font-size: 0.9375rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #1f2937; }
        .report-prose h4 { font-size: 0.875rem; font-weight: 600; margin: 1rem 0 0.25rem; color: #374151; }
        .report-prose p { font-size: 0.875rem; line-height: 1.7; color: #374151; margin: 0 0 0.5rem; }
        .report-prose p.rec-item { font-size: 0.875rem; line-height: 1.7; color: #374151; margin: 0 0 0.875rem; padding-left: 1rem; border-left: 3px solid #d1d5db; }
        .report-prose ul { margin: 0.5rem 0 1rem; padding-left: 1.25rem; list-style: disc; }
        .report-prose li { font-size: 0.875rem; color: #374151; margin-bottom: 0.375rem; line-height: 1.6; }
        .report-prose strong { font-weight: 600; color: #111827; }
        .report-prose em { font-style: italic; color: #4b5563; }
        .report-prose code { font-family: 'IBM Plex Mono', monospace; font-size: 0.8125rem; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 3px; color: #111827; }
        .report-prose hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5rem 0; }
        .report-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.8125rem; }
        .report-prose th { text-align: left; padding: 0.5rem 0.75rem; background: #f9fafb; border: 1px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .report-prose td { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; color: #374151; vertical-align: top; }
        .report-prose tbody tr:nth-child(even) td { background: #f9fafb; }
      `}</style>

      <div id="report-print-root">
        {/* Toolbar */}
        <div className="no-print flex items-center justify-between mb-6">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-1.5 text-sm text-graphite-med hover:text-graphite transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium text-graphite bg-white border border-graphite-ghost rounded-brand hover:bg-bone transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  Copied
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 h-9 px-4 text-sm font-semibold text-white bg-accent rounded-brand hover:bg-accent-dark transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Report document */}
        <div className="report-doc bg-white rounded-brand border border-graphite-ghost shadow-sm p-8 max-w-[800px] mx-auto">

          {/* Document header */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
            <div>
              <div className="text-xs font-semibold text-accent tracking-widest uppercase mb-1">
                GRIDERA|Comply
              </div>
              <div className="font-mono text-xs text-gray-400 mt-1">
                Report ID: {report.id}
              </div>
              <div className="font-mono text-xs text-gray-400 mt-0.5">
                Generated:{' '}
                {new Date(report.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-gray-500">Mode</div>
              <div className="text-xs font-semibold text-graphite capitalize mt-0.5">
                {report.mode === 'template'
                  ? 'Template'
                  : report.mode === 'sovereign'
                  ? 'AI Sovereign'
                  : 'AI Cloud'}
              </div>
              {report.model && (
                <div className="font-mono text-xs text-gray-400 mt-0.5">{report.model}</div>
              )}
            </div>
          </div>

          {/* Markdown content — safe: all text nodes HTML-escaped before tagging */}
          <div
            className="report-prose"
            /* eslint-disable-next-line react/no-danger */
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* PQC Badge */}
          <PqcBadge report={report} />
        </div>
      </div>
    </>
  )
}
