<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  interface Props {
    current: number;
    max: number;
    label?: string;
    showValues?: boolean;
    variant?: 'primary' | 'accent' | 'warning';
    size?: 'sm' | 'md' | 'lg';
  }

  let {
    current,
    max,
    label,
    showValues = true,
    variant = 'primary',
    size = 'md',
  }: Props = $props();

  const percentage = tweened(0, { duration: 1500, easing: cubicOut });

  $effect(() => {
    percentage.set(Math.min((current / max) * 100, 100));
  });

  const variantBar: Record<string, string> = {
    primary: 'bg-primary shadow-[0_0_20px_rgba(4,162,143,0.5)]',
    accent:  'bg-accent  shadow-[0_0_20px_rgba(0,87,240,0.5)]',
    warning: 'bg-warning shadow-[0_0_20px_rgba(253,200,110,0.5)]',
  };

  const sizeClass: Record<string, string> = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
</script>

<div class="w-full">
  {#if label || showValues}
    <div class="flex justify-between items-center mb-2">
      {#if label}
        <span class="text-sm font-medium text-muted-foreground">{label}</span>
      {/if}
      {#if showValues}
        <span class="text-sm font-bold text-foreground">{current} / {max}</span>
      {/if}
    </div>
  {/if}

  <div class="w-full {sizeClass[size]} bg-secondary rounded-full overflow-hidden">
    <div
      class="{sizeClass[size]} {variantBar[variant]} rounded-full transition-none"
      style="width: {$percentage}%"
    ></div>
  </div>
</div>
