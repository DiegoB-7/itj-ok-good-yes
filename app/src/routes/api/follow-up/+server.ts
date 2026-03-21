import Groq from 'groq-sdk';
import { json, error } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';
import type { QAPair } from '$lib/interfaces/types.interface';

interface FollowUpRequest {
  question: string;
  answer: string;
  previousQA: QAPair[]; // all Q&A so far to avoid redundancy
}

interface FollowUpResponse {
  shouldAsk: boolean;
  confidence: number; // 0-1
  followUpQuestion: string; // single question (sequential calls for follow-ups)
}

function buildSystemPrompt(): string {
  return `You are an expert career coach. Analyze answers and decide if a follow-up question adds value. Use conversation history to avoid redundancy.

Respond with JSON ONLY:
{
  "shouldAsk": boolean,
  "confidence": number (0.0-1.0),
  "followUpQuestion": string (single question or empty)
}

Rules:
1. Follow-up valuable if answer is vague/brief AND reveals specific technical/career details not covered elsewhere.

2. If the answer is empty, one word, or clearly evasive (e.g. "I don't know", "nothing", "skip"), set shouldAsk=true, confidence=1.0 and gently probe: ask if there's a reason they'd rather not share. Keep it empathetic, not pushy.

3. Confidence: 1.0=clear need or empty answer, 0.7-0.9=moderate opportunity, <0.75=no follow-up.

4. Generate ONE question (80-120 chars): natural, specific, conversational. CRITICAL: No compound questions with "and".

5. Style: GOOD - "Can you tell me more about the technologies you've worked with?", "Is there a specific reason you'd rather not discuss your current role?", "Is it perhaps due to confidentiality or NDAs?"
   BAD - "Which role?", "Can you elaborate on X and how you've addressed Y?"

Example (normal):
Q: "Tell me about your current role"
A: "I'm a frontend dev"
→ {"shouldAsk":true, "confidence":0.9, "followUpQuestion":"Can you tell me more about the types of applications you've been building?"}`;
}

export const POST: RequestHandler = async ({ request }) => {
  let body: FollowUpRequest;

  try {
    body = await request.json();
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  const { question, answer, previousQA } = body;

  if (!question?.trim() || !answer?.trim()) {
    throw error(400, 'question and answer are required');
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  // Build context from previous QA to avoid redundancy
  const historyContext = previousQA
    .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
    .join('\n\n');

  const userContent = `Here is the interview conversation so far:
${historyContext ? historyContext + '\n\n---\n\n' : ''}Current question and answer:
Q: ${question}
A: ${answer}

Decide if a follow-up question would add valuable information.`;

  let rawContent: string;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // low temperature for consistent decisions
      max_tokens: 256,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: userContent },
      ],
    });

    rawContent = completion.choices[0]?.message?.content ?? '';
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Groq API error';
    throw error(502, `Groq request failed: ${msg}`);
  }

  let result: FollowUpResponse;
  try {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
    result = JSON.parse(cleaned);

    // Validate response structure
    if (typeof result.shouldAsk !== 'boolean' || typeof result.confidence !== 'number') {
      throw new Error('Invalid response structure');
    }

    // Only suggest follow-ups if confidence >= 0.75
    if (result.confidence < 0.75) {
      result.shouldAsk = false;
      result.followUpQuestion = '';
    } else if (typeof result.followUpQuestion !== 'string') {
      result.followUpQuestion = '';
    }
    // Ensure it's a string
    if (!result.followUpQuestion) {
      result.followUpQuestion = '';
    }
  } catch (e) {
    console.error('FollowUp raw response (unparseable):', rawContent);
    // If parsing fails, return false to continue with next question
    result = {
      shouldAsk: false,
      confidence: 0,
      followUpQuestion: '',
    };
  }

  return json(result);
};
