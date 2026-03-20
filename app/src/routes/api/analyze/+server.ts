import Groq from 'groq-sdk';
import { json, error } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';
import type { QAPair, CareerAnalysis } from '$lib/interfaces/types.interface';
import { searchOnet, formatForPrompt } from '$lib/server/onet';

// ── Build O*NET context block from the user's answers ────────────────────────

function buildOnetContext(answers: QAPair[]): string {
  const fullText = answers.map((qa) => `${qa.question} ${qa.answer}`).join(' ');

  // Search once for current role context, once for target role context
  const currentMatches = searchOnet(fullText, 2);
  const targetAnswer   = answers.find((qa) =>
    qa.question.toLowerCase().includes('dream') ||
    qa.question.toLowerCase().includes('see yourself')
  );
  const targetMatches  = targetAnswer
    ? searchOnet(targetAnswer.answer, 2)
    : [];

  // Merge, deduplicate by soc_code
  const seen = new Set<string>();
  const merged = [...currentMatches, ...targetMatches].filter(({ soc_code }) => {
    if (seen.has(soc_code)) return false;
    seen.add(soc_code);
    return true;
  });

  if (merged.length === 0) return '';

  return [
    '=== O*NET OCCUPATION DATA (use this as ground truth for skills and gaps) ===',
    ...merged.map(formatForPrompt),
    '=== END O*NET DATA ===',
  ].join('\n\n');
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(onetContext: string): string {
  return `You are LevelUp, an expert AI career coach with access to real O*NET occupational data.

${onetContext ? onetContext + '\n\n' : ''}Use the O*NET data above as your primary source of truth when identifying skill gaps and required competencies. Cross-reference what the user said in their interview against the actual skill requirements for their target occupation.

Return a single JSON object — no markdown, no prose, no code fences — matching this exact TypeScript type:

{
  currentRole: string;
  currentLevel: number;        // 1–10 seniority estimate
  targetRole: string;
  summary: string;             // 2–3 sentence personalised diagnosis grounded in O*NET data
  skills: string[];            // up to 5 strong skills they already have
  gaps: Array<{
    title: string;
    severity: "critical" | "important" | "nice-to-have";
    description: string;       // reference specific O*NET skill/knowledge requirements
    currentLevel: number;      // 1–10
    requiredLevel: number;     // 1–10, grounded in O*NET importance scores
  }>;                          // 3–5 gaps, most critical first
  milestones: Array<{
    title: string;
    whatToLearn: string;       // tie back to specific O*NET skills or knowledge areas
    estimatedTime: string;
    resources: Array<{ title: string; url: string }>;
  }>;                          // 3–4 ordered milestones
}

Rules:
- Ground skill gap levels in the O*NET importance scores (IM scale 0–7 → remap to 1–10).
- Be specific to what the person actually said, not generic.
- Use real working URLs for resources.
- Do not include any text outside the JSON object.`;
}

// ── Request handler ───────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
  let body: { answers: QAPair[] };
  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const { answers } = body;
  if (!Array.isArray(answers) || answers.length === 0) {
    throw error(400, 'answers array is required');
  }

  const onetContext  = buildOnetContext(answers);
  const systemPrompt = buildSystemPrompt(onetContext);

  const interviewTranscript = answers
    .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`)
    .join('\n\n');

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  let rawContent: string;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: `Here is my career interview:\n\n${interviewTranscript}` },
      ],
    });
    rawContent = completion.choices[0]?.message?.content ?? '';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Groq API error';
    throw error(502, `Groq request failed: ${msg}`);
  }

  let analysis: CareerAnalysis;
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    analysis = JSON.parse(cleaned);
  } catch {
    console.error('Groq raw response (unparseable):', rawContent);
    throw error(502, 'Groq returned invalid JSON. Try again.');
  }

  return json(analysis);
};