<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { Brain, BarChart3, Target, Star } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import type { QAPair, CareerAnalysis } from '$lib/interfaces/types.interface';

  interface Props {
    answers: QAPair[];
    onComplete: (analysis: CareerAnalysis) => void;
    onError: (msg: string) => void;
  }

  let { answers, onComplete, onError }: Props = $props();

  // ── Loading steps ────────────────────────────────────────────
  const steps: { icon: Component; text: string }[] = [
    { icon: Brain,     text: 'Mapping your career DNA…'        },
    { icon: BarChart3, text: 'Identifying your skill gaps…'    },
    { icon: Target,    text: 'Building your roadmap…'          },
    { icon: Star,      text: 'Finalising recommendations…'     },
  ];

  let currentStep = $state(0);
  const progress  = tweened(0, { duration: 120, easing: cubicOut });

  const CurrentIcon = $derived(steps[currentStep].icon);

  // ── Fire the API call and animate in parallel ────────────────
  $effect(() => {
    let stopped = false;

    // Advance loading steps every ~1 s
    const stepTimer = setInterval(() => {
      if (!stopped) currentStep = Math.min(currentStep + 1, steps.length - 1);
    }, 1100);

    // Animate progress bar up to 90% while waiting for the API
    const fakeProgress = setInterval(() => {
      progress.update((p) => (p < 88 ? p + 1.2 : p));
    }, 100);

    // Call the server route
    fetch('/api/analyze', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ answers }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const { message } = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(message);
        }
        return res.json() as Promise<CareerAnalysis>;
      })
      .then(async (analysis) => {
        clearInterval(stepTimer);
        clearInterval(fakeProgress);
        // Snap to 100 % then hand off
        await progress.set(100);
        setTimeout(() => onComplete(analysis), 400);
      })
      .catch((e: Error) => {
        clearInterval(stepTimer);
        clearInterval(fakeProgress);
        onError(e.message ?? 'Something went wrong. Please try again.');
      });

    return () => {
      stopped = true;
      clearInterval(stepTimer);
      clearInterval(fakeProgress);
    };
  });
</script>

<div class="min-h-screen flex flex-col items-center justify-center px-6">

  <!-- Animated icon -->
  <div class="relative mb-12">
    <div
      class="analyzing-glow absolute rounded-full bg-primary/20 blur-xl"
      style="width:160px; height:160px;"
    ></div>

    {#key currentStep}
      <div
        in:fly={{ y: 16, duration: 380 }}
        out:fade={{ duration: 180 }}
        class="relative w-40 h-40 rounded-full bg-linear-to-br from-primary to-accent
               flex items-center justify-center"
      >
        <CurrentIcon class="w-16 h-16 text-primary-foreground" />
      </div>
    {/key}
  </div>

  <!-- Step label -->
  {#key currentStep}
    <p
      in:fly={{ y: 16, duration: 280 }}
      out:fly={{ y: -16, duration: 180 }}
      class="text-xl font-medium text-foreground mb-8 text-center"
    >
      {steps[currentStep].text}
    </p>
  {/key}

  <!-- Progress bar -->
  <div class="w-full max-w-md">
    <div class="h-3 bg-secondary rounded-full overflow-hidden">
      <div
        class="h-full bg-linear-to-r from-primary to-accent rounded-full"
        style="width:{$progress}%; box-shadow: 0 0 20px rgba(4,222,143,0.4);"
      ></div>
    </div>
    <p class="text-center text-muted-foreground text-sm mt-3">
      {Math.round($progress)}% complete
    </p>
  </div>

  <!-- Shimmer skeleton cards -->
  <div class="mt-12 w-full max-w-md space-y-4 opacity-30">
    {#each Array(3) as _, i}
      <div
        in:fade={{ duration: 300, delay: i * 150 }}
        class="h-24 rounded-2xl bg-secondary animate-shimmer"
      ></div>
    {/each}
  </div>

</div>

<style>
  @keyframes analyzing-pulse {
    0%, 100% { transform: scale(1);   opacity: 0.5; }
    50%       { transform: scale(1.2); opacity: 0.8; }
  }
  .analyzing-glow { animation: analyzing-pulse 2s ease-in-out infinite; }

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
</style>
