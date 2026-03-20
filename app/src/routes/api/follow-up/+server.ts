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
  return `You are an expert career interviewer assistant. Your job is to analyze a user's answer to a career question and decide if a follow-up question would yield valuable additional information.

You have access to the conversation history to avoid asking redundant questions.

Respond with a JSON object ONLY (no markdown, no prose):
{
  "shouldAsk": boolean,
  "confidence": number (0.0 to 1.0),
  "followUpQuestion": string (single question, or empty string)
}

Decision rules:
1. Follow-up is valuable ONLY if:
   - The answer was vague or too brief
   - There's a clear opportunity to elicit more specific technical/career details
   - The follow-up wouldn't be covered by upcoming default questions
   - It avoids repeating information already provided

2. Confidence threshold:
   - Set confidence to 1.0 only if there's a CLEAR need for details
   - Set to 0.7-0.9 if the opportunity is moderate
   - Set to 0.5-0.6 if it's borderline
   - Set to < 0.5 if the answer is already sufficient
   - Only suggest follow-ups if confidence >= 0.75

3. Generate ONE question that:
   - Is specific and targeted, not generic
   - Follows naturally from the answer
   - Digs deeper into technical OR career-relevant dimensions
   - Is concise (under 100 chars)
   - Note: Sequential calls allow for follow-ups to build on previous answers

4. If the answer is already detailed, set shouldAsk=false even if ideas exist.

Example:
Q: "Tell me about your current role"
A: "I'm a frontend dev"
→ shouldAsk=true, confidence=0.9, followUpQuestion="What frameworks do you use?"

After user responds to first follow-up with "React and Vue", a second call would be:
Q: "Tell me about your current role"
Previous Q&A: (includes "What frameworks...", "React and Vue")
→ shouldAsk=true, confidence=0.8, followUpQuestion="How many years have you worked with React?"

Detailed answer example:
Q: "Tell me about your current role"
A: "I'm a senior frontend engineer at Google working on Chrome. I lead a team of 5 and we focus on WebAssembly performance optimization, shipping features quarterly..."
→ shouldAsk=false, confidence=0.1, followUpQuestion=""`;
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
