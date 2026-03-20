<script>
    let { current = 0, max = 10, label = '', variant = 'accent' } = $props();

    const percentage = (current / max) * 100;

    const variants = {
        accent: 'bg-gradient-to-r from-cyan-500 to-cyan-600',
        primary: 'bg-gradient-to-r from-blue-500 to-blue-600'
    };
</script>

<div class="space-y-2">
    {#if label}
        <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-foreground">{label}</p>
            <p class="text-sm text-muted-foreground">{current} / {max}</p>
        </div>
    {/if}
    <div class="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
            class="h-full {variants[variant]} transition-all duration-500"
            style="width: {percentage}%"
        />
    </div>
</div>