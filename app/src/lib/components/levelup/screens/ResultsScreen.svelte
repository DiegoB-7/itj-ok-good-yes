<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import {
    ArrowRight, Share2, Zap, BookOpen,
    Code2, Users, Briefcase, CircleAlert,
  } from '@lucide/svelte';
  import GapCard      from '../GapCard.svelte';
  import MilestoneNode from '../MilestoneNode.svelte';
  import SkillBadge   from '../SkillBadge.svelte';
  import XPProgressBar from '../XPProgressBar.svelte';
  import StreakTracker from '../StreakTracker.svelte';

  interface Props {
    onRestart: () => void;
  }

  let { onRestart }: Props = $props();

  // ── Mock data ────────────────────────────────────────────────────────────

  const mockProfile = {
    role:       'Mid-level Frontend Developer',
    level:      4,
    maxLevel:   10,
    targetRole: 'Senior Engineer at a FAANG',
    skills:     ['React', 'TypeScript', 'CSS'],
  };

  const mockGaps = [
    {
      title:        'System Design',
      severity:     'critical' as const,
      description:  'FAANG interviews heavily weight system design. You need to understand distributed systems, scalability patterns, and architectural tradeoffs.',
      currentLevel: 2,
      requiredLevel: 8,
    },
    {
      title:        'Data Structures & Algorithms',
      severity:     'critical' as const,
      description:  'Strong DSA skills are essential for passing technical interviews at top companies. Focus on trees, graphs, and dynamic programming.',
      currentLevel: 4,
      requiredLevel: 9,
    },
    {
      title:        'Leadership & Communication',
      severity:     'important' as const,
      description:  'Senior roles require strong soft skills. Practice articulating technical decisions and mentoring others.',
      currentLevel: 5,
      requiredLevel: 7,
    },
    {
      title:        'Backend Development',
      severity:     'important' as const,
      description:  'Full-stack capabilities make you more versatile. Learn Node.js, databases, and API design patterns.',
      currentLevel: 3,
      requiredLevel: 6,
    },
    {
      title:        'Testing Best Practices',
      severity:     'nice-to-have' as const,
      description:  'Solid testing skills demonstrate engineering maturity. Learn unit, integration, and E2E testing strategies.',
      currentLevel: 4,
      requiredLevel: 6,
    },
  ];

  const mockMilestones = [
    {
      title:         'Master DSA Fundamentals',
      icon:          Code2,
      isUnlocked:    true,
      isCompleted:   false,
      whatToLearn:   'Focus on arrays, linked lists, trees, and basic graph algorithms. Practice 2-3 LeetCode problems daily.',
      estimatedTime: '4-6 weeks',
      resources: [
        { title: 'LeetCode',    url: 'https://leetcode.com' },
        { title: 'NeetCode',    url: 'https://neetcode.io' },
        { title: 'AlgoExpert', url: 'https://algoexpert.io' },
      ],
    },
    {
      title:         'Learn System Design',
      icon:          Zap,
      isUnlocked:    false,
      whatToLearn:   'Study distributed systems, caching, load balancing, and database design patterns.',
      estimatedTime: '6-8 weeks',
      resources: [
        { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
        { title: 'Designing Data Apps', url: 'https://dataintensive.net' },
      ],
    },
    {
      title:         'Build Leadership Skills',
      icon:          Users,
      isUnlocked:    false,
      whatToLearn:   'Practice tech talks, mentor junior developers, and lead small projects.',
      estimatedTime: 'Ongoing',
      resources: [
        { title: 'Staff Engineer Guide', url: 'https://staffeng.com' },
      ],
    },
    {
      title:         'Land Your Dream Role',
      icon:          Briefcase,
      isUnlocked:    false,
      whatToLearn:   'Apply to target companies, practice behavioral interviews, negotiate offers.',
      estimatedTime: '2-3 months',
      resources: [
        { title: 'Levels.fyi', url: 'https://levels.fyi' },
        { title: 'Blind',      url: 'https://teamblind.com' },
      ],
    },
  ];

  const mockStreak = [true, true, true, false, true, true, false];

  const mockPriorityTasks = [
    { text: 'Complete 3 LeetCode medium problems',  done: true  },
    { text: 'Watch system design video on caching', done: false },
    { text: 'Practice explaining a past project',   done: false },
  ];

  // ── Scroll to roadmap ─────────────────────────────────────────

  let roadmapEl: HTMLElement | undefined = $state();

  function scrollToRoadmap() {
    roadmapEl?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<div class="min-h-screen bg-background">
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-white backdrop-blur-lg border-b border-border">
    <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold text-primary">LevelUp</h1>
      <div class="flex items-center gap-3">
        <button class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <Share2 class="w-4 h-4" />
          Share
        </button>
        <button
          onclick={onRestart}
          class="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium
                 hover:bg-secondary/80 transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-6 py-8">
    <div class="flex flex-col lg:flex-row gap-8">

      <!-- ── Main content ─────────────────────────────────────── -->
      <main class="flex-1 space-y-8">

        <!-- Profile Summary Card -->
        <section
          in:fly={{ y: 20, duration: 400 }}
          class="bg-card text-card-foreground rounded-3xl p-8"
        >
          <div class="flex flex-col md:flex-row md:items-center gap-6">
            <div class="flex-1 space-y-4">
              <div>
                <p class="text-sm text-muted-foreground mb-1">Your current role</p>
                <h2 class="text-2xl font-bold">{mockProfile.role}</h2>
              </div>
              <div class="flex items-center gap-3 flex-wrap">
                <span class="px-4 py-2 bg-accent text-accent-foreground rounded-full font-bold text-sm">
                  Level {mockProfile.level} of {mockProfile.maxLevel}
                </span>
                <div class="flex gap-2 flex-wrap">
                  {#each mockProfile.skills as skill}
                    <SkillBadge label={skill} />
                  {/each}
                </div>
              </div>
            </div>

            <div class="md:text-right space-y-2">
              <p class="text-sm text-muted-foreground">Target role</p>
              <div class="flex items-center gap-2 text-lg font-semibold">
                <ArrowRight class="w-5 h-5 text-primary" />
                {mockProfile.targetRole}
              </div>
            </div>
          </div>

          <div class="mt-6">
            <XPProgressBar
              current={mockProfile.level}
              max={mockProfile.maxLevel}
              label="Progress to goal"
              variant="accent"
            />
          </div>
        </section>

        <!-- Gap Analysis Section -->
        <section
          in:fly={{ y: 20, duration: 400, delay: 200 }}
          class="space-y-6"
        >
          <div class="flex items-center gap-3">
            <CircleAlert class="w-6 h-6 text-destructive" />
            <h2 class="text-2xl font-bold text-foreground">What's holding you back</h2>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            {#each mockGaps as gap, index}
              <div in:fly={{ y: 20, duration: 400, delay: 100 * index }}>
                <GapCard {...gap} onFix={scrollToRoadmap} />
              </div>
            {/each}
          </div>
        </section>

        <!-- Career Roadmap Section -->
        <section
          bind:this={roadmapEl}
          in:fly={{ y: 20, duration: 400, delay: 400 }}
          class="space-y-6"
        >
          <div class="flex items-center gap-3">
            <BookOpen class="w-6 h-6 text-accent" />
            <h2 class="text-2xl font-bold text-foreground">Your Career Roadmap</h2>
          </div>

          <div class="bg-card/50 rounded-3xl p-8 overflow-x-auto">
            <div class="flex items-center justify-between min-w-[600px] relative">
              <!-- Connecting dashed line -->
              <svg
                class="absolute top-8 left-8 h-1 pointer-events-none"
                style="width: calc(100% - 64px);"
              >
                <line
                  x1="0" y1="0" x2="100%" y2="0"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="8 8"
                  class="text-border"
                />
              </svg>

              {#each mockMilestones as milestone, index}
                <div
                  class="relative z-10"
                  in:fly={{ y: 10, duration: 400, delay: 500 + index * 100 }}
                >
                  <MilestoneNode
                    title={milestone.title}
                    icon={milestone.icon}
                    isUnlocked={milestone.isUnlocked}
                    isCompleted={milestone.isCompleted ?? false}
                    whatToLearn={milestone.whatToLearn}
                    estimatedTime={milestone.estimatedTime}
                    resources={milestone.resources}
                  />
                </div>
              {/each}
            </div>
          </div>
        </section>
      </main>

      <!-- ── Sidebar ────────────────────────────────────────────── -->
      <aside class="w-full lg:w-80 space-y-6">
        <div in:fly={{ x: 20, duration: 400, delay: 600 }}>
          <StreakTracker days={mockStreak} />
        </div>

        <div
          in:fly={{ x: 20, duration: 400, delay: 700 }}
          class="bg-card text-card-foreground rounded-2xl p-4"
        >
          <div class="flex items-center gap-2 mb-4">
            <Zap class="w-5 h-5 text-primary" />
            <span class="font-bold">Your #1 priority this week</span>
          </div>

          <div class="space-y-3">
            {#each mockPriorityTasks as task, index}
              <label class="flex items-center gap-3 cursor-pointer">
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                         {task.done ? 'bg-primary border-primary' : 'border-muted-foreground'}"
                >
                  {#if task.done}
                    <span
                      in:fly={{ y: 4, duration: 200, delay: index * 100 }}
                      class="text-primary-foreground text-xs"
                    >
                      ✓
                    </span>
                  {/if}
                </div>
                <span
                  class="text-sm {task.done ? 'line-through text-muted-foreground' : 'text-card-foreground'}"
                >
                  {task.text}
                </span>
              </label>
            {/each}
          </div>
        </div>

        <button
        in:fly={{ x: 20, duration: 400, delay: 800 }}
        class="btn-gradient-animate btn-pressable w-full py-3 px-6 bg-gradient-primary text-primary-foreground rounded-full
                font-semibold flex items-center justify-center gap-2
                shadow-[0_0_20px_rgba(4,162,143,0.3)]"
        >
        <Share2 class="w-4 h-4" />
        Share my roadmap
        </button>
      </aside>
    </div>
  </div>
</div>
