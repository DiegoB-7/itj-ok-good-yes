<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { ArrowRight, Users, User } from '@lucide/svelte';
  import FloatingOrbs from '$lib/components/FloatingOrbs.svelte';
  import logo from "$lib/assets/MentorIAlogolong.svg";

  interface Props {
    onStart: () => void;
  }

  let { onStart }: Props = $props();
</script>

<div class="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
  <FloatingOrbs />

  <div class="relative z-10 max-w-2xl text-center space-y-8">
    <!-- Logo -->
    <div in:fly={{ y: -20, duration: 600 }} class="mb-8">
      <!-- <h1 class="text-8xl font-bold text-[var(--color-primary)] font-[var(--font-family-avenir)]">MentorIA</h1> -->
    <img src={logo} alt="logo" />
  </div>

    <!-- Main headline -->
    <h2
      in:fly={{ y: 20, duration: 600, delay: 200 }}
      class="text-4xl md:text-6xl font-bold leading-tight text-balance text-(--color-secondary)"
    >
      Discover exactly what's holding you back
    </h2>

    <!-- Subheadline -->
    <p
      in:fly={{ y: 20, duration: 600, delay: 400 }}
      class="md:text-xl text-muted-foreground font-(--font-family-avenir)"
      >
      A quick <strong class="text-foreground">5-minute </strong> voice interview that builds your personalized career roadmap
    </p>

    <!-- CTA Button -->
    <div in:fly={{ y: 10, duration: 600, delay: 600 }}>
      <button
        onclick={onStart}
        class="btn-pressable inline-flex items-center gap-3 px-10 py-6 cursor-pointer
               bg-gradient-primary font-(--font-family-avenir) rounded-full
               shadow-[0_0_30px_rgba(4,162,143,0.4)] hover:shadow-[0_0_50px_rgba(4,162,143,0.6)]
               transition-shadow text-white text-lg"
      >
        Start my interview
        <ArrowRight class="w-5 h-5 font-bold" />
      </button>
    </div>

    <!-- Social proof -->
    <div in:fade={{ duration: 600, delay: 800 }} class="flex items-center justify-center gap-2 pt-8">
      <div class="flex -space-x-2">
        {#each Array(4) as _, i}
          <div
            class="w-8 h-8 rounded-full bg-gradient-primary from-accent to-primary border-2 border-white flex items-center justify-center text-white text-xs font-bold"
          > <User class="w-4 h-4 color-w"/></div>
        {/each}
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <Users class="w-4 h-4" />
        <span class="md:text-xl text-muted-foreground font-(--font-family-avenir)">
          <strong class="text-foreground">12,400</strong> professionals leveled up this month
        </span>
      </div>
    </div>
  </div>
</div>