<script>
	import { ArrowRight, Share2, Zap, BookOpen, Code2, Users, Briefcase, CircleAlert } from 'lucide-svelte';
	import GapCard from '$lib/components/GapCard.svelte';
	import MilestoneNode from '$lib/components/MilestoneNode.svelte';
	import SkillBadge from '$lib/components/SkillBadge.svelte';
	import XPProgressBar from '$lib/components/XPProgressBar.svelte';
	import StreakTracker from '$lib/components/StreakTracker.svelte';

	let roadmapElement;

	const profile = {
		role: 'Mid-level Frontend Developer',
		level: 4,
		maxLevel: 10,
		targetRole: 'Senior Engineer at a FAANG',
		skills: ['React', 'TypeScript', 'CSS']
	};

	const gaps = [
		{
			title: 'System Design',
			severity: 'critical',
			description:
				'FAANG interviews heavily weight system design. You need to understand distributed systems, scalability patterns, and architectural tradeoffs.',
			currentLevel: 2,
			requiredLevel: 8
		},
		{
			title: 'Data Structures & Algorithms',
			severity: 'critical',
			description:
				'Strong DSA skills are essential for passing technical interviews at top companies. Focus on trees, graphs, and dynamic programming.',
			currentLevel: 4,
			requiredLevel: 9
		},
		{
			title: 'Leadership & Communication',
			severity: 'important',
			description:
				'Senior roles require strong soft skills. Practice articulating technical decisions and mentoring others.',
			currentLevel: 5,
			requiredLevel: 7
		},
		{
			title: 'Backend Development',
			severity: 'important',
			description:
				'Full-stack capabilities make you more versatile. Learn Node.js, databases, and API design patterns.',
			currentLevel: 3,
			requiredLevel: 6
		},
		{
			title: 'Testing Best Practices',
			severity: 'nice-to-have',
			description:
				'Solid testing skills demonstrate engineering maturity. Learn unit, integration, and E2E testing strategies.',
			currentLevel: 4,
			requiredLevel: 6
		}
	];

	const milestones = [
		{
			title: 'Master DSA Fundamentals',
			icon: Code2,
			isUnlocked: true,
			isCompleted: false,
			whatToLearn: 'Focus on arrays, linked lists, trees, and basic graph algorithms. Practice 2-3 LeetCode problems daily.',
			estimatedTime: '4-6 weeks',
			resources: [
				{ title: 'LeetCode', url: 'https://leetcode.com' },
				{ title: 'NeetCode', url: 'https://neetcode.io' },
				{ title: 'AlgoExpert', url: 'https://algoexpert.io' }
			]
		},
		{
			title: 'Learn System Design',
			icon: Zap,
			isUnlocked: false,
			whatToLearn: 'Study distributed systems, caching, load balancing, and database design patterns.',
			estimatedTime: '6-8 weeks',
			resources: [
				{ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
				{ title: 'Designing Data Apps', url: 'https://dataintensive.net' }
			]
		},
		{
			title: 'Build Leadership Skills',
			icon: Users,
			isUnlocked: false,
			whatToLearn: 'Practice tech talks, mentor junior developers, and lead small projects.',
			estimatedTime: 'Ongoing',
			resources: [
				{ title: 'Staff Engineer Guide', url: 'https://staffeng.com' }
			]
		},
		{
			title: 'Land Your Dream Role',
			icon: Briefcase,
			isUnlocked: false,
			whatToLearn: 'Apply to target companies, practice behavioral interviews, negotiate offers.',
			estimatedTime: '2-3 months',
			resources: [
				{ title: 'Levels.fyi', url: 'https://levels.fyi' },
				{ title: 'Blind', url: 'https://teamblind.com' }
			]
		}
	];

	const streak = [true, true, true, false, true, true, false];

	const priorityTasks = [
		{ text: 'Complete 3 LeetCode medium problems', done: true },
		{ text: 'Watch system design video on caching', done: false },
		{ text: 'Practice explaining a past project', done: false }
	];

	const scrollToRoadmap = () => {
		roadmapElement?.scrollIntoView({ behavior: 'smooth' });
	};

	const handleRestart = () => {
		console.log('Restart workout');
	};
</script>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
		<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
			<h1 class="text-xl font-bold text-primary">LevelUp</h1>
			<div class="flex items-center gap-3">
				<button
					class="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
				>
					<Share2 class="w-4 h-4" />
					Share
				</button>
				<button
					on:click={handleRestart}
					class="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors"
				>
					Start Over
				</button>
			</div>
		</div>
	</header>

	<div class="max-w-7xl mx-auto px-6 py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<!-- Main content -->
			<main class="flex-1 space-y-8">
				<!-- Profile Summary Card -->
				<section class="bg-card text-card-foreground rounded-3xl p-8 border border-border">
					<div class="flex flex-col md:flex-row md:items-center gap-6">
						<div class="flex-1 space-y-4">
							<div>
								<p class="text-sm text-muted-foreground mb-1">Your current role</p>
								<h2 class="text-2xl font-bold">{profile.role}</h2>
							</div>

							<div class="flex items-center gap-3 flex-wrap">
								<span class="px-4 py-2 bg-accent text-accent-foreground rounded-full font-bold text-sm">
									Level {profile.level} of {profile.maxLevel}
								</span>
								<div class="flex gap-2 flex-wrap">
									{#each profile.skills as skill}
										<SkillBadge label={skill} />
									{/each}
								</div>
							</div>
						</div>

						<div class="md:text-right space-y-2">
							<p class="text-sm text-muted-foreground">Target role</p>
							<div class="flex items-center gap-2 text-lg font-semibold">
								<ArrowRight class="w-5 h-5 text-primary flex-shrink-0" />
								{profile.targetRole}
							</div>
						</div>
					</div>

					<div class="mt-6">
						<XPProgressBar
							current={profile.level}
							max={profile.maxLevel}
							label="Progress to goal"
							variant="accent"
						/>
					</div>
				</section>

				<!-- Gap Analysis Section -->
				<section class="space-y-6">
					<div class="flex items-center gap-3">
						<CircleAlert class="w-6 h-6 text-destructive" />
						<h2 class="text-2xl font-bold text-foreground">What's holding you back</h2>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						{#each gaps as gap, index}
							<div>
								<GapCard {...gap} onFix={scrollToRoadmap} />
							</div>
						{/each}
					</div>
				</section>

				<!-- Career Roadmap Section -->
				<section bind:this={roadmapElement} class="space-y-6">
					<div class="flex items-center gap-3">
						<BookOpen class="w-6 h-6 text-accent" />
						<h2 class="text-2xl font-bold text-foreground">Your Career Roadmap</h2>
					</div>

					<div class="bg-card/50 rounded-3xl p-8 border border-border overflow-x-auto">
						<div class="flex items-center justify-between min-w-[600px] lg:min-w-full relative gap-4">
							<!-- Connecting line -->
							<svg
								class="absolute top-8 left-8 right-8 h-1 pointer-events-none hidden lg:block"
								style="width: calc(100% - 64px)"
							>
								<line
									x1="0"
									y1="0"
									x2="100%"
									y2="0"
									stroke="currentColor"
									stroke-width="2"
									stroke-dasharray="8 8"
									class="text-border"
								/>
							</svg>

							{#each milestones as milestone, index}
								<div class="relative z-10">
									<MilestoneNode {...milestone} />
								</div>
							{/each}
						</div>
					</div>
				</section>
			</main>

			<!-- Sidebar (desktop) -->
			<aside class="w-full lg:w-80 space-y-6">
				<div>
					<StreakTracker days={streak} />
				</div>

				<div class="bg-card text-card-foreground rounded-2xl p-4 border border-border">
					<div class="flex items-center gap-2 mb-4">
						<Zap class="w-5 h-5 text-primary" />
						<span class="font-bold">Your #1 priority this week</span>
					</div>

					<div class="space-y-3">
						{#each priorityTasks as task, index}
							<label class="flex items-center gap-3 cursor-pointer">
								<div
									class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors {task.done
										? 'bg-primary border-primary'
										: 'border-muted-foreground'}"
								>
									{#if task.done}
										<span class="text-primary-foreground text-xs">✓</span>
									{/if}
								</div>
								<span
									class="text-sm {task.done
										? 'line-through text-muted-foreground'
										: 'text-card-foreground'}"
								>
									{task.text}
								</span>
							</label>
						{/each}
					</div>
				</div>

				<button
					class="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl transition-all hover:scale-105"
				>
					<Share2 class="w-4 h-4" />
					Share my roadmap
				</button>
			</aside>
		</div>
	</div>
</div>
