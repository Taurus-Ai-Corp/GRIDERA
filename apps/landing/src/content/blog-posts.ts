export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string
  readingTime: string
  author: string
  authorRole: string
  tags: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'quantum-threat-blockchain',
    title: 'The Quantum Threat to Blockchain Infrastructure: Three Deadlines Nobody\u2019s Ready For',
    excerpt:
      'NIST finalized PQC standards in August 2024. The EU AI Act enforces in August 2026. SWIFT mandates quantum-resistant messaging by 2027. The migration window isn\u2019t a decade\u200a\u2014\u200ait\u2019s months. Here\u2019s what nobody is telling you.',
    date: '2026-03-25',
    readingTime: '9 min read',
    author: 'Effin Fernandez',
    authorRole: 'Founder, GRIDERA|Comply',
    tags: ['PQC', 'Blockchain', 'NIST', 'SWIFT 2027', 'EU AI Act'],
  },
]
