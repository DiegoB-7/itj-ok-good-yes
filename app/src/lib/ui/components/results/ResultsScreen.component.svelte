<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import {
    ArrowRight, Share2, Zap, BookOpen,
    CircleAlert, RotateCcw, ExternalLink,
  } from '@lucide/svelte';
  import type { CareerAnalysis } from '$lib/interfaces/types.interface';

  interface Props {
    analysis: CareerAnalysis;
    onRestart: () => void;
  }

  let { analysis, onRestart }: Props = $props();

  // ── XP progress bar (tweened) ──────────────────────────────
  function useProgress(current: number, max: number) {
    const pct = tweened(0, { duration: 1400, easing: cubicOut });
    pct.set(Math.min((current / max) * 100, 100));
    return pct;
  }

  // svelte-ignore state_referenced_locally
    const overallProgress = useProgress(analysis.currentLevel, 10);

  // Severity colours
  const severityMap = {
    critical:       { label: 'Critical',     cls: 'bg-destructive text-destructive-foreground' },
    important:      { label: 'Important',    cls: 'bg-warning     text-warning-foreground'     },
    'nice-to-have': { label: 'Nice to have', cls: 'bg-accent      text-accent-foreground'      },
  } as const;

  const variantBar = {
    critical:       'bg-destructive shadow-[0_0_14px_rgba(239,68,68,0.4)]',
    important:      'bg-warning     shadow-[0_0_14px_rgba(253,200,110,0.4)]',
    'nice-to-have': 'bg-primary     shadow-[0_0_14px_rgba(4,162,143,0.4)]',
  } as const;

  // Scroll to roadmap
  let roadmapEl: HTMLElement | undefined = $state();
  function scrollToRoadmap() {
    roadmapEl?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="min-h-screen bg-background">

  <!-- ── Sticky header ────────────────────────────────────────── -->
  <header class="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
    <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-primary">LevelUp</h1>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground
                       transition-colors flex items-center gap-2">
          <Share2 class="w-4 h-4" />
          Share
        </button>
        <button
          onclick={onRestart}
          class="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm
                 font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          Start over
        </button>
      </div>
    </div>
  </header>

  <div class="max-w-4xl mx-auto px-6 py-8 space-y-10">

    <!-- ── Profile summary ──────────────────────────────────── -->
    <section
      in:fly={{ y: 20, duration: 400 }}
      class="bg-card text-card-foreground rounded-3xl p-8"
    >
      <div class="flex flex-col md:flex-row md:items-start gap-6">
        <div class="flex-1 space-y-4">
          <div>
            <p class="text-sm text-muted-foreground mb-1">Your current role</p>
            <h2 class="text-2xl font-bold">{analysis.currentRole}</h2>
          </div>

          <!-- Skill badges -->
          <div class="flex flex-wrap gap-2">
            {#each analysis.skills as skill, i}
              <span
                in:scale={{ duration: 280, delay: i * 60 }}
                class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full
                       border bg-primary/15 text-primary border-primary/25"
              >
                {skill}
              </span>
            {/each}
          </div>

          <p class="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
        </div>

        <div class="md:text-right space-y-2 shrink-0">
          <p class="text-sm text-muted-foreground">Target role</p>
          <div class="flex items-center gap-2 text-base font-semibold md:justify-end">
            <ArrowRight class="w-4 h-4 text-primary" />
            {analysis.targetRole}
          </div>
        </div>
      </div>

      <!-- Overall progress -->
      <div class="mt-6 space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Overall seniority</span>
          <span class="font-bold">Level {analysis.currentLevel} / 10</span>
        </div>
        <div class="h-3 bg-secondary rounded-full overflow-hidden">
          <div
            class="h-full bg-linear-to-r from-primary to-accent rounded-full"
            style="width:{$overallProgress}%"
          ></div>
        </div>
      </div>
    </section>

    <!-- ── Gap analysis ──────────────────────────────────────── -->
    <section
      in:fly={{ y: 20, duration: 400, delay: 150 }}
      class="space-y-5"
    >
      <div class="flex items-center gap-3">
        <CircleAlert class="w-6 h-6 text-destructive" />
        <h2 class="text-2xl font-bold">What's holding you back</h2>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        {#each analysis.gaps as gap, i}
          {@const cfg  = severityMap[gap.severity]}
          {@const barW = Math.min((gap.currentLevel / gap.requiredLevel) * 100, 100)}

          <div
            in:fly={{ y: 20, duration: 350, delay: 80 * i }}
            class="bg-card text-card-foreground rounded-2xl p-5 space-y-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <h3 class="font-bold text-base">{gap.title}</h3>
                <span class="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full {cfg.cls}">
                  {cfg.label}
                </span>
              </div>
            </div>

            <p class="text-sm text-muted-foreground leading-relaxed">{gap.description}</p>

            <div class="space-y-1.5">
              <div class="flex justify-between text-xs text-muted-foreground">
                <span>Current: {gap.currentLevel}</span>
                <span>Required: {gap.requiredLevel}</span>
              </div>
              <div class="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full {variantBar[gap.severity]}"
                  style="width:{barW}%"
                ></div>
              </div>
            </div>

            <button
              onclick={scrollToRoadmap}
              class="w-full py-2 px-4 border border-primary text-primary rounded-full
                     text-sm font-semibold hover:bg-primary/10 transition-colors"
            >
              Fix this gap
            </button>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Career roadmap ────────────────────────────────────── -->
    <section
      bind:this={roadmapEl}
      in:fly={{ y: 20, duration: 400, delay: 300 }}
      class="space-y-5"
    >
      <div class="flex items-center gap-3">
        <BookOpen class="w-6 h-6 text-accent" />
        <h2 class="text-2xl font-bold">Your Career Roadmap</h2>
      </div>

      <div class="space-y-4">
        {#each analysis.milestones as milestone, i}
          <div
            in:fly={{ y: 16, duration: 350, delay: 100 * i }}
            class="bg-card text-card-foreground rounded-2xl p-6 space-y-3
                   border-l-4 {i === 0 ? 'border-primary' : 'border-secondary'}"
          >
            <!-- Step indicator + title -->
            <div class="flex items-center gap-3">
              <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm
                           font-bold shrink-0
                           {i === 0
                             ? 'bg-primary text-primary-foreground'
                             : 'bg-secondary text-secondary-foreground'}">
                {i + 1}
              </span>
              <h3 class="font-bold text-base">{milestone.title}</h3>
              <span class="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                ⏱ {milestone.estimatedTime}
              </span>
            </div>

            <p class="text-sm text-muted-foreground leading-relaxed pl-11">
              {milestone.whatToLearn}
            </p>

            <!-- Resources -->
            {#if milestone.resources.length > 0}
              <div class="pl-11 flex flex-wrap gap-2">
                {#each milestone.resources as res}
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-3 py-1 bg-secondary
                           text-secondary-foreground text-xs rounded-full
                           hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {res.title}
                    <ExternalLink class="w-3 h-3" />
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <!-- ── Share CTA ─────────────────────────────────────────── -->
    <div
      in:fly={{ y: 16, duration: 350, delay: 450 }}
      class="flex justify-center pb-8"
    >
      <button
        class="btn-pressable inline-flex items-center gap-2 px-8 py-3
               bg-gradient-primary text-primary-foreground rounded-full font-semibold
               shadow-[0_0_24px_rgba(4,162,143,0.3)]"
      >
        <Zap class="w-4 h-4" />
        Share my roadmap
      </button>
    </div>

  </div>
</div>
