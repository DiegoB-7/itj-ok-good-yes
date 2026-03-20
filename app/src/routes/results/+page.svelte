<script>
  import ResultsScreen from '$lib/components/levelup/screens/ResultsScreen.svelte';

  function handleRestart() {
    console.log('Restarting...');
    // Aquí puedes agregar la lógica para reiniciar la entrevista
  }
</script>

<ResultsScreen onRestart={handleRestart} />
