document.getElementById('analysis-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  // Formulardaten sammeln
  const username = document.getElementById('username').value.trim();
  const postCount = parseInt(document.getElementById('post_count').value, 10);
  const blockchain = document.getElementById('blockchain').value;

  if (!username || !postCount || !blockchain) {
    alert('Please fill in all fields.');
    return;
  }

  // Ladeanzeige starten
  const statusDiv = document.getElementById('status');
  statusDiv.innerHTML = "Starting analysis...";
  statusDiv.classList.remove('hidden');

  try {
    // API-Anfrage senden
    const response = await fetch('/api/analyze/rule-based', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, post_count: postCount, blockchain }),
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const { job_id } = await response.json();

    // Überprüfe den Status der Analyse
    const interval = setInterval(async () => {
      const statusResponse = await fetch(`/api/analysis/status/${job_id}`);
      const statusData = await statusResponse.json();
      statusDiv.innerHTML = `Status: ${statusData.status}`;

      if (statusData.status === "Completed" || statusData.status.startsWith("Failed")) {
        clearInterval(interval); // Stoppe die Statusüberprüfung
        if (statusData.status === "Completed") {
          // Ergebnisse abrufen
          fetchResults();
        }
      }
    }, 2000); // Überprüfe den Status alle 2 Sekunden
  } catch (error) {
    alert(`Error starting analysis: ${error.message}`);
    statusDiv.innerHTML = "Analysis failed to start.";
  }
});
