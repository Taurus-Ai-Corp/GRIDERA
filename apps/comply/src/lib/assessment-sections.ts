/**
 * EU AI Act conformity assessment — 6 sections, 22 questions
 */

export interface AssessmentQuestion {
  id: string
  label: string
  type: 'text' | 'boolean' | 'select'
  options?: string[]
  helpText?: string
  weight?: number                        // 1-3, default 1
  riskIndicator?: 'high' | 'medium' | 'low'
}

export interface AssessmentSection {
  id: string
  title: string
  description: string
  icon: string // Lucide icon name
  questions: AssessmentQuestion[]
}

export const euAssessmentSections: AssessmentSection[] = [
  {
    id: 'system-info',
    title: 'System Information',
    description: 'Basic details about the AI system and its intended purpose.',
    icon: 'Info',
    questions: [
      {
        id: 'intended_use',
        label: 'What is the intended use of this AI system?',
        type: 'text',
        helpText: 'Describe the primary function and purpose',
        weight: 2,
      },
      {
        id: 'deployment_scope',
        label: 'Describe the deployment scope (users, regions, scale).',
        type: 'text',
        weight: 1,
      },
      {
        id: 'autonomous_decisions',
        label: 'Does the system make autonomous decisions?',
        type: 'boolean',
        helpText: 'Decisions without human review',
        weight: 3,
        riskIndicator: 'high',
      },
    ],
  },
  {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    description: 'Evaluate potential risks and impacts of the AI system.',
    icon: 'AlertTriangle',
    questions: [
      {
        id: 'fundamental_rights',
        label: 'Could this system impact fundamental rights?',
        type: 'boolean',
        helpText: 'Privacy, discrimination, freedom of expression',
        weight: 3,
        riskIndicator: 'high',
      },
      {
        id: 'safety_risks',
        label: 'Describe any safety risks associated with this system.',
        type: 'text',
        weight: 3,
        riskIndicator: 'high',
      },
      {
        id: 'bias_assessment',
        label: 'How has bias been assessed and mitigated?',
        type: 'text',
        weight: 2,
        riskIndicator: 'medium',
      },
      {
        id: 'biometric_processing',
        label: 'Does the system use biometric identification or categorization?',
        type: 'select',
        // Options ordered worst -> best: scoreSelect rewards later indices.
        options: [
          'Real-time biometric identification',
          'Post-processing biometric identification',
          'Biometric categorization only',
          'No biometric processing',
        ],
        helpText: 'Real-time remote biometric identification is a prohibited/high-risk practice under EU AI Act Article 5',
        weight: 3,
        riskIndicator: 'high',
      },
      {
        id: 'individual_scoring',
        label: 'Is the system used to score or evaluate individuals?',
        type: 'select',
        options: [
          'Social or behavioral scoring',
          'Creditworthiness scoring',
          'Other individual evaluations',
          'No scoring of individuals',
        ],
        helpText: 'Social/behavioral scoring of individuals is prohibited under EU AI Act Article 5',
        weight: 3,
        riskIndicator: 'high',
      },
    ],
  },
  {
    id: 'data-governance',
    title: 'Data Governance',
    description: 'Data practices, quality measures, and privacy safeguards.',
    icon: 'Database',
    questions: [
      {
        id: 'training_data',
        label: 'Describe the training data used.',
        type: 'text',
        weight: 2,
      },
      {
        id: 'data_quality',
        label: 'What data quality measures are in place?',
        type: 'text',
        weight: 2,
      },
      {
        id: 'gdpr_compliant',
        label: 'Is personal data processing GDPR compliant?',
        type: 'boolean',
        weight: 3,
      },
    ],
  },
  {
    id: 'transparency',
    title: 'Transparency & Explainability',
    description: "How the system's decisions are communicated and explained.",
    icon: 'Eye',
    questions: [
      {
        id: 'user_notification',
        label: 'How are users notified they are interacting with AI?',
        type: 'text',
        weight: 2,
        riskIndicator: 'medium',
      },
      {
        id: 'explainability',
        label: "Describe the system's explainability capabilities.",
        type: 'text',
        weight: 2,
      },
      {
        id: 'documentation',
        label: 'Is comprehensive technical documentation available?',
        type: 'boolean',
        weight: 2,
      },
    ],
  },
  {
    id: 'human-oversight',
    title: 'Human Oversight',
    description: 'Human-in-the-loop controls and override capabilities.',
    icon: 'Users',
    questions: [
      {
        id: 'oversight_measures',
        label: 'What human oversight measures are implemented?',
        type: 'text',
        weight: 2,
      },
      {
        id: 'override_capability',
        label: 'Can human operators override system decisions?',
        type: 'boolean',
        weight: 3,
      },
      {
        id: 'monitoring',
        label: 'Describe ongoing monitoring and performance tracking.',
        type: 'text',
        weight: 2,
      },
      {
        id: 'emergency_stop',
        label: 'Can the system be stopped or disabled in an emergency?',
        type: 'select',
        options: [
          'No emergency stop mechanism',
          'Stop only with prior authorization',
          'Stop with minimal delay',
          'Immediate kill switch available',
        ],
        helpText: 'High-risk systems must let operators intervene or halt operation (EU AI Act Article 14)',
        weight: 2,
        riskIndicator: 'high',
      },
    ],
  },
  {
    id: 'security',
    title: 'Robustness & Security',
    description: 'System resilience, security measures, and accuracy standards.',
    icon: 'Shield',
    questions: [
      {
        id: 'accuracy_metrics',
        label: 'What accuracy metrics and benchmarks are used?',
        type: 'text',
        weight: 2,
      },
      {
        id: 'security_measures',
        label: 'Describe cybersecurity measures in place.',
        type: 'text',
        weight: 2,
      },
      {
        id: 'adversarial_testing',
        label: 'Has adversarial testing been conducted?',
        type: 'boolean',
        weight: 2,
      },
      {
        id: 'conformity_assessment',
        label: 'Has a conformity assessment been conducted for this system?',
        type: 'select',
        options: [
          'Not yet conducted',
          'In progress',
          'Self-assessment completed',
          'Third-party assessment completed',
        ],
        helpText: 'High-risk AI systems require a conformity assessment before market placement (EU AI Act Article 43)',
        weight: 3,
        riskIndicator: 'high',
      },
    ],
  },
]
