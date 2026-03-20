<script>
    import { Flame } from 'lucide-svelte';

    let { days = [true, true, true, false, true, true, false] } = $props();

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentStreak = days.filter((d) => d).length;
</script>

<div class="bg-card rounded-2xl p-4 border border-border">
    <div class="flex items-center gap-2 mb-4">
        <Flame class="w-5 h-5 text-orange-500" />
        <span class="font-bold text-foreground">This week</span>
    </div>

    <div class="grid grid-cols-7 gap-2">
        {#each days as completed, index}
            <div class="text-center">
                <p class="text-xs text-muted-foreground mb-1">{dayLabels[index]}</p>
                <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all {completed
                        ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-md'
                        : 'bg-secondary text-muted-foreground'}"
                >
                    {completed ? '✓' : '○'}
                </div>
            </div>
        {/each}
    </div>

    <div class="mt-4 pt-4 border-t border-border">
        <p class="text-sm text-muted-foreground mb-1">Current streak</p>
        <p class="text-2xl font-bold text-orange-500">{currentStreak} days</p>
    </div>
</div>