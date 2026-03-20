/** One Q&A pair collected during the interview */
export interface QAPair {
  question: string;
  answer: string;
}

/** Structured career analysis returned by Groq */
export interface CareerAnalysis {
  currentRole: string;
  /** 1–10 seniority estimate */
  currentLevel: number;
  targetRole: string;
  summary: string;
  skills: string[];
  gaps: GapItem[];
  milestones: Milestone[];
}

export interface GapItem {
  title: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  description: string;
  /** 1–10 */
  currentLevel: number;
  /** 1–10 */
  requiredLevel: number;
}

export interface Milestone {
  title: string;
  whatToLearn: string;
  estimatedTime: string;
  resources: { title: string; url: string }[];
}
