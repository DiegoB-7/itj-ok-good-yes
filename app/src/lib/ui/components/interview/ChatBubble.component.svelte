<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Props {
    message: string;
    isAI: boolean;
    timestamp?: string;
    showSeparator?: boolean;
  }

  let { message, isAI, timestamp, showSeparator = false }: Props = $props();

  const TRUNCATE_AT = 180;
  let expanded = $state(false);
  const isTruncatable = $derived(message.length > TRUNCATE_AT);
  const displayText = $derived(
    isTruncatable && !expanded ? message.slice(0, TRUNCATE_AT).trimEnd() + '\u2026' : message
  );
</script>

{#if showSeparator}
  <div class="flex items-center gap-2 my-3">
    <div class="flex-1 h-px bg-border/30"></div>
    <span class="text-[10px] text-muted-foreground/50 uppercase tracking-wide">Next question</span>
    <div class="flex-1 h-px bg-border/30"></div>
  </div>
{/if}

<div
  in:fly={{ y: 16, duration: 300, easing: quintOut }}
  class="flex {isAI ? 'justify-start items-end gap-1.5' : 'justify-end'}"
>
  {#if isAI}
    <div class="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mb-0.5">
      <span class="text-[8px] font-bold text-primary">AI</span>
    </div>
  {/if}

  <div
    class="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
           {isAI
             ? 'bg-muted text-secondary-foreground rounded-tl-sm'
             : 'bg-primary text-primary-foreground rounded-tr-sm'}"
  >
    {displayText}
    {#if isTruncatable}
      <button
        onclick={() => (expanded = !expanded)}
        class="block mt-1 text-xs opacity-50 hover:opacity-90 transition-opacity underline"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    {/if}
    {#if timestamp}
      <p class="text-xs mt-1 opacity-60">{timestamp}</p>
    {/if}
  </div>
</div>