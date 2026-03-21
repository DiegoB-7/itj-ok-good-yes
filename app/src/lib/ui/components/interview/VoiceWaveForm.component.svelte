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

  let barEls: (HTMLDivElement | null)[] = [];
  let capturedHeights: number[] = [];
  let fadeRafId: number | null = null;

  // Runs BEFORE Svelte commits DOM changes — capture bar heights while animation is still running
  $effect.pre(() => {
    if (!isActive && barEls.some(el => el !== null)) {
      capturedHeights = barEls.map(el => (el ? el.getBoundingClientRect().height : 8));
    }
  });

  // Runs AFTER DOM changes — apply captured heights then transition smoothly to 8px
  $effect(() => {
    if (fadeRafId !== null) { cancelAnimationFrame(fadeRafId); fadeRafId = null; }

    if (!isActive && capturedHeights.length > 0) {
      // Freeze each bar at its captured height (animation stopped, no transition yet)
      barEls.forEach((el, i) => {
        if (!el) return;
        el.style.animation = 'none';
        el.style.transition = 'none';
        el.style.height = `${capturedHeights[i] ?? 8}px`;
      });
      // Double rAF: first frame forces reflow, second applies the transition
      fadeRafId = requestAnimationFrame(() => {
        fadeRafId = requestAnimationFrame(() => {
          barEls.forEach(el => {
            if (!el) return;
            el.style.transition = 'height 150ms ease-out';
            el.style.height = '8px';
          });
          fadeRafId = null;
        });
      });
    } else if (isActive) {
      capturedHeights = [];
      barEls.forEach((el, i) => {
        if (!el) return;
        el.style.height = '';
        el.style.transition = '';
        el.style.animation = `waveform ${0.45 + (i % 3) * 0.1}s ease-in-out infinite`;
        el.style.animationDelay = `${i * 0.05}s`;
      });
    }
  });
</script>

<div class="flex items-center justify-center gap-1 h-24" aria-hidden="true">
  {#each peaks as peak, i}
    <!-- style: directives set properties individually, so Svelte never overwrites
         the height/animation/transition managed imperatively above -->
    <div
      bind:this={barEls[i]}
      class="bar w-2 rounded-full"
      style:background-color={color}
      style:--peak="{peak}px"
    ></div>
  {/each}
</div>

<style>
  .bar {
    height: 8px;
    transition: background-color 300ms;
  }
</style>