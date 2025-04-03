document.getElementById("sentimentForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const postCount = parseInt(document.getElementById("post_count").value);
    const crypto = document.getElementById("crypto").value;

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, post_count: postCount, crypto }),
        });
        const data = await response.json();

        document.getElementById("result").innerHTML = `
            <p><strong>Analyse für Benutzer:</strong> ${data.username}</p>
            <p><strong>Anzahl der analysierten Posts:</strong> ${data.post_count}</p>
            <p><strong>Kryptowährung:</strong> ${data.crypto}</p>
            <p><strong>Sentiment-Wert:</strong> ${data.sentiment_score.toFixed(2)}</p>
            <p><strong>On-Chain-Daten:</strong></p>
            <ul>
                ${data.on_chain_data.map(tx => `<li>${tx.type}: ${tx.amount} ${data.crypto} (${new Date(tx.block_time * 1000).toLocaleString()})</li>`).join("")}
            </ul>
        `;
    } catch (error) {
        console.error("Fehler bei der API-Anfrage:", error);
        document.getElementById("result").innerHTML = `
            <p>Fehler bei der Analyse. Bitte versuchen Sie es erneut.</p>
        `;
    }
});
