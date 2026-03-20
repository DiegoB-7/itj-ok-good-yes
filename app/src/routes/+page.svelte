<script lang="ts">
  import { fade } from 'svelte/transition';
  import InterviewScreen  from '$lib/ui/components/interview/InterviewScreen.component.svelte';
  import AnalyzingScreen  from '$lib/ui/components/analyzing/AnalyzingScreen.component.svelte';
  import ResultsScreen    from '$lib/ui/components/results/ResultsScreen.component.svelte';
  import type { QAPair, CareerAnalysis } from '$lib/interfaces/types.interface';
  import LandingScreen from '$lib/ui/components/landing/LandingScreen.component.svelte';

  type Screen = 'landing' | 'interview' | 'analyzing' | 'results';

  let screen   = $state<Screen>('landing');
  let answers  = $state<QAPair[]>([]);
  let analysis = $state<CareerAnalysis | null>(null);
  let errMsg   = $state<string | null>(null);

  // Called by InterviewScreen when all 5 questions are answered
  function onInterviewComplete(collected: QAPair[]) {
    answers = collected;
    screen  = 'analyzing';
    errMsg  = null;
  }

  // Called by AnalyzingScreen when Groq returns the career analysis
  function onAnalysisComplete(result: CareerAnalysis) {
    analysis = result;
    screen   = 'results';
  }

  // Called by AnalyzingScreen if the Groq request fails
  function onAnalysisError(msg: string) {
    errMsg = msg;
    screen = 'interview'; // send back so user can retry
  }

  function restart() {
    answers  = [];
    analysis = null;
    errMsg   = null;
    screen   = 'interview';
  }
</script>

<!-- Error toast -->
{#if errMsg}
  <div
    in:fade={{ duration: 250 }}
    class="fixed top-5 inset-x-0 z-50 flex justify-center px-4"
  >
    <div class="bg-destructive text-destructive-foreground px-5 py-3 rounded-2xl
                shadow-xl text-sm font-medium max-w-sm text-center">
      ⚠️ {errMsg}
    </div>
  </div>
{/if}

{#key screen}
  <div in:fade={{ duration: 300 }} out:fade={{ duration: 200 }}>

    {#if screen === 'interview'}
      <InterviewScreen onComplete={onInterviewComplete} />

    {:else if screen === 'analyzing'}
      <AnalyzingScreen
        {answers}
        onComplete={onAnalysisComplete}
        onError={onAnalysisError}
    />

    {:else if screen === 'landing'}
      <LandingScreen onStart={() => (screen = 'interview')} />

    {:else if screen === 'results' && analysis}
      <ResultsScreen {analysis} onRestart={restart} />
    {/if}

  </div>
{/key}