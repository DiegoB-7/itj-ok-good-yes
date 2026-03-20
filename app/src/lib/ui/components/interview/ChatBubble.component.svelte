<script lang="ts">
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Props {
    message: string;
    isAI: boolean;
    timestamp?: string;
  }

  let { message, isAI, timestamp }: Props = $props();
</script>

<div
  in:fly={{ y: 16, duration: 300, easing: quintOut }}
  class="flex {isAI ? 'justify-start' : 'justify-end'}"
>
  <div
    class="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
           {isAI
             ? 'bg-muted text-secondary-foreground rounded-tl-sm'
             : 'bg-primary text-primary-foreground rounded-tr-sm'}"
  >
    {message}
    {#if timestamp}
      <p class="text-xs mt-1 opacity-60">{timestamp}</p>
    {/if}
  </div>
</div>