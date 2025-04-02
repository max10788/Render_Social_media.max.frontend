document.getElementById("sentimentForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = document.getElementById("query").value;

    try {
        const response = await fetch("/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        const data = await response.json();

        let resultHtml = `
            <p><strong>Analyse für Suchbegriff:</strong> ${data.query}</p>
            <p><strong>Sentiment-Wert:</strong> ${data.sentiment_score.toFixed(2)}</p>
            <p>
                Dieser Wert basiert auf einer On-Chain-Analyse von Social-Media-Daten 
                auf der Plattform X (früher Twitter). Die Analyse berücksichtigt öffentlich 
                verfügbare Tweets und wertet deren Stimmung in Echtzeit aus.
            </p>
        `;

        if (data.on_chain_data && data.on_chain_data.length > 0) {
            resultHtml += "<h3>On-Chain-Daten:</h3><ul>";
            data.on_chain_data.forEach(tx => {
                resultHtml += `<li>${tx.type}: ${tx.amount} SOL (Zeitpunkt: ${new Date(tx.blockTime * 1000).toLocaleString()})</li>`;
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
