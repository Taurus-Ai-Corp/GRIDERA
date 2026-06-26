'use client'

import { useState, useCallback } from 'react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Option {
  label: string
  value: number
}

interface Question {
  id: number
  text: string
  options: Option[]
}

type RiskLevel = 'HIGH' | 'LIMITED' | 'MINIMAL'

interface RiskResult {
  level: RiskLevel
  article: string
  color: string
  borderColor: string
  description: string
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const questions: Question[] = [
  {
    id: 1,
    text: 'What is the primary use case of your AI system?',
    options: [
      { label: 'Critical Infrastructure (Water, Gas, Electricity)', value: 10 },
      { label: 'Employment, HR, or Recruitment', value: 10 },
      { label: 'Financial services (Credit scoring, insurance)', value: 10 },
      { label: 'General purpose (Chatbots, simple automation)', value: 2 },
    ],
  },
  {
    id: 2,
    text: 'Does your system make decisions about people?',
    options: [
      { label: 'Yes, automated decision-making', value: 15 },
      { label: 'Human-in-the-loop only', value: 8 },
      { label: 'No, purely backend / technical optimization', value: 2 },
    ],
  },
  {
    id: 3,
    text: 'Are you processing biometric or health data?',
    options: [
      { label: 'Yes, for identification or sensitive use', value: 20 },
      { label: 'No, but we handle personal data (GDPR scope)', value: 5 },
      { label: 'None of the above', value: 0 },
    ],
  },
  {
    id: 4,
    text: 'Do you have a blockchain-anchored audit trail?',
    options: [
      { label: 'Yes, fully immutable via HCS', value: 0 },
      { label: 'No, we use traditional log files', value: 15 },
      { label: 'We have no formal audit trail yet', value: 25 },
    ],
  },
]

function classifyRisk(score: number): RiskResult {
  if (score > 40) {
    return {
      level: 'HIGH',
      article: 'Article 6',
      color: '#FF4444',
      borderColor: '#FF4444',
      description:
        'Your system likely falls under the High-Risk category. Full technical documentation and a quality management system required by August 2026.',
    }
  }
  if (score > 15) {
    return {
      level: 'LIMITED',
      article: 'Article 52',
      color: '#FFAA00',
      borderColor: '#FFAA00',
      description:
        'Your system has transparency requirements. You must inform users they are interacting with an AI system.',
    }
  }
  return {
    level: 'MINIMAL',
    article: '',
    color: '#00CCAA',
    borderColor: '#00CCAA',
    description:
      'Your system falls into the low-risk category, but voluntary codes of conduct are recommended.',
  }
}

/* ------------------------------------------------------------------ */
/*  Embed Component — transparent bg, no nav chrome                    */
/* ------------------------------------------------------------------ */

export default function EmbedAssessPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const handleSelect = useCallback(
    (value: number) => {
      setSelectedOption(value)

      setTimeout(() => {
        const newScore = score + value
        setScore(newScore)
        setSelectedOption(null)

        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion((prev) => prev + 1)
        } else {
          setFinished(true)
        }
      }, 300)
    },
    [score, currentQuestion],
  )

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0)
    setScore(0)
    setFinished(false)
    setSelectedOption(null)
  }, [])

  const result = finished ? classifyRisk(score) : null
  const q = questions[currentQuestion]
  const progress = finished
    ? 100
    : ((currentQuestion) / questions.length) * 100

  return (
    <div
      style={{
        background: 'transparent',
        color: '#E8E6DE',
        fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#00CCAA',
            marginBottom: '8px',
          }}
        >
          EU AI Act Compliance
        </div>
        <h1
          style={{
            fontFamily: "'Jura', sans-serif",
            fontSize: '22px',
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 6px 0',
            color: '#E8E6DE',
          }}
        >
          Risk Classification Assessment
        </h1>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
          4 questions. 2 minutes. Determine your risk level.
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            height: '2px',
            width: '100%',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00CCAA, #4AABA8)',
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>
      </div>

      {/* Quiz */}
      {!finished && q && (
        <div key={q.id}>
          <h2
            style={{
              fontFamily: "'Jura', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: '#E8E6DE',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
                color: '#00CCAA',
                marginRight: '8px',
              }}
            >
              Q{q.id}
            </span>
            {q.text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.options.map((opt) => {
              const isSelected = selectedOption === opt.value
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    textAlign: 'left',
                    padding: '14px 18px',
                    background: isSelected
                      ? 'rgba(0, 204, 170, 0.1)'
                      : 'rgba(255,255,255,0.03)',
                    border: isSelected
                      ? '1px solid #00CCAA'
                      : '1px solid rgba(255,255,255,0.08)',
                    color: '#E8E6DE',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontSize: '13px',
                    lineHeight: 1.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: 0,
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Results */}
      {finished && result && (
        <div style={{ textAlign: 'center' }}>
          {/* Score circle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '50%',
                border: `5px solid ${result.borderColor}`,
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: "'Jura', sans-serif",
                  fontSize: '44px',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: result.color,
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                  color: '#9CA3AF',
                  marginTop: '4px',
                }}
              >
                Risk Score
              </span>
            </div>
          </div>

          {/* Risk level */}
          <h2
            style={{
              fontFamily: "'Jura', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: result.color,
              margin: '0 0 4px 0',
            }}
          >
            {result.level} RISK
            {result.article && (
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '12px',
                  fontWeight: 400,
                  color: '#9CA3AF',
                  marginLeft: '8px',
                }}
              >
                ({result.article})
              </span>
            )}
          </h2>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#9CA3AF',
              maxWidth: '420px',
              margin: '10px auto 24px',
            }}
          >
            {result.description}
          </p>

          {/* CTA — opens in parent window, not iframe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <a
              href="https://q-grid.net/scan"
              target="_parent"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #00CCAA, #4AABA8)',
                color: '#0B0E14',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Get Your Full CBOM Report
              <span aria-hidden="true">&rarr;</span>
            </a>

            <button
              type="button"
              onClick={handleRestart}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                fontWeight: 400,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#9CA3AF',
                padding: '10px 0',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'none',
                cursor: 'pointer',
              }}
            >
              Retake Assessment
            </button>
          </div>

          {/* Powered by */}
          <div
            style={{
              marginTop: '24px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.25)',
            }}
          >
            Powered by{' '}
            <a
              href="https://q-grid.net"
              target="_parent"
              rel="noopener noreferrer"
              style={{ color: '#00CCAA', textDecoration: 'none' }}
            >
              GRIDERA|Comply
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
