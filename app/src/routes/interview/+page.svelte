<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { Mic, MicOff, MessageSquare, SkipForward, Loader2 } from '@lucide/svelte';
  import AIAvatar from '$lib/ui/components/interview/AIAvatar.component.svelte';
  import ChatBubble   from '$lib/ui/components/interview/ChatBubble.component.svelte';
  import VoiceWaveform from '$lib/ui/components/interview/VoiceWaveForm.component.svelte';
  import type { QAPair } from '$lib/interfaces/types.interface';

  interface Props {
    onComplete: (answers: QAPair[]) => void;
  }

  let { onComplete }: Props = $props();

  // ── Static data ───────────────────────────────────────────────
  const questions = [
    'Tell me about your current role and what you do day-to-day.',
    'What technical skills are you most confident in?',
    'Where do you see yourself in 3 years?',
    "What's the biggest challenge you face in your current position?",
    'What kind of role or company would be your dream next step?',
  ];

  const chips = ['Web development', 'Mobile apps', 'Backend systems', 'Data & ML'];

  // ── State ─────────────────────────────────────────────────────
  let step             = $state(0);
  let isAISpeaking     = $state(true);
  let messages         = $state<{ text: string; isAI: boolean }[]>([]);
  let showInput        = $state(false);
  let inputText        = $state('');
  let collectedAnswers = $state<QAPair[]>([]);

  // Recording state
  let isRecording      = $state(false);
  let isTranscribing   = $state(false); // waiting for Whisper response
  let recordingError   = $state<string | null>(null);

  // MediaRecorder internals — plain variables, not reactive state
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;

  let currentAudio: HTMLAudioElement | null = null;

  // ── Boot ──────────────────────────────────────────────────────
  $effect(() => {
    const t = setTimeout(async () => {
      const firstQuestion = questions[0];
      messages = [{ text: firstQuestion, isAI: true }];
      await speak(firstQuestion);
    }, 800);

    return () => {
      clearTimeout(t);
      // Stop TTS and mic when component unmounts
      currentAudio?.pause();
      stopStream();
    };
  });

  // ── TTS ───────────────────────────────────────────────────────
  async function speak(text: string): Promise<void> {
    // Stop any audio that's still playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    isAISpeaking = true;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        // TTS failing shouldn't block the interview — just skip audio
        console.error('TTS error:', res.statusText);
        isAISpeaking = false;
        return;
      }

      const blob = new Blob([await res.arrayBuffer()], { type: 'audio/wav' });
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve(); // still resolve so the interview isn't blocked
        };
        audio.play().catch(() => resolve()); // autoplay blocked — silently continue
      });
    } catch (e) {
      console.error('TTS fetch failed:', e);
    } finally {
      isAISpeaking = false;
    }
  }


  async function respond(answer: string) {
    collectedAnswers = [...collectedAnswers, { question: questions[step], answer }];
    messages         = [...messages, { text: answer, isAI: false }];
    showInput        = false;
    inputText        = '';
    recordingError   = null;

    const isLast = step >= questions.length - 1;

    if (!isLast) {
      const next = step + 1;

      // Small pause, then speak the next question
      setTimeout(async () => {
        step = next;
        const nextQuestion = questions[next];
        messages = [...messages, { text: nextQuestion, isAI: true }];
        await speak(nextQuestion);
      }, 900);
    } else {
      setTimeout(() => onComplete(collectedAnswers), 1400);
    }
  }


  // ── Mic recording ─────────────────────────────────────────────
  function stopStream() {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  async function startRecording() {
    recordingError = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      recordingError = 'Microphone access denied. Please allow mic permissions and try again.';
      return;
    }

    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stopStream();
      isRecording = false;

      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      audioChunks = [];
      await transcribe(blob);
    };

    mediaRecorder.start();
    isRecording = true;
  }

  function stopRecording() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop(); // triggers onstop → transcribe
    }
  }

  async function toggleMic() {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  // ── Whisper transcription ─────────────────────────────────────
  async function transcribe(blob: Blob) {
    isTranscribing = true;
    recordingError = null;

    try {
      const form = new FormData();
      form.append('audio', blob);

      const res = await fetch('/api/transcribe', { method: 'POST', body: form });

      if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(message);
      }

      const { text } = await res.json() as { text: string };
      const trimmed = text.trim();

      if (!trimmed) {
        recordingError = 'No speech detected. Try speaking closer to your mic.';
        return;
      }

      respond(trimmed);
    } catch (e: unknown) {
      recordingError = e instanceof Error ? e.message : 'Transcription failed. Please try again.';
    } finally {
      isTranscribing = false;
    }
  }

  // ── Text submit ───────────────────────────────────────────────
  function submitText(e: Event) {
    e.preventDefault();
    if (inputText.trim()) respond(inputText.trim());
  }

  const visible = $derived(messages.slice(-4));
</script>


<div class="min-h-screen flex flex-col bg-background select-none">

  <!-- ── Progress dots ───────────────────────────────────────── -->
  <div class="flex justify-center gap-2 pt-8 pb-4">
    {#each questions as _, i}
      <span
        in:fly={{ y: -6, duration: 300, delay: i * 80 }}
        class="w-3 h-3 rounded-full transition-all duration-500
               {i === step
                 ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(4,162,143,0.6)]'
                 : i < step
                 ? 'bg-primary/40'
                 : 'bg-secondary'}"
      ></span>
    {/each}
  </div>

  <!-- ── Main content ─────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col items-center justify-center px-6 pb-36">

    <!-- Avatar -->
    <div in:fly={{ y: 0, duration: 400 }} class="mb-8">
      <AIAvatar isSpeaking={isAISpeaking} size="lg" />
    </div>

    <!-- Question card — re-mounts on step change for transition -->
    {#key step}
      <div
        in:fly={{ y: 18, duration: 320 }}
        class="bg-card text-card-foreground rounded-2xl px-6 py-5
               max-w-md w-full text-center mb-8 shadow-lg"
      >
        <p class="text-lg font-medium leading-snug">{questions[step]}</p>
      </div>
    {/key}

    <!-- Waveform -->
    <VoiceWaveform isActive={isRecording || isAISpeaking} isListening={isRecording} />

    <!-- Suggestion chips — only on first unanswered question -->
    {#if step === 0 && messages.length <= 1 && !isRecording}
      <div
        in:fade={{ duration: 300, delay: 600 }}
        class="flex flex-wrap justify-center gap-2 mt-5"
      >
        {#each chips as chip}
          <button
            onclick={() => respond(`I work in ${chip.toLowerCase()}`)}
            class="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm
                   hover:bg-secondary/70 transition-colors active:scale-95"
          >
            {chip}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Chat history -->
    <div class="w-full max-w-md mt-7 space-y-3 max-h-48 overflow-y-auto pr-1">
      {#each visible as msg, i (msg.text + i)}
        <ChatBubble message={msg.text} isAI={msg.isAI} />
      {/each}
    </div>

  </div>

  <!-- ── Bottom controls ──────────────────────────────────────── -->
  <div
    class="fixed bottom-0 inset-x-0
           bg-linear-to-t from-background via-background/95 to-transparent
           px-6 pt-10 pb-8"
  >
    <div class="max-w-md mx-auto">

      {#if showInput}
        <!-- Text input mode -->
        <form onsubmit={submitText} class="flex gap-3">
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            bind:value={inputText}
            placeholder="Type your answer…"
            autofocus
            class="flex-1 px-4 py-3 bg-secondary text-secondary-foreground rounded-full
                   placeholder:text-muted-foreground
                   focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            class="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold
                   hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
        </form>
      {:else}
        <!-- Voice / action bar -->
        <div class="flex items-center justify-center gap-5">

          <!-- Type toggle -->
          <button
            onclick={() => (showInput = true)}
            class="p-3 bg-secondary text-secondary-foreground rounded-full
                   hover:bg-secondary/70 transition-colors"
            aria-label="Type instead"
          >
            <MessageSquare class="w-5 h-5" />
          </button>

          <!-- Main mic button -->
          <button
              onclick={toggleMic}
              disabled={isTranscribing}
              class="btn-pressable p-6 rounded-full font-semibold transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                    {isRecording
                      ? 'bg-destructive text-destructive-foreground shadow-[0_0_30px_rgba(239,68,68,0.45)]'
                      : 'bg-gradient-primary text-primary-foreground shadow-[0_0_30px_rgba(4,162,143,0.35)]'}"
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {#if isTranscribing}
                <Loader2 class="w-8 h-8 animate-spin" />
              {:else if isRecording}
                <MicOff class="w-8 h-8" />
              {:else}
                <Mic class="w-8 h-8" />
              {/if}
            </button>

          <!-- Skip -->
          <button
            onclick={() => respond("I'd prefer to skip this one.")}
            class="p-3 text-muted-foreground hover:text-foreground transition-colors
                   flex items-center gap-1"
          >
            <SkipForward class="w-5 h-5" />
            <span class="text-sm">Skip</span>
          </button>

        </div>
      {/if}

    </div>
  </div>

</div>
