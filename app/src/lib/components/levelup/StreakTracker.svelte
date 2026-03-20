<script lang="ts">
  import { scale } from 'svelte/transition';
  import { Flame } from '@lucide/svelte';

  interface Props {
    days: boolean[];
  }

  let { days }: Props = $props();

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const streak = $derived(days.filter(Boolean).length);
</script>

<div class="bg-card text-card-foreground rounded-2xl p-4">
  <div class="flex items-center gap-2 mb-4">
    <Flame class="w-5 h-5 text-warning" />
    <span class="font-bold">{streak} day streak</span>
  </div>

  <div class="flex justify-between gap-2">
    {#each days as completed, index}
      <div class="flex flex-col items-center gap-2">
        <div
          in:scale={{ duration: 300, delay: index * 100 }}
          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                 {completed
                   ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(74,222,128,0.4)]'
                   : 'bg-secondary text-muted-foreground'}"
        >
          {completed ? '✓' : ''}
        </div>
        <span class="text-xs text-muted-foreground">{dayLabels[index]}</span>
      </div>
    {/each}
  </div>
</div>
