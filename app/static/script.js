document.getElementById("sentimentForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = document.getElementById("query").value;
    const blockchain = document.getElementById("blockchain").value;

    // Zeige Ladeanzeige
    document.getElementById("result").innerHTML = "<p>Die Analyse wird durchgeführt...</p>";

    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, blockchain }),
        });
        const data = await response.json();

        let resultHtml = `
            <p><strong>Analyse für Suchbegriff:</strong> ${data.query}</p>
            <p><strong>Sentiment-Wert:</strong> ${data.sentiment_score.toFixed(2)}</p>
            <p><strong>Blockchain:</strong> ${data.on_chain_data.length > 0 ? data.on_chain_data[0].blockchain : "Keine Daten"}</p>
        `;

        if (data.on_chain_data && data.on_chain_data.length > 0) {
            resultHtml += "<h3>On-Chain-Daten:</h3><ul>";
            data.on_chain_data.forEach(tx => {
                resultHtml += `<li>${tx.type}: ${tx.amount} (${tx.blockchain})</li>`;
            });
            resultHtml += "</ul>";
        } else {
            resultHtml += "<p>Keine On-Chain-Daten gefunden.</p>";
        }

        document.getElementById("result").innerHTML = resultHtml;
    } catch (error) {
        console.error("Fehler bei der API-Anfrage:", error);
        document.getElementById("result").innerHTML = `
            <p>Fehler bei der Analyse. Bitte versuchen Sie es erneut.</p>
        `;
    }
});
