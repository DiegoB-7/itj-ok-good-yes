import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface SkillEntry    { name: string; scale: string; value: number }
interface KnowledgeEntry{ name: string; value: number }
interface TechSkill     { name: string; category: string }

export interface OnetOccupation {
  soc_code:         string;
  title:            string;
  description:      string;
  skills:           SkillEntry[];
  knowledge:        KnowledgeEntry[];
  technology_skills:TechSkill[];
  tasks:            string[];
  emerging_tasks:   string[];
}

// ── Load once at module init ──────────────────────────────────────────────────

let _dataset: OnetOccupation[] | null = null;

function getDataset(): OnetOccupation[] {
  if (_dataset) return _dataset;
  const filePath = resolve('src/lib/server/onet_rag_dataset_min.json');
  _dataset = JSON.parse(readFileSync(filePath, 'utf-8')) as OnetOccupation[];
  return _dataset;
}

// ── Search ────────────────────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
  );
}

function scoreOccupation(occ: OnetOccupation, queryTokens: Set<string>): number {
  let score = 0;

  const titleTokens = tokenize(occ.title);
  const descTokens  = tokenize(occ.description);
  const techTokens  = new Set(
    occ.technology_skills.flatMap((t) => [...tokenize(t.name), ...tokenize(t.category)])
  );
  const taskTokens  = new Set(occ.tasks.flatMap((t) => [...tokenize(t)]));

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 6;   // title match is strongest signal
    if (descTokens.has(token))  score += 2;
    if (techTokens.has(token))  score += 3;
    if (taskTokens.has(token))  score += 1;
  }

  return score;
}

/** Return the top N occupations most relevant to the query string */
export function searchOnet(query: string, topN = 3): OnetOccupation[] {
  const dataset     = getDataset();
  const queryTokens = tokenize(query);

  if (queryTokens.size === 0) return [];

  return dataset
    .map((occ) => ({ occ, score: scoreOccupation(occ, queryTokens) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ occ }) => occ);
}

// ── Prompt formatter ──────────────────────────────────────────────────────────

/**
 * Compress an occupation into a compact text block for the LLM prompt.
 * Keeps it to ~600 chars so injecting 2-3 occupations stays well within limits.
 */
export function formatForPrompt(occ: OnetOccupation): string {
  // Deduplicate skills by name, keep only IM (importance) scale, sort descending
  const skillMap = new Map<string, number>();
  for (const s of occ.skills) {
    if (s.scale === 'IM') skillMap.set(s.name, s.value);
  }
  const topSkills = [...skillMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  // Deduplicate knowledge, sort descending
  const knowledgeMap = new Map<string, number>();
  for (const k of occ.knowledge) {
    knowledgeMap.set(k.name, Math.max(knowledgeMap.get(k.name) ?? 0, k.value));
  }
  const topKnowledge = [...knowledgeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  const topTech = [...new Set(occ.technology_skills.map((t) => t.name))].slice(0, 6);
  const topTasks = occ.tasks.slice(0, 3);

  return [
    `OCCUPATION: ${occ.title} (${occ.soc_code})`,
    `DESCRIPTION: ${occ.description.slice(0, 200)}`,
    `TOP SKILLS: ${topSkills.join(', ')}`,
    `KEY KNOWLEDGE: ${topKnowledge.join(', ')}`,
    `TOOLS & TECH: ${topTech.join(', ')}`,
    `CORE TASKS:\n${topTasks.map((t) => `  - ${t}`).join('\n')}`,
  ].join('\n');
}