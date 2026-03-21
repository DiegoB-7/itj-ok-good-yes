<script lang="ts">
  import { fly, fade, scale } from 'svelte/transition';
  import { Mic, Square, MessageSquare, SkipForward, Loader2, Sparkles, Check, Flag, X } from '@lucide/svelte';
  import AIAvatar from '$lib/ui/components/interview/AIAvatar.component.svelte';
  import ChatBubble   from '$lib/ui/components/interview/ChatBubble.component.svelte';
  import VoiceWaveform from '$lib/ui/components/interview/VoiceWaveForm.component.svelte';
  import type { QAPair } from '$lib/interfaces/types.interface';

  interface Props {
    onComplete: (answers: QAPair[]) => void;
  }

  let { onComplete }: Props = $props();

  // ── Static data ───────────────────────────────────────────────
  const mainQuestions = [
    'Tell me about your current role and what you do day-to-day.',
    'What technical skills are you most confident in?',
    'Where do you see yourself in 3 years?',
  ];

  const chips = ['Web development', 'Mobile apps', 'Backend systems', 'Data & ML' ];

  // ── State ─────────────────────────────────────────────────────
  let mainStep         = $state(0); // current main question index
  let currentFollowUpQuestion = $state<string>(''); // single follow-up at a time
  let followUpPhase = $state<'none' | 'first' | 'second'>('none'); // track which follow-up we're on
  let isAISpeaking     = $state(true);
  let isAudioPlaying   = $state(false); // TTS audio is actually playing (not just loading)
  let isUserSpeaking   = $state(false); // mic detects actual audio above threshold
  let messages         = $state<{ text: string; isAI: boolean }[]>([]);
  let showInput        = $state(false);
  let inputText        = $state('');
  let collectedAnswers = $state<QAPair[]>([]);
  let isCheckingFollowUp = $state(false); // checking if follow-up is needed
  let isPendingFollowUp   = $state(false); // hiding card while deciding next question
  let isCompleted = $state(false); // interview is completely done
  
  // Track completed follow-ups per main question (persistent)
  let completedFollowUpsByQuestion = $state<Record<number, number>>({ 0: 0, 1: 0, 2: 0 });

  // Recording state
  let isRecording      = $state(false);
  let isTranscribing   = $state(false); // waiting for Whisper response
  let recordingError   = $state<string | null>(null);

  // MediaRecorder internals — plain variables, not reactive state
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let stream: MediaStream | null = null;

  let currentAudio: HTMLAudioElement | null = null;
  let chatListEl: HTMLDivElement | null = null;

  // Volume detection internals
  let audioContext: AudioContext | null = null;
  let analyserNode: AnalyserNode | null = null;
  let volumeCheckInterval: ReturnType<typeof setInterval> | null = null;

  // ── Auto-scroll chat to bottom on new messages ─────────────
  $effect(() => {
    const _ = messages.length; // track
    if (showInput && chatListEl) {
      setTimeout(() => chatListEl?.scrollTo({ top: chatListEl.scrollHeight, behavior: 'smooth' }), 50);
    }
  });

  // ── Boot ──────────────────────────────────────────────────────
  $effect(() => {
    const t = setTimeout(async () => {
      const firstQuestion = mainQuestions[0];
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
    isPendingFollowUp = false; // reveal card now that we know what to show
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
        audio.onplaying = () => { isAudioPlaying = true; };
        audio.onended = () => {
          isAudioPlaying = false;
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          isAudioPlaying = false;
          URL.revokeObjectURL(url);
          currentAudio = null;
          resolve(); // still resolve so the interview isn't blocked
        };
        audio.play().catch(() => { isAudioPlaying = false; resolve(); }); // autoplay blocked — silently continue
      });
    } catch (e) {
      console.error('TTS fetch failed:', e);
    } finally {
      isAudioPlaying = false;
      isAISpeaking = false;
    }
  }

  // ── Volume detection for mic ───────────────────────────────────
  function startVolumeDetection(micStream: MediaStream) {
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(micStream);
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    source.connect(analyserNode);
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    volumeCheckInterval = setInterval(() => {
      if (!analyserNode) return;
      analyserNode.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      isUserSpeaking = avg > 8;
    }, 80);
  }

  function stopVolumeDetection() {
    if (volumeCheckInterval !== null) {
      clearInterval(volumeCheckInterval);
      volumeCheckInterval = null;
    }
    analyserNode?.disconnect();
    analyserNode = null;
    audioContext?.close();
    audioContext = null;
    isUserSpeaking = false;
  }


  async function respond(answer: string) {
    collectedAnswers = [...collectedAnswers, { question: getCurrentQuestion(), answer }];
    messages         = [...messages, { text: answer, isAI: false }];
    showInput        = false;
    inputText        = '';
    recordingError   = null;

    const isLastMain = mainStep >= mainQuestions.length - 1;

    if (isLastMain && !currentFollowUpQuestion) {
      // Last question answered with no follow-ups, complete interview
      isCompleted = true;
      setTimeout(() => onComplete(collectedAnswers), 1400);
    } else if (followUpPhase === 'first' && currentFollowUpQuestion) {
      // Just answered first follow-up, increment and try for second
      completedFollowUpsByQuestion[mainStep] = 1;
      isPendingFollowUp = true;
      currentFollowUpQuestion = '';
      followUpPhase = 'none';

      setTimeout(async () => {
        // Check for second follow-up (with first answer now in history)
        const maxFollowUpsReached = completedFollowUpsByQuestion[mainStep] >= 2;

        if (maxFollowUpsReached) {
          // Already have 1 follow-up, skip checking for second
          if (!isLastMain) {
            mainStep += 1;
            const nextQuestion = mainQuestions[mainStep];
            messages = [...messages, { text: nextQuestion, isAI: true }];
            await speak(nextQuestion);
          }
        } else {
          // Try to get second follow-up
          await checkForFollowUp(true);

          if (currentFollowUpQuestion) {
            followUpPhase = 'second';
            messages = [...messages, { text: currentFollowUpQuestion, isAI: true }];
            await speak(currentFollowUpQuestion);
          } else {
            // No second follow-up, move to next main question
            if (!isLastMain) {
              mainStep += 1;
              const nextQuestion = mainQuestions[mainStep];
              messages = [...messages, { text: nextQuestion, isAI: true }];
              await speak(nextQuestion);
            }
          }
        }
      }, 900);
    } else if (followUpPhase === 'second' && currentFollowUpQuestion) {
      // Just answered second follow-up, move to next main question
      completedFollowUpsByQuestion[mainStep] = 2;
      isPendingFollowUp = true;
      currentFollowUpQuestion = '';
      followUpPhase = 'none';

      setTimeout(async () => {
        if (!isLastMain) {
          mainStep += 1;
          const nextQuestion = mainQuestions[mainStep];
          messages = [...messages, { text: nextQuestion, isAI: true }];
          await speak(nextQuestion);
        }
      }, 900);
    } else {
      // Just answered a main question, try to get first follow-up
      isPendingFollowUp = true;
      setTimeout(async () => {
        // Check if we've already reached the max 2 follow-ups for this question
        const maxFollowUpsReached = completedFollowUpsByQuestion[mainStep] >= 2;

        if (maxFollowUpsReached) {
          // Already have 2 follow-ups, skip to next main question without checking
          if (!isLastMain) {
            mainStep += 1;
            const nextQuestion = mainQuestions[mainStep];
            messages = [...messages, { text: nextQuestion, isAI: true }];
            await speak(nextQuestion);
          }
        } else {
          // Try to get first follow-up
          await checkForFollowUp(false);

          if (currentFollowUpQuestion) {
            followUpPhase = 'first';
            messages = [...messages, { text: currentFollowUpQuestion, isAI: true }];
            await speak(currentFollowUpQuestion);
          } else {
            // No follow-up, move to next main question
            if (!isLastMain) {
              mainStep += 1;
              const nextQuestion = mainQuestions[mainStep];
              messages = [...messages, { text: nextQuestion, isAI: true }];
              await speak(nextQuestion);
            }
          }
        }
      }, 900);
    }
  }

  function getCurrentQuestion(): string {
    if (currentFollowUpQuestion) {
      return currentFollowUpQuestion;
    }
    return mainQuestions[mainStep];
  }

  async function checkForFollowUp(isSecond: boolean = false) {
    isCheckingFollowUp = true;

    try {
      const currentAnswer = collectedAnswers[collectedAnswers.length - 1];
      if (!currentAnswer) return;

      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentAnswer.question,
          answer: currentAnswer.answer,
          previousQA: collectedAnswers.slice(0, -1), // exclude current answer
        }),
      });

      if (!res.ok) {
        console.error('Follow-up check failed:', res.statusText);
        return;
      }

      const { shouldAsk, followUpQuestion } = await res.json();

      if (shouldAsk && followUpQuestion?.trim()) {
        currentFollowUpQuestion = followUpQuestion;
      }
    } catch (e) {
      console.error('Follow-up fetch error:', e);
    } finally {
      isCheckingFollowUp = false;
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
    startVolumeDetection(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stopVolumeDetection();
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

  // Disable controls while the AI is thinking or loading next question (not while speaking)
  const isAIBusy = $derived(isCheckingFollowUp || isPendingFollowUp);
</script>


<div class="min-h-screen flex flex-col bg-background select-none">

  <!-- ── Progress dots ───────────────────────────────────────── -->
  <div class="flex justify-center items-center gap-2 pt-8 pb-4">
    <!-- Main question dots with their follow-ups inline to the right -->
    {#each mainQuestions as _, i}
      <div class="flex flex-row items-center gap-2">
        <!-- Follow-up dots (inline to the left; completed ones always visible) -->
        {#each Array(completedFollowUpsByQuestion[i]) as _, fIdx}
          <span
            in:scale={{ duration: 300, delay: fIdx * 100 }}
            class="w-2.5 h-2.5 rounded-full bg-accent/70
                   shadow-[0_0_6px_rgba(239,68,68,0.4)]"
          ></span>
        {/each}

        <!-- Current (active) follow-up dot — always rightmost before main dot -->
        {#if mainStep === i && followUpPhase !== 'none'}
          <span
            in:scale={{ duration: 300 }}
            class="w-3 h-3 rounded-full bg-accent scale-110
                   shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"
          ></span>
        {/if}

        <!-- Main dot -->
        <div
          in:fly={{ y: -6, duration: 300, delay: i * 80 }}
          class="w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center
                 {i === mainStep && !currentFollowUpQuestion
                   ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(4,162,143,0.6)]'
                   : i < mainStep
                   ? 'bg-primary/60'
                   : 'border-1 bg-background border-secondary'}
                 {i === mainStep && !currentFollowUpQuestion && isCheckingFollowUp
                   ? 'animate-pulse'
                   : ''}"
        >
          {#if i < mainStep || (isCompleted && i === mainStep)}
            <Check class="w-2 h-2 text-primary-foreground" />
          {/if}
        </div>
      </div>
    {/each}

    <!-- Final dot (goal/end indicator with icon) -->
    <div
      in:fly={{ y: -6, duration: 300, delay: 3 * 80 }}
      class="w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center
             {isCompleted
               ? 'bg-primary scale-125 shadow-[0_0_10px_rgba(4,162,143,0.6)] text-white'
               : 'border-1 bg-background border-secondary'}"
    >
      <Flag class="text-secondary w-3/5 h-3/5 {isCompleted ? 'text-white' : 'text-secondary'}" />
    </div>
  </div>

  <!-- ── Main content ─────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col items-center justify-center px-6 pb-36">

    <!-- Avatar -->
    <div in:fly={{ y: 0, duration: 400 }} class="mb-8">
      <AIAvatar isSpeaking={isAISpeaking} size="lg" />
    </div>

    <!-- Question card — always present; content swaps inside -->
    {#key `${mainStep}-${followUpPhase}`}
      <div
        in:fly={{ y: 18, duration: 320 }}
        class="bg-card text-card-foreground rounded-2xl px-6 py-5
               max-w-md w-full text-center mb-8 shadow-lg min-h-[88px] flex flex-col items-center justify-center"
      >
        {#if isPendingFollowUp || isCheckingFollowUp}
          <div
            in:fade={{ duration: 200 }}
            out:fade={{ duration: 150 }}
            class="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </span>
            <span>AI is thinking...</span>
          </div>
        {:else}
          <div in:fade={{ duration: 200, delay: 50 }}>
            <div class="flex items-center gap-2 justify-center mb-1">
              {#if followUpPhase !== 'none'}
                <Sparkles class="w-4 h-4 text-accent" />
              {/if}
            </div>
            <p class="text-lg font-medium leading-snug">{getCurrentQuestion()}</p>
            {#if followUpPhase !== 'none'}
              <p class="text-xs text-muted-foreground mt-2">Follow-up question</p>
            {/if}
          </div>
        {/if}
      </div>
    {/key}

    <!-- Waveform -->
    <VoiceWaveform isActive={isUserSpeaking || isAudioPlaying} isListening={isRecording} />

    <!-- Suggestion chips — only on first main question -->
    {#if mainStep === 0 && followUpPhase === 'none' && messages.length <= 1 && !isRecording}
      <div
        in:fade={{ duration: 300, delay: 600 }}
        class="flex flex-wrap justify-center gap-2 mt-5"
      >
        {#each chips as chip}
          <button
            onclick={() => respond(`I work in ${chip.toLowerCase()}`)}
            class="btn-pressable px-4 py-2 bg-gradient-primary text-secondary-foreground rounded-full text-sm
                   hover:bg-gradient-primary/70 transition-colors active:scale-95  mb-8"
          >
            {chip}
          </button>
        {/each}
      </div>
    {/if}

    <!-- Chat history -->
   <!-- <div class="w-full max-w-lg mt-7 space-y-3 max-h-48 overflow-y-auto pr-5">
      {#each visible as msg, i (msg.text + i)}
        <ChatBubble message={msg.text} isAI={msg.isAI} />
      {/each}
    </div>-->
    
  </div>

  <!-- ── Bottom controls ──────────────────────────────────────── -->
  <div
    class="fixed bottom-0 inset-x-0
           bg-linear-to-t from-background via-background/95 to-transparent
           px-6 pt-10 pb-8"
  >
    <div class="max-w-md mx-auto">
      {#if showInput}
        <!-- Chat history -->
        <div
          bind:this={chatListEl}
          in:fly={{ y: 10, duration: 250 }}
          class="chat-history w-full max-w-lg space-y-2 max-h-52 overflow-y-auto pb-1 mb-4 scroll-smooth"
        >
          {#each messages as msg, i (msg.text + i)}
            <ChatBubble
              message={msg.text}
              isAI={msg.isAI}
              showSeparator={msg.isAI && i > 0 && !messages[i - 1].isAI}
            />
          {/each}
        </div>
        <!-- Text input mode -->
        <form onsubmit={submitText} class="flex gap-3">
          <!-- Back button -->
          <button
            type="button"
            onclick={() => (showInput = false)}
            class="p-3.5 bg-secondary text-secondary-foreground rounded-full
                   hover:bg-secondary/70 transition-colors"
            aria-label="Close text input"
          >
            <X class="w-5 h-5" />
          </button>
          
          <!-- svelte-ignore a11y_autofocus -->
          <input
            type="text"
            bind:value={inputText}
            placeholder="Type your answer…"
            autofocus
            class="flex-1 px-4 py-3 bg-background text-foreground rounded-full
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
            disabled={isAIBusy}
            class="p-3 bg-primary text-secondary-foreground rounded-full
                   hover:bg-primary/70 transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
            aria-label="Type instead"
          >
            <MessageSquare class="w-5 h-5" />
          </button>

          <!-- Main mic button -->
          <button
              onclick={toggleMic}
              disabled={isTranscribing || isAIBusy}
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
                <Square class="w-8 h-8 fill-current" />
              {:else}
                <Mic class="w-8 h-8" />
              {/if}
            </button>

          <!-- Skip -->
          <button
            onclick={() => respond("I'd prefer to skip this one.")}
            disabled={isAIBusy}
            class="p-3 text-muted-foreground hover:text-foreground transition-colors
                   flex items-center gap-1
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <SkipForward class="w-5 h-5" />
            <span class="text-sm">Skip</span>
          </button>

        </div>
      {/if}

    </div>
  </div>

</div>

<style>
  .chat-history::-webkit-scrollbar {
    width: 4px;
  }
  .chat-history::-webkit-scrollbar-track {
    background: transparent;
  }
  .chat-history::-webkit-scrollbar-thumb {
    background-color: hsl(var(--border));
    border-radius: 9999px;
  }
  .chat-history::-webkit-scrollbar-thumb:hover {
    background-color: hsl(var(--muted-foreground) / 0.4);
  }
  /* Firefox */
  .chat-history {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--border)) transparent;
  }
</style>
