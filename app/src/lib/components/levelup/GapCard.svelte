<script lang="ts">
  import { fly } from 'svelte/transition';
  import XPProgressBar from './XPProgressBar.svelte';

  interface Props {
    title: string;
    severity: 'critical' | 'important' | 'nice-to-have';
    description: string;
    currentLevel: number;
    requiredLevel: number;
    onFix?: () => void;
  }

  let { title, severity, description, currentLevel, requiredLevel, onFix }: Props = $props();

  const severityConfig = {
    critical:       { label: 'Critical',      color: 'bg-destructive text-destructive-foreground' },
    important:      { label: 'Important',     color: 'bg-warning text-warning-foreground' },
    'nice-to-have': { label: 'Nice to have',  color: 'bg-accent text-accent-foreground' },
  };

  const config = $derived(severityConfig[severity]);

  const barVariant = $derived(
    severity === 'critical'  ? 'warning' :
    severity === 'important' ? 'accent'  : 'primary'
  ) as 'warning' | 'accent' | 'primary';
</script>

<div
  in:fly={{ y: 20, duration: 400 }}
  class="bg-card text-card-foreground rounded-2xl p-6 space-y-4 btn-hover-scale"
>
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-1">
      <h3 class="font-bold text-lg">{title}</h3>
      <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full {config.color}">
        {config.label}
      </span>
    </div>
  </div>

  <p class="text-sm text-muted-foreground leading-relaxed">{description}</p>

  <div class="space-y-2">
    <div class="flex justify-between text-xs text-muted-foreground">
      <span>Current Level</span>
      <span>Required Level</span>
    </div>
    <div class="relative">
      <XPProgressBar
        current={currentLevel}
        max={requiredLevel}
        showValues={false}
        variant={barVariant}
        size="sm"
      />
      <div class="flex justify-between mt-1">
        <span class="text-xs font-medium">{currentLevel}</span>
        <span class="text-xs font-medium">{requiredLevel}</span>
      </div>
    </div>
  </div>

  <button
    onclick={onFix}
    class="btn-pressable w-full py-2 px-4 border border-primary text-primary rounded-full
           text-sm font-semibold hover:bg-primary/10 transition-colors"
  >
    Fix this gap
  </button>
</div>
