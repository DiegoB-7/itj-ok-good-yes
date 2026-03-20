<script lang="ts">
  interface Props {
    isSpeaking: boolean;
    size?: 'sm' | 'md' | 'lg';
  }

  let { isSpeaking, size = 'md' }: Props = $props();

  const sizes: Record<string, string> = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };
</script>

<div class="relative {sizes[size]}">
  <!-- Glow ring -->
  <div
    class="absolute inset-0 rounded-full bg-linear-to-br from-primary/30 to-accent/30
           {isSpeaking ? 'avatar-ring-speaking' : 'opacity-30'}"
  ></div>

  <!-- Body -->
  <div
    class="relative w-full h-full rounded-full bg-linear-to-br from-primary to-accent
           flex items-center justify-center overflow-hidden
           {isSpeaking ? 'avatar-body-speaking' : ''}"
  >
    <svg viewBox="0 0 100 100" class="w-3/4 h-3/4">
      <polygon
        points="50,15 85,35 85,65 50,85 15,65 15,35"
        fill="none"
        stroke="rgba(26,42,58,0.6)"
        stroke-width="2"
        class="{isSpeaking ? 'avatar-polygon-speaking' : ''}"
      />
      <circle
        cx="50" cy="50" r="15"
        fill="rgba(26,42,58,0.8)"
        class="{isSpeaking ? 'avatar-circle-speaking' : ''}"
      />
    </svg>
  </div>
</div>