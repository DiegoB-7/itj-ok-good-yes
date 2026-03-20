import Groq from 'groq-sdk';
import { error } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

// Available voices: autumn | diana | hannah | austin | daniel | troy
const VOICE = 'diana';
const MODEL = 'canopylabs/orpheus-v1-english';
const MAX_CHARS = 200; // hard limit from Groq

/** Split text into chunks that respect the 200 char limit, breaking on sentences */
function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];

  const chunks: string[] = [];
  // Split on sentence boundaries first
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHARS) {
      if (current) chunks.push(current.trim());
      // If a single sentence is itself over 200 chars, hard-cut it
      if (sentence.length > MAX_CHARS) {
        const words = sentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).length > MAX_CHARS) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += ' ' + word;
          }
        }
        current = wordChunk;
      } else {
        current = sentence;
      }
    } else {
      current += sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export const POST: RequestHandler = async ({ request }) => {
  let text: string;

  try {
    ({ text } = await request.json());
  } catch {
    throw error(400, 'Invalid JSON body');
  }

  if (!text?.trim()) {
    throw error(400, 'text is required');
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const chunks = splitIntoChunks(text.trim());

  try {
    // Generate audio for each chunk then concatenate the wav buffers
    const audioBuffers = await Promise.all(
      chunks.map(async (chunk) => {
        const response = await groq.audio.speech.create({
          model: MODEL,
          voice: VOICE,
          input: chunk,
          response_format: 'wav',
        });
        return response.arrayBuffer();
      })
    );

    // Concatenate all chunks into one buffer
    const total = audioBuffers.reduce((sum, b) => sum + b.byteLength, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const buf of audioBuffers) {
      merged.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }
    console.log('entro')

    return new Response(merged, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: unknown) {
    console.error('[TTS] Groq error:', e);
    const msg = e instanceof Error ? e.message : 'TTS request failed';
    throw error(502, msg);
  }
};