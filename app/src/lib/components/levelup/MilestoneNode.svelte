<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import { Lock, Check, BookOpen, Clock, ExternalLink } from '@lucide/svelte';
  import type { Component } from 'svelte';

  interface Resource {
    title: string;
    url: string;
  }

  interface Props {
    title: string;
    icon: Component;
    isUnlocked: boolean;
    isCompleted?: boolean;
    whatToLearn?: string;
    estimatedTime?: string;
    resources?: Resource[];
  }

  let {
    title,
    icon: Icon,
    isUnlocked,
    isCompleted = false,
    whatToLearn,
    estimatedTime,
    resources = [],
  }: Props = $props();

  let isExpanded = $state(false);

  function toggle() {
    if (isUnlocked) isExpanded = !isExpanded;
  }
</script>

<div class="relative">
  <button
    onclick={toggle}
    in:scale={{ duration: 300 }}
    class="btn-pressable relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all
           {isCompleted
             ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(74,222,128,0.5)]'
             : isUnlocked
             ? 'bg-accent text-accent-foreground shadow-[0_0_30px_rgba(129,140,248,0.4)] cursor-pointer'
             : 'bg-secondary text-muted-foreground cursor-not-allowed'}"
  >
    {#if isCompleted}
      <Check class="w-6 h-6" />
    {:else if isUnlocked}
      <Icon class="w-6 h-6" />
    {:else}
      <Lock class="w-5 h-5" />
    {/if}
  </button>

  <p class="mt-2 text-sm font-medium text-center max-w-[100px]
            {isUnlocked ? 'text-foreground' : 'text-muted-foreground'}">
    {title}
  </p>

  {#if isExpanded && isUnlocked}
    <div
      in:fly={{ y: -10, duration: 200 }}
      out:fly={{ y: -10, duration: 150 }}
      class="absolute left-1/2 -translate-x-1/2 mt-4 w-72 bg-card text-card-foreground
             rounded-2xl p-4 shadow-xl z-20"
    >
      {#if whatToLearn}
        <div class="mb-3">
          <div class="flex items-center gap-2 text-sm font-semibold mb-1">
            <BookOpen class="w-4 h-4 text-primary" />
            What to learn
          </div>
          <p class="text-sm text-muted-foreground">{whatToLearn}</p>
        </div>
      {/if}

      {#if estimatedTime}
        <div class="mb-3">
          <div class="flex items-center gap-2 text-sm font-semibold mb-1">
            <Clock class="w-4 h-4 text-accent" />
            Estimated time
          </div>
          <p class="text-sm text-muted-foreground">{estimatedTime}</p>
        </div>
      {/if}

      {#if resources.length > 0}
        <div>
          <p class="text-sm font-semibold mb-2">Resources</p>
          <div class="flex flex-wrap gap-2">
            {#each resources as resource}
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground
                       text-xs rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {resource.title}
                <ExternalLink class="w-3 h-3" />
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
