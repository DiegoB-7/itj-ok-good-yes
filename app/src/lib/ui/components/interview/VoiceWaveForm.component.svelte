<script lang="ts">
  interface Props {
    isActive: boolean;
    isListening?: boolean;
  }

  let { isActive, isListening = false }: Props = $props();

  const BARS = 12;
  // Deterministic peaks so SSR and client match
  const peaks = Array.from({ length: BARS }, (_, i) => 40 + ((i * 17 + 13) % 40));

  const color = $derived(isListening ? '#EF4444' : '#04A28F');
</script>

<div class="flex items-center justify-center gap-1 h-24" aria-hidden="true">
  {#each peaks as peak, i}
    <div
      class="w-2 rounded-full transition-colors duration-300"
      style="
        background-color: {color};
        height: 8px;
        --peak: {peak}px;
        {isActive
          ? `animation: waveform ${0.45 + (i % 3) * 0.1}s ease-in-out infinite;
             animation-delay: ${i * 0.05}s;`
          : ''}
      "
    ></div>
  {/each}
</div>