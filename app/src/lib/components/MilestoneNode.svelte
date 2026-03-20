<script>
    let { title = '', icon = null, isUnlocked = false, isCompleted = false, whatToLearn = '', estimatedTime = '', resources = [] } = $props();

    let showDetails = false;
</script>

<div class="flex flex-col items-center">
    <button
        on:click={() => (showDetails = !showDetails)}
        class="relative z-20 mb-4 transition-all {isUnlocked
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-50'}"
    >
        <div
            class="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all {isCompleted
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg'
                : isUnlocked
                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg'
                    : 'bg-secondary border-2 border-border'}"
        >
            {#if isCompleted}
                <span>✓</span>
            {:else if icon}
                <svelte:component this={icon} class="w-8 h-8" />
            {:else}
                <span>→</span>
            {/if}
        </div>
    </button>

    <div class="text-center mb-2">
        <h3 class="font-bold text-sm text-foreground w-32 line-clamp-2">{title}</h3>
    </div>

    {#if showDetails && isUnlocked}
        <div
            class="absolute top-full mt-2 w-72 bg-card rounded-2xl p-4 shadow-lg border border-border z-30"
        >
            <h4 class="font-bold text-foreground mb-2">What to learn:</h4>
            <p class="text-sm text-muted-foreground mb-4">{whatToLearn}</p>

            <p class="text-xs text-muted-foreground mb-3">
                <span class="font-semibold">Estimated time:</span> {estimatedTime}
            </p>

            {#if resources.length > 0}
                <div>
                    <p class="text-xs font-semibold text-foreground mb-2">Resources:</p>
                    <ul class="space-y-1">
                        {#each resources as resource}
                            <li>
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-xs text-cyan-500 hover:underline"
                                >
                                    → {resource.title}
                                </a>
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
        </div>
    {/if}
</div>