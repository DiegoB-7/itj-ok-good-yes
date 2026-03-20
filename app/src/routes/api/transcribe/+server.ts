import Groq from 'groq-sdk';
import { error, json } from '@sveltejs/kit';
import { GROQ_API_KEY } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const audio = formData.get('audio');

  if (!audio || !(audio instanceof Blob)) {
    throw error(400, 'No audio blob provided');
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  // Groq's SDK expects a File — give it a name with the right extension
  // MediaRecorder typically outputs webm on Chrome, ogg on Firefox
  const file = new File([audio], 'recording.webm', { type: audio.type });

  try {
    const transcription = await groq.audio.transcriptions.create({
      file,
      model: 'whisper-large-v3-turbo', // fastest Whisper on Groq
      response_format: 'json',
      language: 'en',
    });

    return json({ text: transcription.text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Transcription failed';
    throw error(502, msg);
  }
};