<script lang="ts">
  import { scale } from 'svelte/transition';

  interface Props {
    label: string;
    variant?: 'primary' | 'secondary' | 'accent';
  }

  let { label, variant = 'primary' }: Props = $props();

  const variants: Record<string, string> = {
    primary:   'bg-primary/20 text-primary border-primary/30',
    secondary: 'bg-secondary text-secondary-foreground border-secondary',
    accent:    'bg-accent/20 text-accent border-accent/30',
  };
</script>

<span
  in:scale={{ duration: 300, start: 0 }}
  class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border {variants[variant]}"
>
  {label}
</span>
