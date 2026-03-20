<script>
    import { CircleAlert } from 'lucide-svelte';
    import XPProgressBar from './XPProgressBar.svelte';

    let { title = '', severity = 'important', description = '', currentLevel = 0, requiredLevel = 10, onFix = () => {} } = $props();

    const severityColors = {
        critical: {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            badge: 'bg-red-500/20 text-red-600 dark:text-red-400',
            icon: 'text-red-600 dark:text-red-400'
        },
        important: {
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
            badge: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
            icon: 'text-orange-600 dark:text-orange-400'
        },
        'nice-to-have': {
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
            icon: 'text-blue-600 dark:text-blue-400'
        }
    };

    const colors = severityColors[severity];
</script>

<div class="p-6 rounded-2xl border {colors.bg} {colors.border} hover:border-opacity-60 transition-all">
    <div class="flex items-start gap-3 mb-4">
        <CircleAlert class="w-5 h-5 {colors.icon} flex-shrink-0 mt-0.5" />
        <div class="flex-1">
            <h3 class="font-bold text-foreground mb-1">{title}</h3>
            <span class="inline-block px-2 py-1 rounded text-xs font-medium {colors.badge}">
                {severity.replace('-', ' ')}
            </span>
        </div>
    </div>

    <p class="text-sm text-muted-foreground mb-4">{description}</p>

    <div class="mb-4">
        <XPProgressBar
            current={currentLevel}
            max={requiredLevel}
            label="Your progress"
            variant="accent"
        />
    </div>

    <button
        on:click={onFix}
        class="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-medium transition-colors"
    >
        See how to improve
    </button>
</div>