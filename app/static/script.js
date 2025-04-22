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

  // Ergebnisse anzeigen
  const resultsDiv = document.getElementById('results');
  const potentialWalletDiv = document.getElementById('potential-wallet');
  const tweetsDiv = document.getElementById('tweets');
  const onChainDataDiv = document.getElementById('on-chain-data');

  // Alte Ergebnisse löschen
  potentialWalletDiv.innerHTML = '';
  tweetsDiv.innerHTML = '';
  onChainDataDiv.innerHTML = '';

  try {
    // API-Anfrage senden
    const response = await fetch('/api/analyze/rule-based', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, post_count: postCount, blockchain }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    // Ergebnisse anzeigen
    potentialWalletDiv.innerHTML = `<strong>Potential Wallet:</strong> ${data.potential_wallet || 'None'}`;
    tweetsDiv.innerHTML = `<strong>Tweets:</strong><ul>${data.tweets.map(tweet => `<li>${tweet.text}</li>`).join('')}</ul>`;
    onChainDataDiv.innerHTML = `<strong>On-Chain Data:</strong><ul>${data.on_chain_data.map(tx => `<li>${tx.transaction_id} - ${tx.amount} (${tx.block_time})</li>`).join('')}</ul>`;

    resultsDiv.classList.remove('hidden');
  } catch (error) {
    alert(`Error during analysis: ${error.message}`);
  }
});
