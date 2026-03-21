<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import { Zap } from '@lucide/svelte';

  interface Task {
    text: string;
    done: boolean;
  }

  interface Props {
    tasks: Task[];
  }

  let { tasks: initialTasks }: Props = $props();

  // svelte-ignore state_referenced_locally
    let tasks = $state<Task[]>(initialTasks.map(t => ({ ...t })));

  function toggle(index: number) {
    tasks = tasks.map((t, i) => i === index ? { ...t, done: !t.done } : t);
  }
</script>

<div class="bg-card text-card-foreground rounded-2xl p-4">
  <div class="flex items-center gap-2 mb-4">
    <Zap class="w-5 h-5 text-primary" />
    <span class="font-bold text-sm">Your #1 priority this week</span>
  </div>

  <div class="space-y-3">
    {#each tasks as task, i}
      <button
        onclick={() => toggle(i)}
        class="flex items-center gap-3 w-full text-left group"
      >
        <!-- Circle checkbox -->
        <div
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center
                 shrink-0 transition-all duration-200
                 {task.done
                   ? 'bg-primary border-primary'
                   : 'border-muted-foreground group-hover:border-primary'}"
        >
          {#if task.done}
            <span
              in:scale={{ duration: 200 }}
              class="text-primary-foreground text-xs font-bold"
            >✓</span>
          {/if}
        </div>

        <!-- Task label -->
        <span
          class="text-sm transition-colors duration-200
                 {task.done
                   ? 'line-through text-muted-foreground'
                   : 'text-card-foreground group-hover:text-foreground'}"
        >
          {task.text}
        </span>
      </button>
    {/each}
  </div>
</div>