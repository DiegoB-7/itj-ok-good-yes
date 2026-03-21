<script lang="ts">
  import { scale } from 'svelte/transition';
  import { Flame, Shield } from '@lucide/svelte';

  interface Props {
    days: (boolean | null)[];
  }

  let { days }: Props = $props();

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const streak = $derived(days.filter(Boolean).length);
</script>

<div class="bg-card text-card-foreground rounded-2xl p-4">
  <div class="flex items-center gap-2 mb-4">
    <Flame class="w-5 h-5 text-orange-500 animate-flame-flicker" />
    <span class="font-bold inline-block">
      <span class="text-2xl font-black animate-fire-streak">
        {streak} day streak
      </span>
    </span>
  </div>

  <div class="flex justify-between gap-2">
    {#each days as completed, index}
      <div class="flex flex-col items-center gap-2">
        <div
          in:scale={{ duration: 300, delay: index * 100 }}
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                 {completed === true
                   ? 'bg-linear-to-br from-orange-400 to-red-600 text-white animate-flame-pulse'
                   : completed === null
                   ? 'bg-linear-to-br from-blue-400 to-cyan-600 text-white animate-shield-pulse'
                   : 'bg-gray-200 text-gray-400'}"
        >
          {#if completed === true}
            <Flame class="w-5 h-5" />
          {:else if completed === null}
            <Shield class="w-5 h-5" />
          {/if}
        </div>
        <span class="text-xs text-muted-foreground">{dayLabels[index]}</span>
      </div>
    {/each}
  </div>
</div>